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
            split_data=args.split_data
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
    
    args = parser.parse_args()
    
    # Check environment
    if not os.getenv('LLAMA_API_KEY'):
        logger.error("❌ LLAMA_API_KEY environment variable not set")
        logger.info("   Please set your Llama API key:")
        logger.info("   export LLAMA_API_KEY='your_api_key_here'")
        sys.exit(1)
    
    try:
        trainer = QuestLlamaAPITrainer()
        asyncio.run(trainer.run_training(args))
    except KeyboardInterrupt:
        logger.info("⏹️  Training interrupted by user")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
