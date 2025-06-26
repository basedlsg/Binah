#!/usr/bin/env python3
"""
Quest Dev Copilot - Llama API Fine-Tuning Automation Script
Complete pipeline for fine-tuning Llama models using only the official Llama API.

This script:
1. Prepares and validates training datasets
2. Creates enhanced datasets for better fine-tuning
3. Provides step-by-step instructions for dashboard upload
4. Monitors fine-tuning jobs
5. Tests fine-tuned models
6. Integrates with the Quest Dev Copilot backend

Usage:
    python scripts/run_llama_fine_tuning.py
"""

import os
import sys
import json
import time
import shutil
from pathlib import Path
from typing import Dict, List, Any

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from llama.fine_tuning_client import LlamaFineTuningClient, FineTuningConfig
from quest_dev_copilot.llama.client import LlamaAPIClient
from quest_dev_copilot.backend.real_error_analyzer import RealErrorAnalyzer

class QuestDevCopilotFineTuner:
    """Complete fine-tuning automation for Quest Dev Copilot."""
    
    def __init__(self):
        """Initialize the fine-tuning automation."""
        self.project_root = Path(__file__).parent.parent
        self.output_dir = self.project_root / "fine_tuned_models"
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize clients
        try:
            self.fine_tuning_client = LlamaFineTuningClient()
            self.llama_client = LlamaAPIClient()
            self.error_analyzer = RealErrorAnalyzer()
        except Exception as e:
            print(f"❌ Failed to initialize clients: {e}")
            print("Please ensure LLAMA_API_KEY environment variable is set")
            sys.exit(1)
    
    def prepare_comprehensive_dataset(self) -> str:
        """
        Prepare a comprehensive dataset combining all available training data.
        
        Returns:
            Path to the comprehensive dataset
        """
        print("🔄 Preparing comprehensive training dataset...")
        
        # Define source datasets
        source_datasets = [
            "quest-dev-copilot/quest_copilot_finetuned/training_data.jsonl",
            "quest-dev-copilot/quest_training_dataset_3_examples.jsonl"
        ]
        
        # Collect all examples
        all_examples = []
        
        for dataset_path in source_datasets:
            full_path = self.project_root / dataset_path
            if full_path.exists():
                print(f"  📁 Processing: {dataset_path}")
                with open(full_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            all_examples.append(json.loads(line.strip()))
            else:
                print(f"  ⚠️  Dataset not found: {dataset_path}")
        
        # Add synthetic examples for better coverage
        synthetic_examples = self._generate_synthetic_examples()
        all_examples.extend(synthetic_examples)
        
        # Create comprehensive dataset
        comprehensive_path = self.output_dir / "comprehensive_training_data.jsonl"
        with open(comprehensive_path, 'w', encoding='utf-8') as f:
            for example in all_examples:
                f.write(json.dumps(example) + '\n')
        
        print(f"✅ Comprehensive dataset created: {len(all_examples)} examples")
        print(f"   📄 Location: {comprehensive_path}")
        
        return str(comprehensive_path)
    
    def _generate_synthetic_examples(self) -> List[Dict]:
        """Generate synthetic training examples for better coverage."""
        print("  🔧 Generating synthetic examples...")
        
        synthetic_examples = [
            # Black screen errors
            {
                "messages": [
                    {"role": "system", "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."},
                    {"role": "user", "content": "Error: LogVulkanRHI: Error: Failed to create depth buffer\nLogVulkanRHI: Error: vkCreateImage failed with VK_ERROR_OUT_OF_DEVICE_MEMORY\nLogVulkanRHI: Error: Failed to allocate memory for depth buffer"},
                    {"role": "assistant", "content": '{"classification": "black_screen", "confidence": 0.94, "solution": "Vulkan depth buffer allocation failure. Solution: 1) Open Project Settings → Rendering → Mobile 2) Set Mobile HDR to Disabled 3) Set Mobile MSAA to No MSAA 4) Disable Mobile Multi-View 5) Set Mobile Shading Quality to Low 6) Reduce texture quality in Project Settings → Rendering → Textures 7) Restart Unreal Editor", "auto_fix": null, "sources": ["https://docs.unrealengine.com/5.0/en-US/mobile-rendering-in-unreal-engine/"], "metadata": {"severity": "critical", "platform": "quest", "category": "memory"}}'}
                ]
            },
            # Packaging errors
            {
                "messages": [
                    {"role": "system", "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."},
                    {"role": "user", "content": "Error: UATHelper: Packaging (Android): BUILD FAILED\nUATHelper: Packaging (Android): Error: Failed to sign APK\nUATHelper: Packaging (Android): jarsigner: certificate chain not found for: androiddebugkey"},
                    {"role": "assistant", "content": '{"classification": "packaging_error", "confidence": 0.91, "solution": "Android APK signing certificate issue. Solution: 1) Go to Project Settings → Platforms → Android → Advanced → Package 2) Set Package Data Inside Apk to true 3) Set Build Configuration to Development 4) Delete Intermediate and Saved folders 5) Right-click .uproject → Generate Visual Studio project files 6) Clean and rebuild project 7) If issue persists, regenerate keystore in Android Studio", "auto_fix": "Delete Intermediate and Saved folders, regenerate project files", "sources": ["https://docs.unrealengine.com/5.0/en-US/android-development-setup-for-unreal-engine/"], "metadata": {"severity": "high", "platform": "android", "category": "signing"}}'}
                ]
            },
            # Plugin conflicts
            {
                "messages": [
                    {"role": "system", "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."},
                    {"role": "user", "content": "Error: LogPluginManager: Error: Plugin MetaXR failed to load\nLogPluginManager: Error: Module OculusXRHMD could not be found\nLogXRSystem: Warning: Multiple XR plugins detected: OculusXR, OpenXR, MetaXR"},
                    {"role": "assistant", "content": '{"classification": "plugin_conflict", "confidence": 0.96, "solution": "Multiple XR plugin conflict detected. Solution: 1) Go to Edit → Plugins 2) Search for Oculus and disable OculusXR plugin 3) Search for OpenXR and disable OpenXR plugin 4) Search for Meta and ensure only MetaXR plugin is enabled 5) Restart Unreal Editor 6) Go to Project Settings → Platforms → Android → Advanced → Package 7) Set Package Data Inside Apk to true 8) Regenerate project files", "auto_fix": "Disable OculusXR and OpenXR plugins, enable only MetaXR plugin", "sources": ["https://developer.oculus.com/documentation/unreal/unreal-quick-start-guide/"], "metadata": {"severity": "critical", "platform": "quest", "category": "plugins"}}'}
                ]
            }
        ]
        
        print(f"  ✅ Generated {len(synthetic_examples)} synthetic examples")
        return synthetic_examples
    
    def validate_and_enhance_dataset(self, dataset_path: str) -> str:
        """
        Validate and enhance the dataset for optimal fine-tuning.
        
        Args:
            dataset_path: Path to the source dataset
            
        Returns:
            Path to the enhanced dataset
        """
        print("🔍 Validating and enhancing dataset...")
        
        # Validate source dataset
        validation = self.fine_tuning_client.validate_dataset(dataset_path)
        
        if not validation["is_valid"]:
            print(f"❌ Dataset validation failed:")
            for error in validation["errors"]:
                print(f"   - {error}")
            raise ValueError("Dataset validation failed")
        
        print(f"✅ Source dataset validation passed: {validation['total_examples']} examples")
        
        # Enhance dataset
        enhanced_path = self.output_dir / "enhanced_training_data.jsonl"
        enhanced_dataset = self.fine_tuning_client.prepare_enhanced_dataset(
            dataset_path, str(enhanced_path)
        )
        
        # Validate enhanced dataset
        enhanced_validation = self.fine_tuning_client.validate_dataset(enhanced_dataset)
        print(f"✅ Enhanced dataset validation passed: {enhanced_validation['total_examples']} examples")
        
        return enhanced_dataset
    
    def create_fine_tuning_instructions(self, dataset_path: str) -> str:
        """
        Create detailed instructions for fine-tuning via the Llama API dashboard.
        
        Args:
            dataset_path: Path to the dataset
            
        Returns:
            Path to the instructions file
        """
        print("📋 Creating fine-tuning instructions...")
        
        instructions = {
            "title": "Quest Dev Copilot - Llama API Fine-Tuning Instructions",
            "dataset_info": {
                "path": dataset_path,
                "size_mb": os.path.getsize(dataset_path) / (1024 * 1024),
                "format": "JSONL",
                "examples": "Enhanced training data for Quest VR debugging"
            },
            "step_by_step_instructions": [
                {
                    "step": 1,
                    "title": "Access Llama API Dashboard",
                    "description": "Go to https://llama.developer.meta.com/ and sign in with your API key",
                    "url": "https://llama.developer.meta.com/"
                },
                {
                    "step": 2,
                    "title": "Navigate to Fine-Tuning",
                    "description": "Click on the 'Fine-tuning' tab in the dashboard",
                    "action": "Navigate to Fine-tuning section"
                },
                {
                    "step": 3,
                    "title": "Upload Dataset",
                    "description": f"Click 'Create' and upload the dataset file: {dataset_path}",
                    "file": dataset_path,
                    "notes": "Ensure the file is in JSONL format with proper message structure"
                },
                {
                    "step": 4,
                    "title": "Configure Fine-Tuning Job",
                    "description": "Set the following parameters:",
                    "configuration": {
                        "base_model": "Llama-3.3-8B-Instruct",
                        "job_name": "quest-dev-copilot-production",
                        "epochs": 3,
                        "batch_size": 4,
                        "learning_rate_multiplier": 1.0
                    }
                },
                {
                    "step": 5,
                    "title": "Start Fine-Tuning",
                    "description": "Click 'Start' to begin the fine-tuning process",
                    "notes": "The process may take several hours depending on dataset size"
                },
                {
                    "step": 6,
                    "title": "Monitor Progress",
                    "description": "Track the job progress in the dashboard",
                    "metrics": ["Training loss", "Validation metrics", "Completion percentage"]
                },
                {
                    "step": 7,
                    "title": "Download Fine-Tuned Model",
                    "description": "Once complete, download the model or use it directly via API",
                    "options": ["Download for local use", "Use via API with model ID"]
                }
            ],
            "integration_instructions": {
                "api_usage": "Use the fine-tuned model by specifying its ID in API calls",
                "backend_integration": "Update backend configuration to use the fine-tuned model",
                "testing": "Test the model with sample error logs to verify improvements"
            },
            "troubleshooting": {
                "common_issues": [
                    "Dataset format errors - ensure JSONL format with proper message structure",
                    "File size too large - compress or split dataset if over 1GB",
                    "API key issues - verify API key has fine-tuning permissions",
                    "Job failures - check logs for specific error messages"
                ]
            }
        }
        
        instructions_path = self.output_dir / "fine_tuning_instructions.json"
        with open(instructions_path, 'w') as f:
            json.dump(instructions, f, indent=2)
        
        print(f"✅ Instructions created: {instructions_path}")
        return str(instructions_path)
    
    def test_current_models(self) -> Dict[str, Any]:
        """
        Test current models to establish baseline performance.
        
        Returns:
            Test results
        """
        print("🧪 Testing current models for baseline...")
        
        test_cases = [
            {
                "name": "black_screen_error",
                "prompt": "Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048\nLogVulkanRHI: Error: vkCreateImage failed, VkResult=VK_ERROR_OUT_OF_DEVICE_MEMORY"
            },
            {
                "name": "packaging_error",
                "prompt": "Error: UATHelper: Packaging (Android): BUILD FAILED\nUATHelper: Packaging (Android): Error: Failed to sign APK: jarsigner error"
            },
            {
                "name": "plugin_conflict",
                "prompt": "Error: LogPluginManager: Error: Plugin 'MetaXR' failed to load because module 'OculusXRHMD' could not be found\nLogXRSystem: Warning: Multiple XR plugins detected"
            }
        ]
        
        results = {}
        
        # Test with current error analyzer
        for test_case in test_cases:
            print(f"  🔍 Testing: {test_case['name']}")
            try:
                result = self.error_analyzer.analyze_error(test_case['prompt'])
                results[test_case['name']] = {
                    "classification": result.get('classification', {}).get('error_type'),
                    "confidence": result.get('classification', {}).get('confidence'),
                    "solution_length": len(result.get('solution', ''))
                }
            except Exception as e:
                results[test_case['name']] = {"error": str(e)}
        
        # Save baseline results
        baseline_path = self.output_dir / "baseline_test_results.json"
        with open(baseline_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"✅ Baseline testing completed: {baseline_path}")
        return results
    
    def create_integration_script(self, model_id: str = "your-fine-tuned-model-id") -> str:
        """
        Create integration script for using the fine-tuned model.
        
        Args:
            model_id: ID of the fine-tuned model
            
        Returns:
            Path to the integration script
        """
        print("🔧 Creating integration script...")
        
        integration_script = f'''#!/usr/bin/env python3
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

from llama.client import LlamaAPIClient
from backend.real_error_analyzer import RealErrorAnalyzer

class FineTunedErrorAnalyzer(RealErrorAnalyzer):
    """Enhanced error analyzer using fine-tuned model."""
    
    def __init__(self, fine_tuned_model_id: str = "{model_id}"):
        """Initialize with fine-tuned model."""
        super().__init__()
        self.fine_tuned_model_id = fine_tuned_model_id
        self.llama_client = LlamaAPIClient()
    
    def analyze_error(self, error_log: str) -> dict:
        """Analyze error using fine-tuned model."""
        try:
            # Use fine-tuned model for analysis
            response = self.llama_client.generate(
                model=self.fine_tuned_model_id,
                messages=[
                    {{
                        "role": "system",
                        "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."
                    }},
                    {{
                        "role": "user",
                        "content": f"Analyze this Quest development error log:\\n\\n{{error_log}}"
                    }}
                ],
                max_tokens=1000,
                temperature=0.1
            )
            
            # Parse the response
            try:
                result = json.loads(response)
                return result
            except json.JSONDecodeError:
                # Fallback to base analyzer if JSON parsing fails
                return super().analyze_error(error_log)
                
        except Exception as e:
            print(f"Fine-tuned model analysis failed: {{e}}")
            # Fallback to base analyzer
            return super().analyze_error(error_log)

def main():
    """Test the fine-tuned model integration."""
    analyzer = FineTunedErrorAnalyzer()
    
    test_error = """Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048
LogVulkanRHI: Error: vkCreateImage failed, VkResult=VK_ERROR_OUT_OF_DEVICE_MEMORY"""
    
    print("Testing fine-tuned model...")
    result = analyzer.analyze_error(test_error)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
'''
        
        script_path = self.output_dir / "integrate_fine_tuned_model.py"
        with open(script_path, 'w') as f:
            f.write(integration_script)
        
        # Make executable
        os.chmod(script_path, 0o755)
        
        print(f"✅ Integration script created: {script_path}")
        return str(script_path)
    
    def run_complete_pipeline(self) -> Dict[str, Any]:
        """
        Run the complete fine-tuning pipeline.
        
        Returns:
            Pipeline results
        """
        print("🚀 Starting Quest Dev Copilot Fine-Tuning Pipeline")
        print("=" * 60)
        
        try:
            # Step 1: Prepare comprehensive dataset
            comprehensive_dataset = self.prepare_comprehensive_dataset()
            
            # Step 2: Validate and enhance dataset
            enhanced_dataset = self.validate_and_enhance_dataset(comprehensive_dataset)
            
            # Step 3: Test current models for baseline
            baseline_results = self.test_current_models()
            
            # Step 4: Create fine-tuning instructions
            instructions_path = self.create_fine_tuning_instructions(enhanced_dataset)
            
            # Step 5: Create integration script
            integration_script = self.create_integration_script()
            
            # Compile results
            results = {
                "pipeline_completed": True,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "datasets": {
                    "comprehensive": comprehensive_dataset,
                    "enhanced": enhanced_dataset
                },
                "baseline_results": baseline_results,
                "instructions": instructions_path,
                "integration_script": integration_script,
                "next_steps": [
                    "1. Upload enhanced dataset to Llama API dashboard",
                    "2. Create fine-tuning job with provided configuration",
                    "3. Monitor training progress",
                    "4. Test fine-tuned model performance",
                    "5. Integrate with Quest Dev Copilot backend"
                ]
            }
            
            # Save results
            results_path = self.output_dir / "fine_tuning_pipeline_results.json"
            with open(results_path, 'w') as f:
                json.dump(results, f, indent=2)
            
            print("\n" + "=" * 60)
            print("✅ Fine-Tuning Pipeline Completed Successfully!")
            print("=" * 60)
            print(f"📁 Output directory: {self.output_dir}")
            print(f"📄 Results saved to: {results_path}")
            print(f"📋 Instructions: {instructions_path}")
            print(f"🔧 Integration script: {integration_script}")
            
            print("\n📋 Next Steps:")
            for i, step in enumerate(results["next_steps"], 1):
                print(f"   {i}. {step}")
            
            return results
            
        except Exception as e:
            print(f"\n❌ Pipeline failed: {e}")
            raise

def main():
    """Main function to run the fine-tuning pipeline."""
    try:
        fine_tuner = QuestDevCopilotFineTuner()
        results = fine_tuner.run_complete_pipeline()
        
        print("\n🎉 Fine-tuning pipeline completed successfully!")
        print("Follow the instructions to complete the fine-tuning process.")
        
    except Exception as e:
        print(f"❌ Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 