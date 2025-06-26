#!/usr/bin/env python3
"""
Quest Dev Copilot - Llama API Fine-Tuning Script
Uses actual Llama API endpoints for fine-tuning.

Usage:
    python scripts/run_api_fine_tuning.py
"""

import os
import sys
import json
import time
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from llama.api_fine_tuning import LlamaAPIFineTuningClient, FineTuningConfig

def main():
    """Run the Llama API fine-tuning pipeline."""
    print("🚀 Starting Llama API Fine-Tuning Pipeline")
    print("=" * 60)
    
    try:
        # Check if API key is available
        api_key = os.getenv("LLAMA_API_KEY")
        if not api_key:
            print("❌ LLAMA_API_KEY environment variable not set")
            print("Please set your Llama API key:")
            print("export LLAMA_API_KEY='your-api-key-here'")
            sys.exit(1)
        
        # Initialize client
        client = LlamaAPIFineTuningClient()
        
        # Check if dataset exists
        dataset_path = "fine_tuned_models/comprehensive_training_data.jsonl"
        if not os.path.exists(dataset_path):
            print(f"❌ Dataset not found: {dataset_path}")
            print("Please run the dataset preparation script first:")
            print("python scripts/simple_fine_tuning.py")
            sys.exit(1)
        
        # Configure fine-tuning
        config = FineTuningConfig(
            base_model="Llama-3.3-8B-Instruct",
            job_name="quest-dev-copilot-production",
            epochs=3,
            batch_size=4,
            learning_rate_multiplier=1.0
        )
        
        print(f"📁 Dataset: {dataset_path}")
        print(f"🤖 Base Model: {config.base_model}")
        print(f"📊 Epochs: {config.epochs}")
        print(f"📦 Batch Size: {config.batch_size}")
        print(f"🎯 Job Name: {config.job_name}")
        print()
        
        # Run the pipeline
        results = client.run_complete_fine_tuning_pipeline(dataset_path, config)
        
        # Save results
        results_path = "api_fine_tuning_results.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\n" + "=" * 60)
        print("✅ API Fine-Tuning Pipeline Completed!")
        print("=" * 60)
        print(f"📄 Results saved to: {results_path}")
        print(f"🆔 Dataset ID: {results['dataset_id']}")
        print(f"🆔 Job ID: {results['job'].job_id}")
        print(f"📊 Status: {results['job'].status}")
        
        if results['job'].model_name:
            print(f"🤖 Fine-tuned Model: {results['job'].model_name}")
        
        print("\n📋 Next Steps:")
        for i, step in enumerate(results["next_steps"], 1):
            print(f"   {i}. {step}")
        
        print("\n🔍 Monitor Progress:")
        print(f"   curl -H 'Authorization: Bearer $LLAMA_API_KEY' \\")
        print(f"        'https://api.llama.com/v1/fine_tuning/jobs/{results['job'].job_id}'")
        
        print("\n🎉 Fine-tuning job created successfully!")
        print("The job will take 2-4 hours to complete.")
        
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 