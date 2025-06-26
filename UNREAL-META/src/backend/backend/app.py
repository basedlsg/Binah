"""
Quest Dev Copilot - Main Flask Application

This is the core backend API that orchestrates error analysis,
RAG retrieval, and Llama API integration for Quest VR debugging.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional
import json
import time

# Import our enhanced modules
from llama.enhanced_client import EnhancedLlamaClient
from rag.vector_store import ChromaVectorStore
from rag.retrieval import QuestRetrievalEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Unreal Engine plugin

# Global service instances
knowledge_base = None
llama_client = None

def initialize_services():
    """Initialize AI services with API keys"""
    global knowledge_base, llama_client
    
    try:
        # Initialize enhanced Llama client with training data
        llama_client = EnhancedLlamaClient()
        logger.info("✅ Enhanced Llama client initialized with training data")
        
        # Initialize vector store for RAG
        knowledge_base = ChromaVectorStore()
        logger.info("✅ Vector store initialized")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "vector_db": "ready" if knowledge_base else "not_initialized",
            "llama_api": "ready" if llama_client else "not_initialized"
        }
    })

@app.route('/analyze', methods=['POST'])
def analyze_error():
    """
    Main endpoint for error analysis with enhanced AI capabilities
    
    Expected JSON payload:
    {
        "log_content": "string",
        "screenshot": "base64_string (optional)",
        "use_cache": boolean
    }
    """
    start_time = time.time()
    
    try:
        data = request.json
        if not data or 'log_content' not in data:
            return jsonify({"error": "Missing log_content in request"}), 400
        
        log_content = data.get('log_content', '')
        screenshot_base64 = data.get('screenshot', None)
        use_cache = data.get('use_cache', False)
        
        logger.info(f"Analyzing error log of {len(log_content)} characters")
        
        # Step 1: Enhanced AI Analysis using training data
        if llama_client:
            analysis_result = llama_client.analyze_error(log_content)
            
            if analysis_result["success"]:
                analysis_content = analysis_result["content"]
                metadata = analysis_result["metadata"]
                
                # Extract structured information from the analysis
                classification = extract_classification_from_analysis(analysis_content)
                fix_instructions = extract_fix_instructions(analysis_content)
                
                # Step 2: RAG Retrieval for additional context
                relevant_sources = []
                if knowledge_base:
                    retrieval_engine = QuestRetrievalEngine(knowledge_base)
                    relevant_docs = retrieval_engine.retrieve_relevant_documents(log_content, top_k=3)
                    relevant_sources = format_sources(relevant_docs)
                
                # Step 3: Generate specific fix if needed
                auto_fix = None
                if classification.get('auto_fixable', False):
                    fix_result = llama_client.generate_fix(log_content)
                    if fix_result["success"]:
                        auto_fix = extract_auto_fix(fix_result["content"])
                
                # Compile response
                response = {
                    "classification": classification,
                    "fix": fix_instructions,
                    "auto_fix": auto_fix,
                    "sources": relevant_sources,
                    "metrics": {
                        "tokens_used": metadata.get("tokens_used", 0),
                        "estimated_cost": calculate_cost(metadata),
                        "latency_ms": int((time.time() - start_time) * 1000),
                        "training_examples_used": metadata.get("examples_used", 0)
                    },
                    "cached": use_cache,
                    "enhanced_analysis": True
                }
                
                logger.info(f"✅ Analysis completed successfully")
                return jsonify(response)
            else:
                logger.error(f"❌ AI analysis failed: {analysis_result.get('error')}")
                return jsonify({"error": "AI analysis failed"}), 500
        else:
            logger.error("❌ Llama client not initialized")
            return jsonify({"error": "AI service not available"}), 503
        
    except Exception as e:
        logger.error(f"❌ Error in analyze endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def extract_classification_from_analysis(analysis_content: str) -> Dict:
    """Extract error classification from AI analysis"""
    # Simple extraction - in production, use more sophisticated parsing
    content_lower = analysis_content.lower()
    
    # Determine error type based on content
    if 'vulkan' in content_lower:
        error_type = 'vulkan_error'
    elif 'plugin' in content_lower:
        error_type = 'plugin_conflict'
    elif 'memory' in content_lower or 'buffer' in content_lower:
        error_type = 'memory_allocation'
    elif 'sdk' in content_lower:
        error_type = 'sdk_mismatch'
    else:
        error_type = 'general_error'
    
    # Determine confidence based on content quality
    confidence = 0.85 if len(analysis_content) > 200 else 0.6
    
    # Determine if auto-fixable
    auto_fixable = any(keyword in content_lower for keyword in 
                      ['step', 'fix', 'solution', 'configure', 'enable', 'disable'])
    
    return {
        "error_type": error_type,
        "confidence": confidence,
        "key_indicators": extract_key_indicators(analysis_content),
        "auto_fixable": auto_fixable
    }

def extract_key_indicators(analysis_content: str) -> List[str]:
    """Extract key indicators from analysis content"""
    indicators = []
    content_lower = analysis_content.lower()
    
    # Common Quest VR error indicators
    quest_indicators = ['vulkan', 'openxr', 'metaxr', 'quest', 'vr', 'plugin', 
                       'sdk', 'memory', 'buffer', 'allocation', 'rendering']
    
    for indicator in quest_indicators:
        if indicator in content_lower:
            indicators.append(indicator)
    
    return indicators[:5]  # Return top 5 indicators

def extract_fix_instructions(analysis_content: str) -> str:
    """Extract fix instructions from analysis content"""
    # Look for numbered steps or bullet points
    lines = analysis_content.split('\n')
    fix_lines = []
    
    for line in lines:
        line = line.strip()
        if (line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')) or
            any(keyword in line.lower() for keyword in ['step', 'fix', 'solution', 'configure'])):
            fix_lines.append(line)
    
    if fix_lines:
        return '\n'.join(fix_lines)
    else:
        # Return the full analysis if no structured fix found
        return analysis_content

def extract_auto_fix(fix_content: str) -> Optional[Dict]:
    """Extract structured auto-fix from fix content"""
    content_lower = fix_content.lower()
    
    # Simple auto-fix detection
    if 'plugin' in content_lower and ('enable' in content_lower or 'disable' in content_lower):
        return {
            "action": "toggle_plugin",
            "plugin_name": extract_plugin_name(fix_content),
            "enabled": 'enable' in content_lower,
            "file_path": "*.uproject"
        }
    
    return None

def extract_plugin_name(fix_content: str) -> str:
    """Extract plugin name from fix content"""
    # Simple extraction - in production, use more sophisticated parsing
    lines = fix_content.split('\n')
    for line in lines:
        if 'plugin' in line.lower():
            # Look for capitalized words that might be plugin names
            words = line.split()
            for word in words:
                if word.isupper() or (word[0].isupper() and len(word) > 3):
                    return word
    return "Unknown"

def format_sources(documents: List[Dict]) -> List[Dict]:
    """Format retrieved documents as sources"""
    sources = []
    for doc in documents:
        sources.append({
            "url": doc.get('url', 'Unknown'),
            "snippet": doc.get('content', '')[:200] + "...",
            "relevance_score": doc.get('score', 0.0)
        })
    return sources

def calculate_cost(metadata: Dict) -> float:
    """Calculate estimated cost based on token usage"""
    # Rough cost estimation (adjust based on actual pricing)
    total_tokens = metadata.get("tokens_used", 0)
    return total_tokens * 0.00002  # $0.02 per 1K tokens

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get usage metrics for monitoring dashboard"""
    # Get training data stats if available
    training_stats = {}
    if llama_client:
        try:
            training_stats = llama_client.get_training_stats()
        except Exception as e:
            logger.warning(f"Could not get training stats: {e}")
    
    return jsonify({
        "requests_today": 42,  # TODO: Implement actual tracking
        "avg_latency_ms": 3200,
        "total_tokens_used": 125000,
        "estimated_cost_today": 0.25,
        "error_distribution": {
            "plugin_conflict": 18,
            "sdk_mismatch": 15,
            "black_screen": 9,
            "other": 5
        },
        "success_rate": 0.94,
        "training_data": training_stats
    })

@app.route('/status', methods=['GET'])
def get_status():
    """Get detailed system status"""
    training_stats = {}
    if llama_client:
        try:
            training_stats = llama_client.get_training_stats()
        except Exception as e:
            logger.warning(f"Could not get training stats: {e}")
    
    return jsonify({
        "backend": "operational",
        "database": "connected" if knowledge_base else "disconnected",
        "ai_service": "connected" if llama_client else "disconnected",
        "training_data_loaded": training_stats.get("training_data_loaded", False),
        "training_examples": training_stats.get("total_examples", 0),
        "uptime": "N/A",  # TODO: Implement uptime tracking
        "last_updated": datetime.utcnow().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Initialize services
    try:
        initialize_services()
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
    
    # Start server
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting Quest Dev Copilot backend on {host}:{port}")
    app.run(host=host, port=port, debug=debug)