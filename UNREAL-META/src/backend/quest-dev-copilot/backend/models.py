from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import structlog

# Import ErrorClassification from llama.models if it's the primary source
# Or define it here if it's more of a general backend model.
# For now, let's assume it might be redefined or extended here for backend purposes,
# or that the backend will directly use/adapt the one from llama.models.
# To avoid circular dependencies if llama.models were to import from backend.models, 
# it's often cleaner to have shared models in a common location or define them where most relevant.
# Given ErrorClassification is a direct output of Llama as per guidelines, using from llama.models is fine.
# However, the `/analyze` response also contains it, so it's a shared model.
# Let's import it if needed or redefine a similar one for backend context.

# Re-using ErrorClassification from llama.models for consistency, assuming it's imported in the service layer.
# from ...llama.models import ErrorClassification # Placeholder for actual import path if needed

# For now, to keep this file self-contained for model definitions, let's redefine key structures
# or assume they will be composed in the route logic.

logger = structlog.get_logger(__name__)

# --- Request Models ---

class AnalyzeRequest(BaseModel):
    """Request model for the /analyze endpoint."""
    log_content: str = Field(..., min_length=1, description="The content of the Unreal Engine log to be analyzed.")
    # Potentially add other fields like: user_id, session_id, specific UE version, project_context
    ue_version: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    use_demo: Optional[bool] = Field(False, description="Flag to force demo mode response for testing.")
    
    # NEW: Screenshot/Image support
    screenshot_data: Optional[str] = Field(None, description="Base64 encoded screenshot for visual analysis")
    screenshot_description: Optional[str] = Field(None, description="User-provided description of the screenshot")

# --- Response Models (matching the structure in guidelines) ---

class ErrorClassificationResponse(BaseModel):
    """Detailed model for error classification part of the response."""
    error_type: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    auto_fixable: bool
    key_indicators: List[str]
    explanation: Optional[str] = None # Added based on Llama model, good for response

class AutoFixActionDetails(BaseModel):
    """Flexible model for the 'details' part of an auto-fix action."""
    # Common fields, specific actions might use a subset or add more
    plugin_name: Optional[str] = None
    enabled: Optional[bool] = None
    file_path: Optional[str] = None
    section: Optional[str] = None
    key: Optional[str] = None
    value: Optional[str] = None
    # Can include other specific details as a generic dict if necessary
    additional_details: Optional[Dict[str, Any]] = None

class AutoFixData(BaseModel):
    """ Structured data for an auto-fix action, as expected from Llama's fix_prompt. """
    fix_type: str = Field(..., description="The type of fix, e.g., 'config_change', 'plugin_toggle', 'none'.")
    action: Optional[str] = Field(None, description="The type of action to perform, e.g., 'toggle_plugin', 'update_config', 'none'.")
    details: Optional[AutoFixActionDetails] = Field(None, description="Specific parameters for the action.")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="LLM's confidence in this auto-fix suggestion.")
    instructions: Optional[str] = Field(None, description="Human-readable instructions for applying the fix.")
    file_changes: Optional[List[Dict[str, Any]]] = Field(None, description="List of file changes to apply.")

class DataSourceResponse(BaseModel):
    """Model for a single retrieved source/document."""
    title: str
    url: Optional[str] = None
    snippet: Optional[str] = None
    document_id: Optional[str] = None
    distance: Optional[float] = None # Relevance score from vector DB

class MetricsResponse(BaseModel):
    """Model for performance and cost metrics."""
    tokens_used_classification: Optional[int] = None
    cost_usd_classification: Optional[float] = None
    tokens_used_fix_generation: Optional[int] = None
    cost_usd_fix_generation: Optional[float] = None
    retrieval_time_ms: Optional[float] = None
    classification_time_ms: Optional[float] = None
    fix_generation_time_ms: Optional[float] = None
    total_processing_time_ms: Optional[float] = None

class AnalyzeResponse(BaseModel):
    """Full response model for the /analyze endpoint."""
    request_id: Optional[str] = None # Useful for tracking
    classification: ErrorClassificationResponse
    fix: Optional[str] = Field(None, description="Manually-readable fix suggestion from Llama's 'instructions' field.")
    auto_fix: Optional[AutoFixData] = Field(None, description="Structured data for an automated fix, if available.")
    sources: List[DataSourceResponse] = []
    metrics: Optional[MetricsResponse] = None
    # Optional fields for user feedback, errors during processing, etc.
    processing_errors: Optional[List[str]] = None 
    raw_log_summary: Optional[str] = None # e.g. first N lines, or key error lines found
    
    # NEW: Vision analysis results
    visual_analysis: Optional[str] = Field(None, description="Analysis of provided screenshot if any")
    visual_indicators: Optional[List[str]] = Field(None, description="Visual clues found in screenshot")

