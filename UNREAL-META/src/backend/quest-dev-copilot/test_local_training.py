#!/usr/bin/env python3
"""
Simple test script for local training implementation
"""

import os
import sys
import json
import asyncio
import logging
from pathlib import Path

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_data_loading():
    """Test loading forum data"""
    logger.info("Testing data loading...")
    
    try:
        from llama.training_client import LocalTrainingClient, LocalTrainingConfig
        
        config = LocalTrainingConfig(
            output_dir="test_model",
            num_epochs=1,
            batch_size=1,
            max_length=256
        )
        
        client = LocalTrainingClient(config)
        
        # Use the actual forum posts file (not the summary)
        data_file = "scraper/scraped_data_output/forum_posts_20250624_001518.json"
        
        if not Path(data_file).exists():
            logger.error(f"Forum posts file not found: {data_file}")
            return False
        
        logger.info(f"Loading data from {data_file}")
        
        processed_data = client.load_forum_data(data_file)
        
        logger.info(f"Successfully loaded {len(processed_data)} training examples")
        
        # Show sample data
        if processed_data:
            sample = processed_data[0]
            logger.info("Sample training example:")
            logger.info(f"  Input: {sample['input'][:100]}...")
            logger.info(f"  Output: {sample['output'][:100]}...")
            logger.info(f"  Error Type: {sample['error_type']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Data loading test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ai_analyzer_fallback():
    """Test AI analyzer fallback to Lambda API"""
    logger.info("Testing AI analyzer fallback...")
    
    try:
        from llama.ai_error_analyzer import AIErrorAnalyzer
        
        # Test with non-existent local model (should fallback to Lambda API)
        analyzer = AIErrorAnalyzer(
            use_local_model=True,
            model_path="non_existent_model"
        )
        
        # Check if it properly fell back to Lambda API
        if analyzer.lambda_client is not None:
            logger.info("Successfully fell back to Lambda API")
            return True
        else:
            logger.error("Failed to initialize Lambda API fallback")
            return False
            
    except Exception as e:
        logger.error(f"AI analyzer test failed: {e}")
        return False

async def test_lambda_api_analysis():
    """Test Lambda API error analysis"""
    logger.info("Testing Lambda API analysis...")
    
    try:
        from llama.ai_error_analyzer import AIErrorAnalyzer
        
        # Initialize with Lambda API
        analyzer = AIErrorAnalyzer(use_local_model=False)
        
        # Test error log
        error_log = """
        LogPlayLevel: Error: UAT: ERROR: Stage Failed. 
        Missing receipt 'D:\\Unreal\\Project\\Starter_521\\Binaries\\Android\\Starter_521.target'. 
        Check that this target has been built.
        """
        
        # Analyze error
        result = await analyzer.analyze_error(error_log)
        
        logger.info("Lambda API analysis result:")
        logger.info(f"  Error Type: {result.classification.get('error_type', 'unknown')}")
        logger.info(f"  Confidence: {result.confidence:.2f}")
        logger.info(f"  Solution: {result.solution[:150]}...")
        logger.info(f"  Processing Time: {result.processing_time:.2f}s")
        
        return True
        
    except Exception as e:
        logger.error(f"Lambda API test failed: {e}")
        return False

def test_training_data_analysis():
    """Test training data analysis functionality"""
    logger.info("Testing training data analysis...")
    
    try:
        # Import the trainer class
        sys.path.append(str(Path(__file__).parent / "scripts"))
        from train_quest_model import QuestModelTrainer
        from llama.training_client import LocalTrainingConfig
        
        config = LocalTrainingConfig(output_dir="test_model")
        trainer = QuestModelTrainer(config)
        
        # Analyze the forum data
        data_files = ["scraper/scraped_data_output/forum_posts_20250624_001518.json"]
        analysis = trainer.analyze_training_data(data_files)
        
        logger.info("Training data analysis results:")
        logger.info(f"  Total Posts: {analysis['total_posts']}")
        logger.info(f"  Solved Posts: {analysis['solved_posts']}")
        logger.info(f"  Solve Rate: {analysis['solve_rate']:.1%}")
        logger.info(f"  Error Types: {analysis['error_types']}")
        logger.info(f"  Training Potential: {analysis['training_potential']}")
        
        return analysis['total_posts'] > 0
        
    except Exception as e:
        logger.error(f"Training data analysis test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    logger.info("Starting Quest Dev Copilot local training tests")
    logger.info("=" * 60)
    
    tests = [
        ("Data Loading", test_data_loading),
        ("Training Data Analysis", test_training_data_analysis),
        ("AI Analyzer Fallback", test_ai_analyzer_fallback),
    ]
    
    # Add Lambda API test if API key is available
    if os.getenv('LLAMA_API_KEY'):
        tests.append(("Lambda API Analysis", test_lambda_api_analysis))
    else:
        logger.warning("LLAMA_API_KEY not found, skipping Lambda API test")
    
    results = {}
    
    for test_name, test_func in tests:
        logger.info(f"\nRunning test: {test_name}")
        logger.info("-" * 40)
        
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = asyncio.run(test_func())
            else:
                result = test_func()
            
            results[test_name] = result
            status = "PASSED" if result else "FAILED"
            logger.info(f"Test {test_name}: {status}")
            
        except Exception as e:
            results[test_name] = False
            logger.error(f"Test {test_name} failed with exception: {e}")
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! Local training implementation is working correctly.")
        logger.info("\nNext steps:")
        logger.info("1. Install training dependencies: pip install torch transformers datasets peft")
        logger.info("2. Run training: python scripts/train_quest_model.py --data-dir scraper/scraped_data_output")
    else:
        logger.warning("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 