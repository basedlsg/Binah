#!/usr/bin/env python3
"""
Quest Dev Copilot - Fine-Tuned Model Integration Script
Use this script to integrate your fine-tuned Llama model with Quest Dev Copilot.
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def analyze_error_with_fine_tuned_model(error_log: str, model_id: str = "your-fine-tuned-model-id"):
    """Analyze error using fine-tuned model."""
    try:
        # This would use the actual Llama API client
        # For now, we'll show the structure
        print(f"Using fine-tuned model: {model_id}")
        print(f"Analyzing error: {error_log[:100]}...")
        
        # Placeholder for actual API call
        return {
            "classification": "example",
            "confidence": 0.95,
            "solution": "Example solution from fine-tuned model"
        }
        
    except Exception as e:
        print(f"Fine-tuned model analysis failed: {e}")
        return None

def main():
    """Test the fine-tuned model integration."""
    test_error = """Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048
LogVulkanRHI: Error: vkCreateImage failed, VkResult=VK_ERROR_OUT_OF_DEVICE_MEMORY"""
    
    print("Testing fine-tuned model...")
    result = analyze_error_with_fine_tuned_model(test_error)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
