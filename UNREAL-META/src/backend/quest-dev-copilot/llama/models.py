from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import structlog

logger = structlog.get_logger(__name__)

class TokenUsage(BaseModel):
    """Pydantic model for token usage information from Llama API."""
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: int

class LlamaChoice(BaseModel):
    """Pydantic model for a single choice in a Llama API response."""
    text: str
    index: Optional[int] = None
    # 'finish_reason' could be 'stop', 'length', 'content_filter', etc.
    finish_reason: Optional[str] = None 
    # Log probabilities, if provided by the API
    logprobs: Optional[Any] = None # Could be a more specific model if schema is known

class LlamaCompletionResponse(BaseModel):
    """Pydantic model for a Llama API completion-style response."""
    id: Optional[str] = None # Unique ID for the response
    object: Optional[str] = None # e.g., 'text_completion', 'chat.completion'
    created: Optional[int] = None # Timestamp of creation
    model: str # Model used for the generation
    choices: List[LlamaChoice]
    usage: Optional[TokenUsage] = None
    # Optional field for any raw or additional data from the API
    raw_response: Optional[Dict[str, Any]] = Field(default=None, exclude=True) 

    def get_first_choice_text(self) -> Optional[str]:
        """Helper to get the text of the first choice, if available."""
        if self.choices:
            return self.choices[0].text
        return None

# Example of how you might parse a raw response into this model in LlamaAPIClient:
# try:
#     parsed_response = LlamaCompletionResponse.model_validate(raw_json_data)
#     # Store raw_json_data if needed for debugging or if not all fields are mapped
#     parsed_response.raw_response = raw_json_data 
#     return parsed_response
# except ValidationError as e:
#     logger.error("Failed to validate Llama API response", errors=e.errors(), data=raw_json_data)
#     return None

# --- Error Classification Model (from guidelines, can live here or in backend/models.py) ---
# This is the ErrorClassification dataclass from the guidelines, translated to Pydantic.
# It might be more appropriate in `backend/models.py` if primarily used by the backend logic.
# For now, placing a version here if Llama models are expected to directly output this structure.

class ErrorClassification(BaseModel):
    """Pydantic model for error classification output."""
    error_type: str
    confidence: float = Field(..., ge=0.0, le=1.0) # Confidence between 0.0 and 1.0
    auto_fixable: bool
    key_indicators: List[str]
    # Optional fields for more details from Llama
    explanation: Optional[str] = None
    suggested_steps: Optional[List[str]] = None

# You might also have models for specific Llama request payloads if they are complex.
# For example:
# class LlamaGenerationRequest(BaseModel):
#     model: str
#     prompt: str
#     max_tokens: int = 1000
#     temperature: float = 0.2
#     # ... other parameters

if __name__ == '__main__':
    # Example Usage of LlamaCompletionResponse
    sample_response_data = {
        "id": "cmpl-xxxxxxxxxxxxxxx",
        "object": "text_completion",
        "created": 1677652288,
        "model": "Llama-4-Scout-17B-16E-Instruct-FP8",
        "choices": [
            {
                "text": "\nThis is a test response from Llama.",
                "index": 0,
                "logprobs": None,
                "finish_reason": "length"
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        }
    }

    try:
        llama_response = LlamaCompletionResponse.model_validate(sample_response_data)
        print("Successfully parsed LlamaCompletionResponse:")
        print(f"Model: {llama_response.model}")
        print(f"First choice text: {llama_response.get_first_choice_text()}")
        if llama_response.usage:
            print(f"Total tokens: {llama_response.usage.total_tokens}")
    except Exception as e:
        print(f"Error parsing sample response: {e}")

    # Example Usage of ErrorClassification
    sample_error_classification_data = {
        "error_type": "NullPointerException",
        "confidence": 0.95,
        "auto_fixable": True,
        "key_indicators": ["java.lang.NullPointerException", "at com.example.MyClass.method(MyClass.java:123)"],
        "explanation": "A variable was accessed before it was assigned a value."
    }
    try:
        error_class = ErrorClassification.model_validate(sample_error_classification_data)
        print("\nSuccessfully parsed ErrorClassification:")
        print(f"Error Type: {error_class.error_type}")
        print(f"Confidence: {error_class.confidence}")
    except Exception as e:
        print(f"Error parsing sample error classification: {e}") 