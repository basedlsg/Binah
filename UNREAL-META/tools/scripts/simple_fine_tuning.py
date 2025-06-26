#!/usr/bin/env python3
"""
Quest Dev Copilot - Simple Llama API Fine-Tuning Script
Simplified version that prepares datasets and instructions for fine-tuning.

Usage:
    python scripts/simple_fine_tuning.py
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, List, Any

def prepare_comprehensive_dataset(project_root: Path, output_dir: Path) -> str:
    """Prepare a comprehensive dataset for fine-tuning."""
    print("🔄 Preparing comprehensive training dataset...")
    
    # Define source datasets
    source_datasets = [
        "quest-dev-copilot/quest_copilot_finetuned/training_data.jsonl",
        "quest-dev-copilot/quest_training_dataset_3_examples.jsonl"
    ]
    
    # Collect all examples
    all_examples = []
    
    for dataset_path in source_datasets:
        full_path = project_root / dataset_path
        if full_path.exists():
            print(f"  📁 Processing: {dataset_path}")
            with open(full_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        all_examples.append(json.loads(line.strip()))
        else:
            print(f"  ⚠️  Dataset not found: {dataset_path}")
    
    # Add synthetic examples for better coverage
    synthetic_examples = generate_synthetic_examples()
    all_examples.extend(synthetic_examples)
    
    # Create comprehensive dataset
    comprehensive_path = output_dir / "comprehensive_training_data.jsonl"
    with open(comprehensive_path, 'w', encoding='utf-8') as f:
        for example in all_examples:
            f.write(json.dumps(example) + '\n')
    
    print(f"✅ Comprehensive dataset created: {len(all_examples)} examples")
    print(f"   📄 Location: {comprehensive_path}")
    
    return str(comprehensive_path)

def generate_synthetic_examples() -> List[Dict]:
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

def validate_dataset(dataset_path: str) -> Dict[str, Any]:
    """Validate a training dataset for fine-tuning."""
    print(f"🔍 Validating dataset: {dataset_path}")
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
    
    # Check file size
    file_size_mb = os.path.getsize(dataset_path) / (1024 * 1024)
    if file_size_mb > 1024:  # 1GB limit
        raise ValueError(f"Dataset too large: {file_size_mb:.2f}MB (max 1GB)")
    
    # Validate JSONL format
    examples = []
    line_count = 0
    errors = []
    
    with open(dataset_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line_count += 1
            try:
                data = json.loads(line.strip())
                
                # Validate required structure
                if "messages" not in data:
                    errors.append(f"Line {line_num}: Missing 'messages' field")
                    continue
                
                messages = data["messages"]
                if not isinstance(messages, list) or len(messages) < 2:
                    errors.append(f"Line {line_num}: Invalid messages format")
                    continue
                
                # Validate message roles
                valid_roles = {"system", "user", "assistant"}
                for i, msg in enumerate(messages):
                    if "role" not in msg or "content" not in msg:
                        errors.append(f"Line {line_num}: Message {i} missing role or content")
                        continue
                    
                    if msg["role"] not in valid_roles:
                        errors.append(f"Line {line_num}: Invalid role '{msg['role']}' in message {i}")
                        continue
                
                # Ensure last message is from assistant
                if messages[-1]["role"] != "assistant":
                    errors.append(f"Line {line_num}: Last message must be from assistant")
                    continue
                
                examples.append(data)
                
            except json.JSONDecodeError as e:
                errors.append(f"Line {line_num}: Invalid JSON - {e}")
    
    # Analyze dataset
    analysis = {
        "total_examples": len(examples),
        "file_size_mb": file_size_mb,
        "errors": errors,
        "is_valid": len(errors) == 0,
        "sample_examples": examples[:3] if examples else []
    }
    
    print(f"Dataset validation complete: {len(examples)} valid examples, {len(errors)} errors")
    return analysis

def create_fine_tuning_instructions(dataset_path: str, output_dir: Path) -> str:
    """Create detailed instructions for fine-tuning via the Llama API dashboard."""
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
    
    instructions_path = output_dir / "fine_tuning_instructions.json"
    with open(instructions_path, 'w') as f:
        json.dump(instructions, f, indent=2)
    
    print(f"✅ Instructions created: {instructions_path}")
    return str(instructions_path)

def create_integration_script(output_dir: Path, model_id: str = "your-fine-tuned-model-id") -> str:
    """Create integration script for using the fine-tuned model."""
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

def analyze_error_with_fine_tuned_model(error_log: str, model_id: str = "{model_id}"):
    """Analyze error using fine-tuned model."""
    try:
        # This would use the actual Llama API client
        # For now, we'll show the structure
        print(f"Using fine-tuned model: {{model_id}}")
        print(f"Analyzing error: {{error_log[:100]}}...")
        
        # Placeholder for actual API call
        return {{
            "classification": "example",
            "confidence": 0.95,
            "solution": "Example solution from fine-tuned model"
        }}
        
    except Exception as e:
        print(f"Fine-tuned model analysis failed: {{e}}")
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
'''
    
    script_path = output_dir / "integrate_fine_tuned_model.py"
    with open(script_path, 'w') as f:
        f.write(integration_script)
    
    # Make executable
    os.chmod(script_path, 0o755)
    
    print(f"✅ Integration script created: {script_path}")
    return str(script_path)

def main():
    """Main function to run the fine-tuning pipeline."""
    print("🚀 Starting Quest Dev Copilot Fine-Tuning Pipeline")
    print("=" * 60)
    
    try:
        # Setup paths
        project_root = Path(__file__).parent.parent
        output_dir = project_root / "fine_tuned_models"
        output_dir.mkdir(exist_ok=True)
        
        # Step 1: Prepare comprehensive dataset
        comprehensive_dataset = prepare_comprehensive_dataset(project_root, output_dir)
        
        # Step 2: Validate dataset
        validation = validate_dataset(comprehensive_dataset)
        
        if not validation["is_valid"]:
            print(f"❌ Dataset validation failed:")
            for error in validation["errors"]:
                print(f"   - {error}")
            raise ValueError("Dataset validation failed")
        
        print(f"✅ Dataset validation passed: {validation['total_examples']} examples")
        
        # Step 3: Create fine-tuning instructions
        instructions_path = create_fine_tuning_instructions(comprehensive_dataset, output_dir)
        
        # Step 4: Create integration script
        integration_script = create_integration_script(output_dir)
        
        # Compile results
        results = {
            "pipeline_completed": True,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "dataset": comprehensive_dataset,
            "validation": validation,
            "instructions": instructions_path,
            "integration_script": integration_script,
            "next_steps": [
                "1. Upload dataset to Llama API dashboard at https://llama.developer.meta.com/",
                "2. Create fine-tuning job with provided configuration",
                "3. Monitor training progress",
                "4. Test fine-tuned model performance",
                "5. Integrate with Quest Dev Copilot backend"
            ]
        }
        
        # Save results
        results_path = output_dir / "fine_tuning_pipeline_results.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\n" + "=" * 60)
        print("✅ Fine-Tuning Pipeline Completed Successfully!")
        print("=" * 60)
        print(f"📁 Output directory: {output_dir}")
        print(f"📄 Results saved to: {results_path}")
        print(f"📋 Instructions: {instructions_path}")
        print(f"🔧 Integration script: {integration_script}")
        
        print("\n📋 Next Steps:")
        for i, step in enumerate(results["next_steps"], 1):
            print(f"   {i}. {step}")
        
        print("\n🎉 Fine-tuning pipeline completed successfully!")
        print("Follow the instructions to complete the fine-tuning process.")
        
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 