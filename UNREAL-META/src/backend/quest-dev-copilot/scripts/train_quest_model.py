#!/usr/bin/env python3
"""
Quest Dev Copilot Model Training Script

This script trains a local AI model using real forum data from Meta Quest development communities.
Since Lambda API only provides inference endpoints (not fine-tuning), we use local training
with HuggingFace transformers and LoRA for efficient fine-tuning.

Usage:
    python scripts/train_quest_model.py --data-dir scraper/scraped_data_output --output-dir quest_copilot_model
"""

import os
import sys
import json
import logging
import argparse
import asyncio
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from llama.training_client import LocalTrainingClient, LocalTrainingConfig, TrainingMetrics
from llama.ai_error_analyzer import AIErrorAnalyzer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class QuestModelTrainer:
    """Main trainer class for Quest Dev Copilot models"""
    
    def __init__(self, config: LocalTrainingConfig):
        self.config = config
        self.training_client = LocalTrainingClient(config)
        
    def discover_forum_data(self, data_dir: str) -> List[str]:
        """Discover all forum data files in the data directory"""
        data_path = Path(data_dir)
        if not data_path.exists():
            raise FileNotFoundError(f"Data directory not found: {data_dir}")
        
        # Find all JSON files
        json_files = list(data_path.glob("*.json"))
        
        if not json_files:
            raise FileNotFoundError(f"No JSON files found in {data_dir}")
        
        logger.info(f"Found {len(json_files)} data files:")
        for file in json_files:
            logger.info(f"  - {file.name}")
        
        return [str(f) for f in json_files]
    
    def analyze_training_data(self, data_files: List[str]) -> Dict[str, Any]:
        """Analyze the training data to understand its composition"""
        logger.info("Analyzing training data composition...")
        
        total_posts = 0
        solved_posts = 0
        error_types = {}
        forums = {}
        date_range = {"earliest": None, "latest": None}
        
        for data_file in data_files:
            logger.info(f"Analyzing {data_file}")
            
            with open(data_file, 'r', encoding='utf-8') as f:
                posts = json.load(f)
            
            for post in posts:
                total_posts += 1
                
                # Count solved posts
                if post.get('has_solution'):
                    solved_posts += 1
                
                # Count error types
                error_type = post.get('error_type', 'unknown')
                error_types[error_type] = error_types.get(error_type, 0) + 1
                
                # Count forums
                forum = post.get('forum', 'unknown')
                forums[forum] = forums.get(forum, 0) + 1
                
                # Track date range
                post_date = post.get('date_scraped')
                if post_date:
                    if not date_range["earliest"] or post_date < date_range["earliest"]:
                        date_range["earliest"] = post_date
                    if not date_range["latest"] or post_date > date_range["latest"]:
                        date_range["latest"] = post_date
        
        analysis = {
            "total_posts": total_posts,
            "solved_posts": solved_posts,
            "solve_rate": solved_posts / total_posts if total_posts > 0 else 0,
            "error_types": error_types,
            "forums": forums,
            "date_range": date_range,
            "training_potential": self._assess_training_potential(total_posts, solved_posts, error_types)
        }
        
        # Log analysis results
        logger.info(f"Training Data Analysis:")
        logger.info(f"  Total Posts: {total_posts}")
        logger.info(f"  Solved Posts: {solved_posts} ({analysis['solve_rate']:.1%})")
        logger.info(f"  Error Types: {dict(sorted(error_types.items(), key=lambda x: x[1], reverse=True))}")
        logger.info(f"  Forums: {dict(sorted(forums.items(), key=lambda x: x[1], reverse=True))}")
        logger.info(f"  Date Range: {date_range['earliest']} to {date_range['latest']}")
        logger.info(f"  Training Potential: {analysis['training_potential']}")
        
        return analysis
    
    def _assess_training_potential(self, total_posts: int, solved_posts: int, error_types: Dict[str, int]) -> str:
        """Assess the potential quality of training based on data composition"""
        if total_posts < 50:
            return "LOW - Insufficient data for effective training"
        elif solved_posts < 10:
            return "LOW - Too few solved examples for supervised learning"
        elif len(error_types) < 3:
            return "MEDIUM - Limited error type diversity"
        elif total_posts >= 200 and solved_posts >= 50:
            return "HIGH - Excellent data diversity and solved examples"
        else:
            return "MEDIUM - Adequate data for basic training"
    
    async def run_training_pipeline(self, data_files: List[str]) -> TrainingMetrics:
        """Run the complete training pipeline"""
        logger.info("Starting Quest Dev Copilot training pipeline")
        
        try:
            # Analyze training data
            data_analysis = self.analyze_training_data(data_files)
            
            # Check if we have enough data
            if data_analysis["total_posts"] < 20:
                raise ValueError(f"Insufficient training data: {data_analysis['total_posts']} posts (minimum 20 required)")
            
            # Run training
            logger.info("Starting model training...")
            metrics = await self.training_client.run_full_training_pipeline(data_files)
            
            # Save training report
            self._save_training_report(data_analysis, metrics)
            
            logger.info("Training pipeline completed successfully!")
            return metrics
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            raise
    
    def _save_training_report(self, data_analysis: Dict[str, Any], metrics: TrainingMetrics):
        """Save comprehensive training report"""
        report = {
            "training_timestamp": datetime.now().isoformat(),
            "model_config": {
                "base_model": self.config.base_model_name,
                "output_dir": self.config.output_dir,
                "max_length": self.config.max_length,
                "batch_size": self.config.batch_size,
                "learning_rate": self.config.learning_rate,
                "num_epochs": self.config.num_epochs,
                "use_lora": self.config.use_lora
            },
            "data_analysis": data_analysis,
            "training_metrics": {
                "training_loss": metrics.training_loss,
                "eval_loss": metrics.eval_loss,
                "perplexity": metrics.perplexity,
                "training_time_seconds": metrics.training_time,
                "model_size_mb": metrics.model_size_mb,
                "examples_processed": metrics.examples_processed
            },
            "recommendations": self._generate_recommendations(data_analysis, metrics)
        }
        
        report_path = f"{self.config.output_dir}/training_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Training report saved to {report_path}")
    
    def _generate_recommendations(self, data_analysis: Dict[str, Any], metrics: TrainingMetrics) -> List[str]:
        """Generate recommendations for improving the model"""
        recommendations = []
        
        # Data recommendations
        if data_analysis["solve_rate"] < 0.3:
            recommendations.append("Consider collecting more solved forum posts to improve solution quality")
        
        if data_analysis["total_posts"] < 100:
            recommendations.append("Increase training data size for better model performance")
        
        # Model performance recommendations
        if metrics.training_loss > 2.0:
            recommendations.append("Consider increasing training epochs or adjusting learning rate")
        
        if metrics.perplexity > 20:
            recommendations.append("High perplexity indicates poor model fit - consider data quality improvements")
        
        # Error type coverage
        error_counts = data_analysis["error_types"]
        if len(error_counts) < 4:
            recommendations.append("Expand error type coverage by collecting more diverse forum posts")
        
        # Specific error type recommendations
        if error_counts.get("packaging_error", 0) < 10:
            recommendations.append("Add more packaging/build error examples for better auto-fix capabilities")
        
        if error_counts.get("plugin_conflict", 0) < 10:
            recommendations.append("Include more plugin conflict examples for VR-specific issue handling")
        
        return recommendations