# --- Models for other backend entities (examples) ---

class ConfigModel(BaseModel):
    """Pydantic version of the Config dataclass from guidelines."""
    llama_api_key: str
    gemini_api_key: str
    llama_api_base_url: str
    backend_url: str = "http://localhost:8000"
    # Chroma DB Path from environment as in vector_store.py
    chroma_db_path: str = "./chroma_db_store"
    # Llama models from guidelines JSON example
    classification_model_name: str = "Llama-4-Scout-17B-16E-Instruct-FP8"
    fix_generation_model_name: str = "Llama-4-Maverick-17B-128E-Instruct-FP8"
    max_tokens_classification: int = 1000
    max_tokens_fix: int = 2048
    temperature: float = 0.2
    # New config fields for RAG and Llama prompt construction
    rag_num_retrieved_docs: int = 3
    llama_log_excerpt_max_chars: int = 2000

    # This allows loading from environment variables if pydantic-settings is used
    # or a custom loader. For now, it just defines fields that can be sourced from env.
    # class Config:
    #     env_file = ".env"
    #     env_file_encoding = "utf-8"

if __name__ == '__main__':
    # Example usage of AnalyzeRequest
    sample_request_data = {
        "log_content": "[Error] NullReferenceException: Object reference not set to an instance of an object.",
        "ue_version": "5.3"
    }
    try:
        analyze_req = AnalyzeRequest.model_validate(sample_request_data)
        print("Successfully parsed AnalyzeRequest:")
        print(f"Log Content: {analyze_req.log_content[:30]}...")
        print(f"UE Version: {analyze_req.ue_version}")
    except Exception as e:
        print(f"Error parsing AnalyzeRequest: {e}")

    # Example usage of AnalyzeResponse
    sample_analyze_response_data_updated = {
        "request_id": "req_12345",
        "classification": {
            "error_type": "NullReferenceException",
            "confidence": 0.98,
            "auto_fixable": True, # This might guide if backend *tries* to get auto_fix_generated
            "key_indicators": ["NullReferenceException", "object reference not set"],
            "explanation": "A variable was used before it was initialized."
        },
        "fix_suggestion_text": "Ensure the variable 'myObject' is initialized before use, e.g., myObject = new MyObject();",
        "auto_fix_generated": { # New structure
            "action": "update_config", # Example action
            "details": {
                "file_path": "MyClass.cs", 
                "line_number": 50, 
                "change_from": "MyObject myObject;", 
                "change_to": "MyObject myObject = new MyObject();"
            },
            "confidence": 0.9
        },
        "relevant_sources": [
            {
                "title": "Unity Docs: NullReferenceException", 
                "url": "https://docs.unity3d.com/ScriptReference/NullReferenceException.html",
                "snippet": "This exception is thrown when you try to access a member of an object whose value is null.",
                "distance": 0.12
            }
        ],
        "metrics": {
            "tokens_used_classification": 300,
            "cost_usd_classification": 0.0006,
            "total_processing_time_ms": 1500.0
        }
    }
    try:
        analyze_resp = AnalyzeResponse.model_validate(sample_analyze_response_data_updated)
        print("\nSuccessfully parsed AnalyzeResponse with new AutoFixData:")
        print(f"Request ID: {analyze_resp.request_id}")
        print(f"Error Type: {analyze_resp.classification.error_type}")
        if analyze_resp.auto_fix_generated:
            print(f"Auto-fix action: {analyze_resp.auto_fix_generated.action}")
            print(f"Auto-fix details: {analyze_resp.auto_fix_generated.details}")
    except Exception as e:
        print(f"Error parsing AnalyzeResponse: {e}")

    # ConfigModel example (won't load from env here, just shows structure)
    config_example = ConfigModel(
        llama_api_key="test_key_llama", 
        gemini_api_key="test_key_gemini"
        # other fields will use defaults if not provided
    )
    print("\nConfigModel example:")
    print(f"Classification Model: {config_example.classification_model_name}")
    print(f"Chroma DB Path: {config_example.chroma_db_path}") 