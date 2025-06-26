#!/usr/bin/env python3
"""
Prepare high-quality training data for Llama fine-tuning from existing Quest forum data
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any
import structlog

# Add quest-dev-copilot to path
project_root = Path(__file__).parent.parent.parent
quest_copilot_dir = project_root / "quest-dev-copilot"
sys.path.insert(0, str(quest_copilot_dir))

from backend.real_error_analyzer import RealErrorAnalyzer

logger = structlog.get_logger(__name__)

class TrainingDataPreparer:
    """
    Prepares high-quality training data from existing Quest forum posts and error patterns
    """
    
    def __init__(self):
        self.analyzer = RealErrorAnalyzer()
        self.training_examples = []
    
    def create_synthetic_training_examples(self) -> List[Dict[str, Any]]:
        """Create high-quality synthetic training examples based on error patterns"""
        
        synthetic_examples = [
            # Black Screen / VR Rendering Issues
            {
                'error_log': 'LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048\nLogVulkanRHI: Error: vkCreateImage failed, VkResult=VK_ERROR_OUT_OF_DEVICE_MEMORY',
                'classification': 'black_screen',
                'solution': 'VR eye buffer allocation failure due to insufficient GPU memory. Solution: 1) Open Project Settings → Rendering 2) Set VR Pixel Density to 0.8 or lower 3) Disable Mobile HDR 4) Set Mobile MSAA to "No MSAA" 5) Reduce texture quality settings 6) Test with simplified materials',
                'confidence': 0.95,
                'metadata': {'severity': 'critical', 'platform': 'quest', 'category': 'memory'}
            },
            {
                'error_log': 'UATHelper: Packaging (Android): BUILD FAILED: Task :app:packageDebug FAILED\nUATHelper: Packaging (Android): Error: Failed to sign APK: jarsigner error',
                'classification': 'packaging_error',
                'solution': 'Android APK packaging and signing failure. Solution: 1) Verify Android SDK path in Project Settings 2) Check keystore configuration 3) Ensure Target SDK is set to 32 for Quest 4) Clean intermediate files 5) Regenerate signing certificate if needed 6) Check available disk space',
                'confidence': 0.90,
                'metadata': {'severity': 'high', 'platform': 'android', 'category': 'build'}
            },
            {
                'error_log': 'LogPluginManager: Error: Plugin \'MetaXR\' failed to load because module \'OculusXRHMD\' could not be found\nLogXRSystem: Warning: Multiple XR plugins detected: OculusXR, OpenXR. This may cause conflicts.',
                'classification': 'plugin_conflict',
                'solution': 'XR plugin conflict between MetaXR and OculusXR. Solution: 1) Go to Edit → Plugins 2) Disable OculusXR plugin if using MetaXR 3) Only enable one XR plugin at a time 4) Restart Unreal Editor 5) Regenerate project files 6) Verify plugin dependencies',
                'confidence': 0.95,
                'metadata': {'severity': 'critical', 'platform': 'quest', 'category': 'plugins'}
            }
        ]
        
        logger.info(f"Created {len(synthetic_examples)} synthetic training examples")
        return synthetic_examples
    
    def format_for_llama_training(self, examples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format examples for Llama fine-tuning"""
        
        formatted_examples = []
        
        system_prompt = """You are an expert Unreal Engine Quest VR development assistant. Analyze error logs and provide accurate classifications and solutions.

Error Types:
- black_screen: VR rendering issues, eye buffer problems, Vulkan memory errors
- packaging_error: Build failures, APK signing issues, Gradle problems
- plugin_conflict: XR plugin conflicts, missing modules, dependency issues
- shader_compile: Shader compilation failures, HLSL errors, mobile rendering issues
- sdk_mismatch: Version incompatibilities, API mismatches, runtime conflicts
- vr: Quest-specific VR issues, hand tracking, Link connection, guardian system

Respond with JSON format containing classification, confidence, and step-by-step solution."""
        
        for example in examples:
            # Create the training conversation
            messages = [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": f"Analyze this Quest development error log:\n\n{example['error_log']}"
                },
                {
                    "role": "assistant",
                    "content": json.dumps({
                        "classification": example['classification'],
                        "confidence": example['confidence'],
                        "solution": example['solution'],
                        "metadata": example.get('metadata', {})
                    }, indent=2)
                }
            ]
            
            formatted_examples.append({"messages": messages})
        
        return formatted_examples
    
    def save_training_data(self, examples: List[Dict[str, Any]], output_path: str):
        """Save training data in JSONL format for Llama fine-tuning"""
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for example in examples:
                f.write(json.dumps(example) + '\n')
        
        logger.info(f"Saved {len(examples)} training examples to {output_path}")
    
    def prepare_complete_dataset(self) -> str:
        """Prepare the complete training dataset"""
        
        # Create synthetic high-quality examples
        synthetic_examples = self.create_synthetic_training_examples()
        
        # Format for Llama training
        formatted_examples = self.format_for_llama_training(synthetic_examples)
        
        # Save training dataset
        output_path = f"quest_training_dataset_{len(formatted_examples)}_examples.jsonl"
        self.save_training_data(formatted_examples, output_path)
        
        logger.info(f"Complete training dataset prepared with {len(formatted_examples)} examples")
        logger.info(f"Dataset saved to: {output_path}")
        
        return output_path

def main():
    """Main function to prepare training data"""
    preparer = TrainingDataPreparer()
    dataset_path = preparer.prepare_complete_dataset()
    
    print(f"\n✅ Training dataset prepared successfully!")
    print(f"📁 Dataset file: {dataset_path}")
    print(f"\n🚀 Next steps:")
    print(f"1. Review the dataset file for quality")
    print(f"2. Run the training script: python -m llama.training_client")
    print(f"3. Monitor fine-tuning progress")
    print(f"4. Test the fine-tuned model")

if __name__ == "__main__":
    main() 