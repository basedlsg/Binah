import os
import uuid
import asyncio
import time # For timing metrics
import json
import re
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import structlog
from pydantic import ValidationError
from typing import Optional, Dict, Any, Tuple, List # Added Tuple for type hint and List for processing_errors
from pathlib import Path # For SCRIPT_DIR
from datetime import datetime, timezone

# Relative imports for models and services
from backend.models import ( # Backend Pydantic models
    AnalyzeRequest, AnalyzeResponse, ErrorClassificationResponse, 
    AutoFixData, AutoFixActionDetails, MetricsResponse, DataSourceResponse, ConfigModel
)
from .demo_cache import DEMO_RESPONSES # Import demo cache

# RAG components
from rag.embeddings import GeminiEmbeddingGenerator, TASK_TYPE_RETRIEVAL_QUERY
from rag.retrieval import DocumentRetriever
from rag.vector_store import ChromaVectorStore
# Llama components
from llama.client import LlamaAPIClient
from llama.models import LlamaCompletionResponse # Llama specific output model for parsing

# --- Environment & Logging Setup ---
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT_DIR = SCRIPT_DIR.parent 
dotenv_path = PROJECT_ROOT_DIR / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

structlog.configure(
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.dev.ConsoleRenderer(),
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
logger = structlog.get_logger(__name__)

app = Flask(__name__)

# Add CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# --- Application Configuration & Service Initialization ---
try:
    # Load configuration from environment variables
    import os
    config_data = {
        "llama_api_key": os.getenv("LLAMA_API_KEY"),
        "gemini_api_key": os.getenv("GEMINI_API_KEY"),
        "llama_api_base_url": os.getenv("LLAMA_API_BASE_URL"),        "backend_url": os.getenv("BACKEND_URL", "http://localhost:8000"),
        "chroma_db_path": os.getenv("CHROMA_DB_PATH", "./chroma_db_store"),
        "classification_model_name": os.getenv("CLASSIFICATION_MODEL_NAME", "Llama-4-Scout-17B-16E-Instruct-FP8"),
        "fix_generation_model_name": os.getenv("FIX_GENERATION_MODEL_NAME", "Llama-4-Maverick-17B-128E-Instruct-FP8"),
        "max_tokens_classification": int(os.getenv("MAX_TOKENS_CLASSIFICATION", "1000")),
        "max_tokens_fix": int(os.getenv("MAX_TOKENS_FIX", "2048")),
        "temperature": float(os.getenv("LLAMA_TEMPERATURE", "0.2")),
        "rag_num_retrieved_docs": int(os.getenv("RAG_NUM_RETRIEVED_DOCS", "3")),
        "llama_log_excerpt_max_chars": int(os.getenv("LLAMA_LOG_EXCERPT_MAX_CHARS", "2000"))
    }
    config = ConfigModel(**config_data)
    logger.info("Configuration loaded successfully.", classification_model=config.classification_model_name, fix_model=config.fix_generation_model_name)
except ValidationError as e:
    logger.error("FATAL: Configuration validation error. Check .env variables or ConfigModel defaults.", errors=e.errors(), exc_info=True)
    raise SystemExit("Configuration error, exiting.") from e

gemini_embedder: Optional[GeminiEmbeddingGenerator] = None
vector_store: Optional[ChromaVectorStore] = None
document_retriever: Optional[DocumentRetriever] = None

try:
    if config.gemini_api_key:
        gemini_embedder = GeminiEmbeddingGenerator()
        # Ensure chroma_db_path from config is used, defaulting if not set in .env
        chroma_db_actual_path = config.chroma_db_path if config.chroma_db_path else str(PROJECT_ROOT_DIR / "chroma_db_store")
        vector_store = ChromaVectorStore(path=chroma_db_actual_path, collection_name="unreal_quest_forum_data_v1")
        document_retriever = DocumentRetriever(embedding_generator=gemini_embedder, vector_store=vector_store)
        logger.info("Core RAG components initialized.", chroma_db_path=chroma_db_actual_path)
    else:
        logger.warning("Gemini API Key not found. RAG components not initialized.")
except Exception as e_init_rag:
    logger.error("Error initializing RAG components. RAG features unavailable.", error=str(e_init_rag), exc_info=True)

if not config.llama_api_key or config.llama_api_base_url == 'YOUR_LLAMA_API_BASE_URL_HERE':
    logger.warning("Llama API Key or Base URL not fully configured. Llama features will fail.")

# --- Helper function for Llama JSON parsing (as provided by user) ---
def extract_json_from_llama_response(response_text: Optional[str]) -> Optional[Dict[Any, Any]]:
    """Extract JSON from Llama's response, handling various formats."""
    if not response_text:
        return None
    
    response_text = response_text.strip()
    # 1. Try direct JSON parsing first (if Llama returns perfect JSON)
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        logger.debug("Direct JSON parsing failed for Llama response", text_start_snippet=response_text[:100])
    
    # 2. Try to extract JSON from markdown code blocks (e.g., ```json ... ``` or ``` ... ```)
    # Regex to find content within ```json ... ``` or ``` ... ```, handles multi-line JSON
    json_pattern = r'```(?:json)?\s*(\{[\s\S]*?\})\s*```' 
    matches = re.findall(json_pattern, response_text, re.DOTALL)
    if matches:
        for match_str in matches:
            try:
                return json.loads(match_str)
            except json.JSONDecodeError:
                logger.debug("Failed to parse JSON from a markdown block match", snippet=match_str[:100])
                continue # Try next match if multiple markdown blocks exist
        logger.warning("Found markdown JSON blocks but none were parsable.", first_match_snippet=matches[0][:100] if matches else "N/A")

    # 3. Try to find the first '{' and last '}' to extract a JSON object
    # This is a common fallback but can be brittle if there are other braces in the text.
    try:
        first_brace = response_text.find('{')
        last_brace = response_text.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            potential_json_str = response_text[first_brace : last_brace + 1]
            # Basic validation: ensure it at least looks like a JSON object.
            if potential_json_str.strip().startswith('{') and potential_json_str.strip().endswith('}'):
                return json.loads(potential_json_str)
            else:
                 logger.debug("Substring between first/last braces does not form a JSON object.", snippet=potential_json_str[:100])
        else:
            logger.debug("Could not find embracing curly braces for JSON object in text.")
    except json.JSONDecodeError:
        logger.debug("Failed parsing substring between braces", snippet=response_text[first_brace:last_brace+1][:100] if first_brace !=-1 else "N/A")
    except Exception as e_brace_parse: # Catch any other unexpected error during this parsing attempt
        logger.error("Exception while parsing brace-enclosed JSON", error=str(e_brace_parse), exc_info=True)
    
    # 4. Fallback: Try to extract key-value pairs using regex (as per user's original function)
    # This is very specific and should ideally not be reached if prompts are good.
    result = {}
    # Added re.IGNORECASE for flexibility with key casing from Llama
    error_type_match = re.search(r'["\']error_type["\']?\s*:\s*["\']?(\w+)["\']?', response_text, re.IGNORECASE)
    if error_type_match: result['error_type'] = error_type_match.group(1)
    
    confidence_match = re.search(r'["\']confidence["\']?\s*:\s*([0-9.]+)', response_text, re.IGNORECASE)
    if confidence_match: 
        try: result['confidence'] = float(confidence_match.group(1))
        except ValueError: logger.warning("Could not parse regex-extracted confidence to float", value=confidence_match.group(1))
    
    fixable_match = re.search(r'["\']auto_fixable["\']?\s*:\s*(true|false)', response_text, re.IGNORECASE)
    if fixable_match: result['auto_fixable'] = fixable_match.group(1).lower() == 'true'
    
    if result and 'error_type' in result: # Only return if at least error_type was found by this fallback
        logger.warning("Used regex fallback for Llama response parsing (likely for classification data)", extracted_fields=list(result.keys()))
        return result

    logger.warning("All JSON parsing methods failed for Llama response.", response_start_snippet=response_text[:200])
    return None

# --- Helper Functions ---
def check_dependencies() -> bool:
    """Check if all critical dependencies are available."""
    try:
        checks = {
            "config_loaded": config is not None,
            "embedding_generator_initialized": gemini_embedder is not None,
            "vector_store_initialized": vector_store is not None,
            "document_retriever_initialized": document_retriever is not None,
            "gemini_api_key_present": bool(config.gemini_api_key if config else False),
            "llama_api_key_present": bool(config.llama_api_key if config else False),
            "llama_api_base_url_configured": bool(config.llama_api_base_url != 'YOUR_LLAMA_API_BASE_URL_HERE' if config else False)
        }
        return all(checks.values())
    except Exception as e:
        logger.error("Error checking dependencies", error=str(e))
        return False

async def analyze_screenshot(screenshot_data: str, description: Optional[str], log_content: str) -> Tuple[str, List[str]]:
    """
    Analyze a screenshot using Gemini's vision capabilities.
    
    Args:
        screenshot_data: Base64 encoded image data
        description: Optional user description of the screenshot
        log_content: Related log content for context
        
    Returns:
        Tuple of (analysis_text, visual_indicators_list)
    """
    try:
        import google.generativeai as genai
        import base64
        import io
        from PIL import Image
        
        # Configure Gemini
        genai.configure(api_key=config.gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Decode the base64 image
        image_data = base64.b64decode(screenshot_data)
        image = Image.open(io.BytesIO(image_data))
        
        # Create analysis prompt
        prompt = f"""
        Analyze this Unreal Engine screenshot for debugging Quest VR development issues.
        
        User description: {description or "No description provided"}
        
        Related log excerpt: {log_content[:500]}...
        
        Focus on:
        1. Error dialogs, warnings, or red indicators
        2. Console output panels showing errors
        3. Project settings that might be misconfigured
        4. Build/packaging status indicators
        5. Plugin manager issues
        6. Any visual clues related to Quest VR development
        
        Provide a concise analysis and list specific visual indicators you can see.
        """
        
        # Generate analysis
        response = model.generate_content([prompt, image])
        analysis_text = response.text
        
        # Extract visual indicators (simple keyword extraction)
        visual_indicators = []
        indicator_keywords = [
            "error dialog", "warning", "red icon", "failed", "console error",
            "plugin conflict", "build error", "packaging failed", "shader error",
            "quest", "oculus", "meta", "android", "sdk"
        ]
        
        analysis_lower = analysis_text.lower()
        for keyword in indicator_keywords:
            if keyword in analysis_lower:
                visual_indicators.append(keyword.title())
        
        logger.info("Screenshot analysis completed", indicators_found=len(visual_indicators))
        
        return analysis_text, visual_indicators
        
    except Exception as e:
        logger.error("Vision analysis failed", error=str(e))
        return f"Vision analysis failed: {str(e)}", []

# --- Routes ---
@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called")
    db_count = -1
    db_status = "unavailable"
    try:
        db_count = vector_store.get_collection_count()
        db_status = "available"
        logger.info("Vector store connection healthy for health check.", count=db_count)
    except Exception as e_db:
        logger.warning("Could not connect to vector store for health check.", error=str(e_db))
    
    return jsonify({
        "status": "healthy", 
        "message": "Quest Dev Copilot backend is running.",
        "timestamp": time.time(),
        "version": "1.0.0",
        "dependencies": {
            "vector_store": {"status": db_status, "documents": db_count if db_count != -1 else "N/A"},
            "gemini_api_configured": bool(config.gemini_api_key),
            "llama_api_configured": bool(config.llama_api_key and config.llama_api_base_url != 'YOUR_LLAMA_API_BASE_URL_HERE')
        }
    }), 200

@app.route('/ready', methods=['GET'])
def ready_check():
    """Check if all services are initialized and configuration is sensible."""
    dependencies_ok = check_dependencies()
    
    if dependencies_ok:
        return jsonify({
            "status": "ready",
            "dependencies": {
                "llama_api": True,
                "chroma_db": True
            }
        }), 200
    else:
        return jsonify({
            "status": "not_ready",
            "dependencies": {
                "llama_api": False,
                "chroma_db": False
            }
        }), 503

async def analyze_error_async(analyze_request: AnalyzeRequest, request_id: str) -> AnalyzeResponse:
    """Core error analysis logic that can be called from routes or tested independently."""
    start_time_total = time.perf_counter()
    processing_errors: List[str] = []
    
    # Initialize metrics
    metrics = MetricsResponse()
    
    # Check for demo mode
    if analyze_request.use_demo:
        logger.info("Demo mode requested", request_id=request_id)
        demo_data = DEMO_RESPONSES.get(analyze_request.demo_key, DEMO_RESPONSES.get("plugin_conflict"))
        
        # Add vision analysis if screenshot provided
        visual_analysis = None
        visual_indicators = None
        if analyze_request.screenshot_data:
            visual_analysis = "Demo: Screenshot shows typical Unreal Engine error dialog with red error indicators"
            visual_indicators = ["Error dialog visible", "Red warning icons", "Console output panel"]
        
        return AnalyzeResponse(
            request_id=demo_data.get("request_id", request_id),
            classification=ErrorClassificationResponse(**demo_data["classification"]),
            fix=demo_data.get("fix"),
            auto_fix=AutoFixData(**demo_data["auto_fix"]) if demo_data.get("auto_fix") else None,
            sources=[DataSourceResponse(**s) for s in demo_data.get("sources", [])],
            metrics=MetricsResponse(**demo_data.get("metrics", {})),
            processing_errors=demo_data.get("processing_errors"),
            visual_analysis=visual_analysis,
            visual_indicators=visual_indicators
        )

    # Step 1: Vision Analysis (if screenshot provided)
    visual_analysis = None
    visual_indicators = None
    if analyze_request.screenshot_data:
        try:
            visual_analysis, visual_indicators = await analyze_screenshot(
                analyze_request.screenshot_data,
                analyze_request.screenshot_description,
                analyze_request.log_content
            )
            logger.info("Screenshot analysis completed", request_id=request_id)
        except Exception as e:
            logger.error("Screenshot analysis failed", error=str(e), request_id=request_id)
            processing_errors.append(f"Screenshot analysis failed: {str(e)}")

    # Step 2: RAG Document Retrieval
    log_excerpt_for_rag = analyze_request.log_content[:2000]  # Limit for efficiency
    try:
        retrieved_docs = await document_retriever.retrieve_relevant_documents(
            query_text=log_excerpt_for_rag, 
            n_results=3
        )
        retrieved_sources_data = [
            DataSourceResponse(
                source_type=doc.get("source_type", "forum"),
                title=doc.get("title", "Untitled"),
                url=doc.get("url", ""),
                relevance_score=doc.get("score", 0.0),
                content_snippet=doc.get("content", "")[:300] + "..." if len(doc.get("content", "")) > 300 else doc.get("content", "")
            ) for doc in retrieved_docs
        ]
        rag_context_str = "\n\n".join([f"Source: {doc.get('title', 'Unknown')}\n{doc.get('content', '')}" for doc in retrieved_docs])
        logger.info("RAG retrieval completed", request_id=request_id, num_sources=len(retrieved_docs))
    except Exception as e:
        logger.error("RAG retrieval failed", error=str(e), request_id=request_id)
        retrieved_sources_data = []
        rag_context_str = ""
        processing_errors.append(f"RAG retrieval failed: {str(e)}")

    # Step 3: Llama Classification (Scout model)
    log_excerpt_for_llama = analyze_request.log_content[:1500]
    classification_prompt = f"""
    Context from forums: {rag_context_str[:1000]}
    
    {"Visual context: " + visual_analysis if visual_analysis else ""}
    
    Error log excerpt: {log_excerpt_for_llama}
    
    Classify this Unreal Engine Quest VR error. Respond with JSON:
    {{
        "error_type": "plugin_conflict|sdk_mismatch|black_screen|packaging_error|shader_compile",
        "confidence": 0.0-1.0,
        "description": "brief description",
        "auto_fixable": true/false,
        "key_indicators": ["list", "of", "indicators"]
    }}
    """

    error_classification_resp = ErrorClassificationResponse(error_type="classification_failed", confidence=0.0, auto_fixable=False, key_indicators=["Llama call/parse error"], explanation="Classification failed.")
    fix_suggestion_text_resp = "Fix suggestion generation skipped due to classification issues."
    auto_fix_generated_resp: Optional[AutoFixData] = None

    if config and config.llama_api_key and config.llama_api_base_url and config.llama_api_base_url != 'YOUR_LLAMA_API_BASE_URL_HERE':
        async with LlamaAPIClient(api_key=config.llama_api_key, base_url=config.llama_api_base_url) as llama_client:
            # --- Error Classification ---
            start_time_classification = time.perf_counter()
            try:
                raw_classification_output = await llama_client.generate(prompt=classification_prompt, model=config.classification_model_name, max_tokens=config.max_tokens_classification, temperature=config.temperature)
                if raw_classification_output and raw_classification_output.get_first_choice_text():
                    classification_text = raw_classification_output.get_first_choice_text()
                    parsed_data = extract_json_from_llama_response(classification_text)
                    if parsed_data:
                        try: error_classification_resp = ErrorClassificationResponse.model_validate(parsed_data); logger.info("Llama classification parsed & validated", request_id=request_id)
                        except ValidationError as ve: logger.error("Pydantic validation failed for classification JSON", errors=ve.errors(), data=parsed_data, request_id=request_id); processing_errors.append(f"Classification JSON validation: {str(ve)[:100]}")
                    else: logger.warning("Failed to parse JSON from Llama classification", raw_response=classification_text[:200], request_id=request_id); processing_errors.append("Could not parse classification JSON from Llama.")
                    if raw_classification_output.usage: metrics.tokens_used_classification = raw_classification_output.usage.total_tokens
                else: logger.error("Llama classification call failed or got empty response", request_id=request_id); processing_errors.append("Llama classification call failed.")
            except Exception as e_classify: logger.error("Exception in Llama classification stage", error=str(e_classify), exc_info=True, request_id=request_id); processing_errors.append(f"Llama Classification Exception: {str(e_classify)}")
            metrics.classification_time_ms = (time.perf_counter() - start_time_classification) * 1000

            # --- Fix Generation ---
            if error_classification_resp.auto_fixable and error_classification_resp.error_type != "classification_failed":
                start_time_fix_gen = time.perf_counter()
                try:
                    # Using error_classification_resp for error_type and confidence in prompt
                    fix_prompt = f"""You are an expert Unreal Engine developer. Provide a fix for this '{error_classification_resp.error_type}' error.
Error Explanation: {error_classification_resp.explanation}
Key Indicators: {error_classification_resp.key_indicators}

Respond with ONLY a JSON object (no other text, no markdown, just raw JSON) with two top-level keys: "instructions" and "auto_fix".
"instructions" should be a single string containing user-friendly, step-by-step markdown for a manual fix.
"auto_fix" should be a JSON object: {{{{ "action": "toggle_plugin|update_config|none", "details": {{{{ "plugin_name": "ExamplePlugin", "enabled": false }}}}, "confidence": 0.0-1.0 }}}} or null if no auto-fix applies.

Examples for "auto_fix.details":
For plugin conflicts: {{{{ "plugin_name": "PluginNameToToggle", "enabled": false_or_true }}}}
For SDK mismatches: {{{{ "file_path": "Config/DefaultEngine.ini", "section": "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]", "key": "TargetSDKVersion", "value": "32" }}}}
If no specific auto-fix action, use {{{{ "action": "none", "details": null }}}}

Context from forums (ignore if not relevant or empty):
{rag_context_str}

Error log excerpt:
```
{log_excerpt_for_llama}
```
Error classification confidence: {error_classification_resp.confidence:.0%}

JSON response:"""

                    raw_fix_output = await llama_client.generate(prompt=fix_prompt, model=config.fix_generation_model_name, max_tokens=config.max_tokens_fix, temperature=config.temperature)
                    if raw_fix_output and raw_fix_output.get_first_choice_text():
                        fix_text = raw_fix_output.get_first_choice_text()
                        parsed_fix_data = extract_json_from_llama_response(fix_text)
                        if parsed_fix_data:
                            fix_suggestion_text_resp = parsed_fix_data.get("instructions", "No detailed instructions from Llama, see raw output if available.")
                            if not fix_suggestion_text_resp.strip() and fix_text: fix_suggestion_text_resp = fix_text # Fallback to raw text if parsing fails
                            
                            auto_fix_details_json = parsed_fix_data.get("auto_fix")
                            if auto_fix_details_json and auto_fix_details_json.get("action") != "none":
                                try: auto_fix_generated_resp = AutoFixData.model_validate(auto_fix_details_json); logger.info("Llama auto-fix parsed & validated", action=auto_fix_generated_resp.action, request_id=request_id)
                                except ValidationError as ve_af: logger.error("Pydantic validation for auto_fix JSON failed", errors=ve_af.errors(), data=auto_fix_details_json, request_id=request_id); processing_errors.append(f"Auto-fix JSON validation: {str(ve_af)[:100]}")
                            else: logger.info("Llama indicated no auto_fix action or action was 'none'", request_id=request_id, auto_fix_data=auto_fix_details_json)
                        else: 
                            logger.warning("Failed to parse JSON from Llama fix response", raw_response=fix_text[:200], request_id=request_id); processing_errors.append("Could not parse fix JSON from Llama.")
                            fix_suggestion_text_resp = fix_text if fix_text else "Llama fix response was empty or unparsable." # Use raw text if parsing fails
                        if raw_fix_output.usage: metrics.tokens_used_fix_generation = raw_fix_output.usage.total_tokens
                    else: logger.error("Llama fix generation call failed or got empty response", request_id=request_id); processing_errors.append("Llama fix generation call failed.")
                except Exception as e_fix: logger.error("Exception in Llama fix generation stage", error=str(e_fix), exc_info=True, request_id=request_id); processing_errors.append(f"Llama Fix Generation Exception: {str(e_fix)}")
                metrics.fix_generation_time_ms = (time.perf_counter() - start_time_fix_gen) * 1000
    else:
        logger.warning("Llama API not configured. Skipping LLM classification and fix generation.", request_id=request_id)
        processing_errors.append("Llama API not configured.")

    metrics.total_processing_time_ms = (time.perf_counter() - start_time_total) * 1000
    final_response = AnalyzeResponse(
        request_id=request_id, 
        classification=error_classification_resp, 
        fix=fix_suggestion_text_resp, 
        auto_fix=auto_fix_generated_resp, 
        sources=retrieved_sources_data, 
        metrics=metrics, 
        processing_errors=processing_errors if processing_errors else None, 
        raw_log_summary=analyze_request.log_content[:250] + ("..." if len(analyze_request.log_content) > 250 else ""),
        visual_analysis=visual_analysis,
        visual_indicators=visual_indicators
    )
    logger.info("Analysis processing complete", request_id=request_id, final_error_type=final_response.classification.error_type, total_time_ms=metrics.total_processing_time_ms)
    return final_response

@app.route('/analyze', methods=['POST'])
async def analyze_error_route():
    """Main error analysis endpoint that coordinates RAG retrieval and Llama generation."""
    try:
        request_id = f"req_{int(time.time() * 1000)}"
        logger.info("Starting error analysis", request_id=request_id)
        
        # Parse and validate the request
        try:
            analyze_request = AnalyzeRequest.model_validate(request.json)
        except ValidationError as ve:
            logger.warning("Invalid request payload", error=str(ve))
            return jsonify({"error": "Invalid request payload"}), 400

        # Call the core analysis function
        result = await analyze_error_async(analyze_request, request_id)
        if hasattr(result, 'model_dump'):
            return jsonify(result.model_dump(mode='json')), 200
        else:
            return jsonify(result), 200

    except ValidationError as e_val:
        logger.error("Invalid analysis request payload", errors=e_val.errors(), request_id=request_id, exc_info=True)
        return jsonify({"error": "Invalid request payload", "details": e_val.errors(), "request_id": request_id}), 400
    except Exception as e_global:
        logger.error("Unexpected global error in /analyze", error=str(e_global), request_id=request_id, exc_info=True)
        return jsonify({"error": "An internal server error occurred", "details": str(e_global), "request_id": request_id}), 500

# --- Main ---
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv("FLASK_ENV", "development") == "development"
    # Use FLASK_DEBUG for Flask's native debug mode control
    # app.debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")

    logger.info("Starting Quest Dev Copilot backend", url=f"http://0.0.0.0:{port}", environment=os.getenv("FLASK_ENV"), debug_mode=debug_mode)
    app.run(host='0.0.0.0', port=port, debug=debug_mode) 