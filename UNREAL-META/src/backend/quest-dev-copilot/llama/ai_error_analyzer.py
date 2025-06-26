"""
AI-Powered Error Analyzer for Quest Dev Copilot

This module provides AI-powered error analysis using either:
1. Locally fine-tuned models (trained with our forum data)
2. Lambda API inference endpoints (for general analysis)
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from openai import OpenAI

try:
    from llama.cost_tracker import CostTracker
    from llama.training_client import LocalTrainingClient, LocalTrainingConfig
except ImportError:
    # Fallback for when running as script
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from llama.cost_tracker import CostTracker
    from llama.training_client import LocalTrainingClient, LocalTrainingConfig

logger = logging.getLogger(__name__)

@dataclass
class ErrorAnalysisResult:
    """Result of AI error analysis"""
    classification: Dict[str, Any]
    solution: str
    auto_fix: Optional[Dict[str, Any]]
    sources: List[str]
    metadata: Dict[str, Any]
    confidence: float
    processing_time: float

class AIErrorAnalyzer:
    """AI-powered error analyzer using local models and Lambda API"""
    
    def __init__(self, use_local_model: bool = True, model_path: Optional[str] = None):
        self.use_local_model = use_local_model
        self.model_path = model_path or "quest_copilot_model"
        self.cost_tracker = CostTracker()
        
        # Local model components
        self.local_tokenizer = None
        self.local_model = None
        
        # Lambda API client
        self.lambda_client = None
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        
        # Initialize the appropriate client
        if use_local_model:
            self._load_local_model()
        else:
            self._setup_lambda_client()
    
    def _load_local_model(self):
        """Load locally fine-tuned model"""
        try:
            logger.info(f"Loading local model from {self.model_path}")
            
            # Check if model exists
            if not os.path.exists(self.model_path):
                logger.warning(f"Local model not found at {self.model_path}. Use train_model() first.")
                self.use_local_model = False
                self._setup_lambda_client()
                return
            
            # Load tokenizer
            self.local_tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            
            # Load model (assuming LoRA was used)
            config = LocalTrainingConfig()
            base_model = AutoModelForCausalLM.from_pretrained(
                config.base_model_name,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            self.local_model = PeftModel.from_pretrained(base_model, self.model_path)
            
            logger.info("Local model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            logger.info("Falling back to Lambda API")
            self.use_local_model = False
            self._setup_lambda_client()
    
    def _setup_lambda_client(self):
        """Setup Lambda API client"""
        api_key = os.getenv('LLAMA_API_KEY')
        if not api_key:
            raise ValueError("LLAMA_API_KEY environment variable not set")
        
        self.lambda_client = OpenAI(
            api_key=api_key,
            base_url="https://api.lambdalabs.com/v1"
        )
        logger.info("Lambda API client initialized")
    
    async def analyze_error(self, error_log: str, context: Optional[str] = None) -> ErrorAnalysisResult:
        """Analyze error using AI (local model or Lambda API)"""
        start_time = datetime.now()
        
        try:
            if self.use_local_model and self.local_model:
                result = await self._analyze_with_local_model(error_log, context)
            else:
                result = await self._analyze_with_lambda_api(error_log, context)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            result.processing_time = processing_time
            
            logger.info(f"Error analysis completed in {processing_time:.2f}s using {'local model' if self.use_local_model else 'Lambda API'}")
            return result
            
        except Exception as e:
            logger.error(f"Error analysis failed: {e}")
            # Return fallback result
            return self._create_fallback_result(error_log, context, (datetime.now() - start_time).total_seconds())
    
    async def _analyze_with_local_model(self, error_log: str, context: Optional[str] = None) -> ErrorAnalysisResult:
        """Analyze error using locally fine-tuned model"""
        logger.info("Analyzing error with local model")
        
        # Format input for the model
        input_text = self._format_error_input(error_log, context)
        
        # Generate response
        response = self._generate_local_response(input_text)
        
        # Parse response
        try:
            parsed_response = json.loads(response)
            return ErrorAnalysisResult(
                classification=parsed_response.get('classification', {}),
                solution=parsed_response.get('solution', ''),
                auto_fix=parsed_response.get('auto_fix'),
                sources=parsed_response.get('sources', []),
                metadata=parsed_response.get('metadata', {}),
                confidence=parsed_response.get('classification', {}).get('confidence', 0.8),
                processing_time=0.0  # Will be set by caller
            )
        except json.JSONDecodeError:
            # If response is not JSON, treat as plain text solution
            return ErrorAnalysisResult(
                classification={"error_type": "unknown", "confidence": 0.6},
                solution=response,
                auto_fix=None,
                sources=[],
                metadata={"model": "local"},
                confidence=0.6,
                processing_time=0.0
            )
    
    async def _analyze_with_lambda_api(self, error_log: str, context: Optional[str] = None) -> ErrorAnalysisResult:
        """Analyze error using Lambda API"""
        logger.info("Analyzing error with Lambda API")
        
        # Format input
        input_text = self._format_error_input(error_log, context)
        
        # Create system prompt for error analysis
        system_prompt = """You are a Quest VR development expert. Analyze the provided error and respond with a JSON object containing:
{
  "classification": {
    "error_type": "one of: black_screen, packaging_error, plugin_conflict, sdk_mismatch, memory_issue, other",
    "confidence": 0.0-1.0,
    "auto_fixable": boolean,
    "key_indicators": ["list", "of", "key", "indicators"]
  },
  "solution": "detailed solution description",
  "auto_fix": null or {"type": "config_change", "instructions": "step by step"},
  "sources": ["relevant URLs or documentation"],
  "metadata": {"additional": "context"}
}"""
        
        try:
            # Call Lambda API
            response = self.lambda_client.chat.completions.create(
                model=os.getenv('CLASSIFICATION_MODEL_NAME', 'llama-4-scout-17b-16e-instruct'),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": input_text}
                ],
                max_tokens=2048,
                temperature=0.2
            )
            
            # Track usage
            self.cost_tracker.track_usage(
                model="lambda-api",
                input_tokens=response.usage.prompt_tokens,
                output_tokens=response.usage.completion_tokens,
                cost=self._estimate_lambda_cost(response.usage.total_tokens)
            )
            
            # Parse response
            response_text = response.choices[0].message.content
            
            try:
                parsed_response = json.loads(response_text)
                return ErrorAnalysisResult(
                    classification=parsed_response.get('classification', {}),
                    solution=parsed_response.get('solution', ''),
                    auto_fix=parsed_response.get('auto_fix'),
                    sources=parsed_response.get('sources', []),
                    metadata=parsed_response.get('metadata', {}),
                    confidence=parsed_response.get('classification', {}).get('confidence', 0.8),
                    processing_time=0.0
                )
            except json.JSONDecodeError:
                # If response is not JSON, create structured result
                return self._parse_unstructured_response(response_text)
                
        except Exception as e:
            logger.error(f"Lambda API call failed: {e}")
            raise
    
    def _format_error_input(self, error_log: str, context: Optional[str] = None) -> str:
        """Format error input for analysis"""
        input_parts = [
            "### Quest VR Error Analysis Request",
            f"Error Log:\n{error_log}"
        ]
        
        if context:
            input_parts.append(f"Additional Context:\n{context}")
        
        input_parts.append("Please analyze this error and provide a structured response with classification, solution, and any auto-fix recommendations.")
        
        return "\n\n".join(input_parts)
    
    def _generate_local_response(self, input_text: str, max_length: int = 1024) -> str:
        """Generate response using local model"""
        if not self.local_model or not self.local_tokenizer:
            raise ValueError("Local model not loaded")
        
        # Format for conversation
        formatted_input = f"Human: {input_text}\n\nAssistant:"
        
        # Tokenize
        inputs = self.local_tokenizer.encode(formatted_input, return_tensors="pt")
        
        # Generate
        with torch.no_grad():
            outputs = self.local_model.generate(
                inputs,
                max_length=max_length,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.local_tokenizer.eos_token_id
            )
        
        # Decode
        response = self.local_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract assistant response
        if "Assistant:" in response:
            return response.split("Assistant:")[-1].strip()
        return response
    
    def _parse_unstructured_response(self, response_text: str) -> ErrorAnalysisResult:
        """Parse unstructured response into ErrorAnalysisResult"""
        # Try to extract error type from response
        error_type = "other"
        confidence = 0.7
        
        response_lower = response_text.lower()
        if "packaging" in response_lower or "build" in response_lower:
            error_type = "packaging_error"
        elif "plugin" in response_lower or "xr" in response_lower:
            error_type = "plugin_conflict"
        elif "sdk" in response_lower or "android" in response_lower:
            error_type = "sdk_mismatch"
        elif "black screen" in response_lower or "display" in response_lower:
            error_type = "black_screen"
        elif "memory" in response_lower:
            error_type = "memory_issue"
        
        return ErrorAnalysisResult(
            classification={
                "error_type": error_type,
                "confidence": confidence,
                "auto_fixable": False,
                "key_indicators": []
            },
            solution=response_text,
            auto_fix=None,
            sources=[],
            metadata={"model": "lambda-api", "structured": False},
            confidence=confidence,
            processing_time=0.0
        )
    
    def _create_fallback_result(self, error_log: str, context: Optional[str], processing_time: float) -> ErrorAnalysisResult:
        """Create fallback result when AI analysis fails"""
        return ErrorAnalysisResult(
            classification={
                "error_type": "other",
                "confidence": 0.5,
                "auto_fixable": False,
                "key_indicators": ["analysis_failed"]
            },
            solution="AI analysis failed. Please check the error logs manually and consult the Quest development documentation.",
            auto_fix=None,
            sources=["https://developer.oculus.com/documentation/unreal/"],
            metadata={"fallback": True, "error": "analysis_failed"},
            confidence=0.5,
            processing_time=processing_time
        )
    
    def _estimate_lambda_cost(self, total_tokens: int) -> float:
        """Estimate cost for Lambda API usage"""
        # Rough estimate - adjust based on actual Lambda pricing
        cost_per_1k_tokens = 0.002  # $0.002 per 1K tokens (estimate)
        return (total_tokens / 1000) * cost_per_1k_tokens
    
    async def train_model(self, forum_data_paths: List[str], output_dir: Optional[str] = None) -> bool:
        """Train a local model using forum data"""
        try:
            logger.info("Starting model training")
            
            config = LocalTrainingConfig()
            if output_dir:
                config.output_dir = output_dir
                self.model_path = output_dir
            
            # Import training function
            from llama.training_client import train_quest_copilot_model
            
            # Train the model
            metrics = await train_quest_copilot_model(forum_data_paths, config.output_dir, config)
            
            logger.info(f"Training completed successfully:")
            logger.info(f"  - Training loss: {metrics.training_loss:.4f}")
            logger.info(f"  - Examples processed: {metrics.examples_processed}")
            logger.info(f"  - Training time: {metrics.training_time:.2f}s")
            logger.info(f"  - Model size: {metrics.model_size_mb:.2f} MB")
            
            # Load the newly trained model
            self._load_local_model()
            
            return True
            
        except Exception as e:
            logger.error(f"Model training failed: {e}")
            return False
    
    def get_analysis_stats(self) -> Dict[str, Any]:
        """Get analysis statistics"""
        return {
            "model_type": "local" if self.use_local_model else "lambda_api",
            "model_path": self.model_path if self.use_local_model else None,
            "cost_stats": self.cost_tracker.get_stats()
        }

# Convenience function for quick error analysis
async def analyze_quest_error(
    error_log: str,
    context: Optional[str] = None,
    use_local_model: bool = True,
    model_path: Optional[str] = None
) -> ErrorAnalysisResult:
    """Quick error analysis function"""
    analyzer = AIErrorAnalyzer(use_local_model, model_path)
    return await analyzer.analyze_error(error_log, context) 