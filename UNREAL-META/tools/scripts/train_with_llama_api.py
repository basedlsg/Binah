#!/usr/bin/env python3
"""
Quest Dev Copilot - Llama API Fine-tuning Script

This script uses the actual Meta Llama API for fine-tuning, following the official documentation:
https://llama.developer.meta.com/docs/features/fine-tuning/

Usage:
    python scripts/train_with_llama_api.py --data-file scraper/scraped_data_output/forum_posts_20250624_001518.json
"""

import os
import sys
import asyncio
import argparse
import logging
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from llama.llama_api_finetuning import (
    LlamaAPIFineTuningClient, 
    LlamaFineTuningConfig, 
    run_complete_finetuning_pipeline
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'llama_api_training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class QuestLlamaAPITrainer:
    """Trainer for Quest Dev Copilot using Llama API"""
    
    def __init__(self):
        self.client = LlamaAPIFineTuningClient()
    
    async def run_training(self, args):
        """Run the complete training pipeline"""
        logger.info("🚀 Starting Quest Dev Copilot Llama API Fine-tuning")
        
        # Validate inputs
        if not os.path.exists(args.data_file):
            raise FileNotFoundError(f"Data file not found: {args.data_file}")
        
        if not os.getenv('LLAMA_API_KEY'):
            raise ValueError("LLAMA_API_KEY environment variable not set")
        
        # Configure fine-tuning
        config = LlamaFineTuningConfig(
            base_model=args.base_model,
            job_name=args.job_name,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate_multiplier=args.learning_rate,
            split_data=args.split_data if hasattr(args, 'split_data') else True
        )
        
        logger.info(f"📋 Fine-tuning Configuration:")
        logger.info(f"   Base Model: {config.base_model}")
        logger.info(f"   Job Name: {config.job_name}")
        logger.info(f"   Epochs: {config.epochs}")
        logger.info(f"   Batch Size: {config.batch_size}")
        logger.info(f"   Learning Rate Multiplier: {config.learning_rate_multiplier}")
        logger.info(f"   Auto-split Data: {config.split_data}")
        
        try:
            # Run the complete pipeline
            job = await run_complete_finetuning_pipeline(
                forum_data_path=args.data_file,
                output_dir=args.output_dir,
                config=config
            )
            
            logger.info("✅ Fine-tuning Pipeline Completed!")
            logger.info(f"   Job ID: {job.job_id}")
            logger.info(f"   Status: {job.status}")
            
            if job.model_name:
                logger.info(f"   Fine-tuned Model: {job.model_name}")
                logger.info(f"🎉 Your Quest Dev Copilot model is ready!")
                logger.info(f"   You can now use model '{job.model_name}' with the Llama API")
            else:
                logger.error(f"❌ Fine-tuning failed with status: {job.status}")
                
            return job
            
        except Exception as e:
            logger.error(f"❌ Fine-tuning failed: {e}")
            raise
    
    async def list_existing_jobs(self):
        """List all existing fine-tuning jobs"""
        logger.info("📋 Listing existing fine-tuning jobs...")
        
        try:
            jobs = await self.client.list_jobs()
            
            if not jobs:
                logger.info("   No fine-tuning jobs found")
                return
            
            logger.info(f"   Found {len(jobs)} fine-tuning jobs:")
            for job in jobs:
                status_emoji = "✅" if job.status == "succeeded" else "⏳" if job.status in ["running", "pending"] else "❌"
                logger.info(f"   {status_emoji} {job.job_name} ({job.job_id}) - {job.status}")
                if job.model_name:
                    logger.info(f"      Model: {job.model_name}")
                    
        except Exception as e:
            logger.error(f"❌ Failed to list jobs: {e}")
    
    async def test_existing_model(self, model_name: str):
        """Test an existing fine-tuned model"""
        logger.info(f"🧪 Testing model: {model_name}")
        
        test_cases = [
            {
                "name": "Black Screen Error",
                "prompt": """Title: Black Screen on Quest 2
Platform: Quest VR / Unreal Engine
Description: Getting black screen when launching my VR app on Quest 2. Works fine in editor.
Error Logs:
VRDisplayComponent: Failed to initialize display
Please analyze this error and provide a solution with classification and confidence score."""
            },
            {
                "name": "Plugin Conflict",
                "prompt": """Title: Plugin Conflict Error
Platform: Quest VR / Unreal Engine
Description: Getting errors about missing modules when trying to package for Android.
Error Logs:
UATHelper: Missing module: OculusXR
Please analyze this error and provide a solution with classification and confidence score."""
            }
        ]
        
        try:
            for test_case in test_cases:
                logger.info(f"   Testing: {test_case['name']}")
                response = await self.client.test_finetuned_model(model_name, test_case['prompt'])
                logger.info(f"   Response:\n{response}\n")
                
        except Exception as e:
            logger.error(f"❌ Failed to test model: {e}")

def main():
    parser = argparse.ArgumentParser(description="Quest Dev Copilot Llama API Fine-tuning")
    
    # Main action
    parser.add_argument('--action', choices=['train', 'list', 'test'], default='train',
                       help='Action to perform')
    
    # Training arguments
    parser.add_argument('--data-file', type=str, 
                       default='scraper/scraped_data_output/forum_posts_20250624_001518.json',
                       help='Path to forum data JSON file')
    parser.add_argument('--output-dir', type=str, default='quest_copilot_finetuned',
                       help='Output directory for training artifacts')
    
    # Model configuration
    parser.add_argument('--base-model', type=str, default='Llama-3.3-8B-Instruct',
                       help='Base model to fine-tune')
    parser.add_argument('--job-name', type=str, 
                       default=f'quest-copilot-{datetime.now().strftime("%Y%m%d-%H%M%S")}',
                       help='Name for the fine-tuning job')
    
    # Hyperparameters
    parser.add_argument('--epochs', type=int, default=3,
                       help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=4,
                       help='Training batch size')
    parser.add_argument('--learning-rate', type=float, default=1.0,
                       help='Learning rate multiplier (base: 3e-4)')
    parser.add_argument('--split-data', action='store_true',
                       help='Automatically split data for evaluation')
    
    # Testing arguments
    parser.add_argument('--model-name', type=str,
                       help='Name of fine-tuned model to test')
    
    args = parser.parse_args()
    
    async def run_action():
        trainer = QuestLlamaAPITrainer()
        
        if args.action == 'train':
            await trainer.run_training(args)
        elif args.action == 'list':
            await trainer.list_existing_jobs()
        elif args.action == 'test':
            if not args.model_name:
                logger.error("❌ --model-name required for testing")
                return
            await trainer.test_existing_model(args.model_name)
    
    # Check environment
    if not os.getenv('LLAMA_API_KEY'):
        logger.error("❌ LLAMA_API_KEY environment variable not set")
        logger.info("   Please set your Llama API key:")
        logger.info("   export LLAMA_API_KEY='your_api_key_here'")
        sys.exit(1)
    
    try:
        asyncio.run(run_action())
    except KeyboardInterrupt:
        logger.info("⏹️  Training interrupted by user")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 