async def test_trained_model(model_path: str, test_cases: List[str]):
    """Test the trained model with sample error cases"""
    logger.info(f"Testing trained model at {model_path}")
    
    analyzer = AIErrorAnalyzer(use_local_model=True, model_path=model_path)
    
    for i, test_case in enumerate(test_cases, 1):
        logger.info(f"Test Case {i}: {test_case[:100]}...")
        
        try:
            result = await analyzer.analyze_error(test_case)
            logger.info(f"  Classification: {result.classification.get('error_type', 'unknown')}")
            logger.info(f"  Confidence: {result.confidence:.2f}")
            logger.info(f"  Solution: {result.solution[:150]}...")
            logger.info(f"  Processing Time: {result.processing_time:.2f}s")
        except Exception as e:
            logger.error(f"  Test failed: {e}")
        
        logger.info("-" * 50)

def main():
    parser = argparse.ArgumentParser(description="Train Quest Dev Copilot AI model")
    parser.add_argument("--data-dir", required=True, help="Directory containing forum data JSON files")
    parser.add_argument("--output-dir", default="quest_copilot_model", help="Output directory for trained model")
    parser.add_argument("--base-model", default="microsoft/DialoGPT-medium", help="Base model to fine-tune")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=4, help="Training batch size")
    parser.add_argument("--learning-rate", type=float, default=5e-5, help="Learning rate")
    parser.add_argument("--max-length", type=int, default=512, help="Maximum sequence length")
    parser.add_argument("--no-lora", action="store_true", help="Disable LoRA (use full fine-tuning)")
    parser.add_argument("--test", action="store_true", help="Run tests after training")
    
    args = parser.parse_args()
    
    # Create training configuration
    config = LocalTrainingConfig(
        base_model_name=args.base_model,
        output_dir=args.output_dir,
        max_length=args.max_length,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        num_epochs=args.epochs,
        use_lora=not args.no_lora
    )
    
    # Create trainer
    trainer = QuestModelTrainer(config)
    
    async def run_training():
        try:
            # Discover training data
            data_files = trainer.discover_forum_data(args.data_dir)
            
            # Run training
            metrics = await trainer.run_training_pipeline(data_files)
            
            logger.info("Training Summary:")
            logger.info(f"  Final Loss: {metrics.training_loss:.4f}")
            logger.info(f"  Perplexity: {metrics.perplexity:.2f}")
            logger.info(f"  Training Time: {metrics.training_time:.2f}s")
            logger.info(f"  Model Size: {metrics.model_size_mb:.2f} MB")
            logger.info(f"  Examples Processed: {metrics.examples_processed}")
            
            # Run tests if requested
            if args.test:
                test_cases = [
                    "LogPlayLevel: Error: UAT: ERROR: Stage Failed. Missing receipt. Check that this target has been built.",
                    "Assertion failed: AsyncLoadingThread.RecursionNotAllowed.Increment() == 1",
                    "UnauthorizedAccessException: Access to the path is denied",
                    "The 'OculusPlatform' plugin was designed for build 5.3.0. Attempt to load it anyway?"
                ]
                
                await test_trained_model(args.output_dir, test_cases)
            
            logger.info(f"Model training completed! Saved to: {args.output_dir}")
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            sys.exit(1)
    
    # Run the training
    asyncio.run(run_training())

if __name__ == "__main__":
    main() 