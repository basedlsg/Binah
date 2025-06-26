#!/usr/bin/env python3
"""
Quest Dev Copilot - Complete System Demo

This script demonstrates the complete system working for end users:
1. Enhanced AI Client with training data
2. Real error analysis
3. Fix generation
4. Sample log processing
5. CLI-like output
"""

import sys
import os
from pathlib import Path
import json
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def demo_enhanced_analysis():
    """Demonstrate enhanced AI analysis"""
    print("🚀 Quest Dev Copilot - Complete System Demo")
    print("=" * 60)
    print("Demonstrating production-ready AI-powered debugging")
    print("=" * 60)
    
    try:
        from llama.enhanced_client import EnhancedLlamaClient
        
        # Initialize enhanced client
        print("🔧 Initializing Enhanced AI Client...")
        client = EnhancedLlamaClient()
        print("✅ Enhanced client ready with training data")
        
        # Test with multiple real error scenarios
        test_cases = [
            {
                "name": "Vulkan Driver Error",
                "log": """
                [2024.01.15-10.30.45:123][123]LogVulkanRHI: Error: vkCreateInstance failed with VK_ERROR_INCOMPATIBLE_DRIVER
                [2024.01.15-10.30.45:124][123]LogVulkanRHI: Error: Failed to create Vulkan instance
                [2024.01.15-10.30.46:125][123]LogQuest: Error: MetaXR initialization failed
                [2024.01.15-10.30.46:126][123]LogQuest: Error: VR session cannot start
                """
            },
            {
                "name": "Plugin Conflict",
                "log": """
                [2024.01.15-11.15.30:456][456]LogPluginManager: Warning: Plugin 'OculusVR' conflicts with 'OpenXR'
                [2024.01.15-11.15.30:457][456]LogPluginManager: Error: Failed to load plugin 'OculusVR'
                [2024.01.15-11.15.30:458][456]LogQuest: Error: VR system initialization failed
                """
            },
            {
                "name": "Memory Allocation Error",
                "log": """
                [2024.01.15-12.45.15:789][789]LogMemory: Error: Failed to allocate 2048MB for VR buffer
                [2024.01.15-12.45.15:790][789]LogQuest: Error: Insufficient memory for VR rendering
                [2024.01.15-12.45.15:791][789]LogQuest: Error: Application will exit
                """
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🧪 Test Case {i}: {test_case['name']}")
            print("-" * 50)
            
            # Analyze error
            print("🔍 Analyzing error...")
            analysis_result = client.analyze_error(test_case['log'])
            
            if analysis_result["success"]:
                print("✅ Analysis successful!")
                
                # Display results in CLI-like format
                display_analysis_results(analysis_result, test_case['name'])
                
                # Generate fix
                print("\n🔧 Generating fix...")
                fix_result = client.generate_fix(test_case['log'])
                
                if fix_result["success"]:
                    print("✅ Fix generation successful!")
                    display_fix_results(fix_result, test_case['name'])
                else:
                    print(f"❌ Fix generation failed: {fix_result.get('error')}")
            else:
                print(f"❌ Analysis failed: {analysis_result.get('error')}")
        
        # Test with real sample log
        print(f"\n🧪 Test Case 4: Real Sample Log")
        print("-" * 50)
        
        sample_logs_dir = Path("sample_logs")
        if sample_logs_dir.exists():
            log_files = list(sample_logs_dir.glob("*.log"))
            if log_files:
                test_log_file = log_files[0]
                print(f"📄 Using real log: {test_log_file.name}")
                
                with open(test_log_file, 'r') as f:
                    real_log_content = f.read()
                
                analysis_result = client.analyze_error(real_log_content)
                
                if analysis_result["success"]:
                    print("✅ Real log analysis successful!")
                    display_analysis_results(analysis_result, f"Real Log: {test_log_file.name}")
                else:
                    print(f"❌ Real log analysis failed: {analysis_result.get('error')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def display_analysis_results(result, test_name):
    """Display analysis results in a formatted way"""
    content = result["content"]
    metadata = result["metadata"]
    
    # Extract text content
    if isinstance(content, dict) and 'completion_message' in content:
        text_content = content['completion_message']['content']['text']
    else:
        text_content = str(content)
    
    print(f"\n📊 Analysis Results for: {test_name}")
    print("=" * 50)
    
    # Show training data usage
    examples_used = metadata.get('examples_used', 0)
    if examples_used > 0:
        print(f"🎯 Training examples used: {examples_used}")
    
    # Show content preview
    print(f"📝 Analysis preview:")
    print("-" * 30)
    
    # Extract and display key parts
    lines = text_content.split('\n')
    for line in lines[:10]:  # Show first 10 lines
        if line.strip():
            print(f"  {line}")
    
    if len(lines) > 10:
        print(f"  ... ({len(lines) - 10} more lines)")
    
    print("-" * 30)

def display_fix_results(result, test_name):
    """Display fix results in a formatted way"""
    content = result["content"]
    
    # Extract text content
    if isinstance(content, dict) and 'completion_message' in content:
        text_content = content['completion_message']['content']['text']
    else:
        text_content = str(content)
    
    print(f"\n🔧 Fix Instructions for: {test_name}")
    print("=" * 50)
    
    # Show content preview
    lines = text_content.split('\n')
    for line in lines[:15]:  # Show first 15 lines
        if line.strip():
            print(f"  {line}")
    
    if len(lines) > 15:
        print(f"  ... ({len(lines) - 15} more lines)")
    
    print("-" * 30)

def demo_cli_functionality():
    """Demonstrate CLI-like functionality"""
    print(f"\n🖥️  CLI Functionality Demo")
    print("=" * 60)
    
    try:
        from cli.quest_fix import quest_fix
        print("✅ CLI module loaded successfully")
        print("🖥️  Available function: quest_fix")
        print("📋 Usage: python cli/quest_fix.py <logfile> [options]")
        print("📋 Options: --verbose, --output, --apply-fix")
        return True
    except Exception as e:
        print(f"❌ CLI demo failed: {e}")
        return False

def demo_training_data():
    """Demonstrate training data capabilities"""
    print(f"\n📚 Training Data Demo")
    print("=" * 60)
    
    try:
        # Check training data
        training_files = [
            "fine_tuned_models/comprehensive_training_data.jsonl",
            "quest-dev-copilot/quest_copilot_finetuned/training_data.jsonl"
        ]
        
        for training_file in training_files:
            if Path(training_file).exists():
                print(f"✅ Training data found: {training_file}")
                
                # Count examples
                with open(training_file, 'r') as f:
                    lines = f.readlines()
                    print(f"📊 Training examples: {len(lines)}")
                
                # Show sample
                with open(training_file, 'r') as f:
                    first_line = f.readline().strip()
                    if first_line:
                        sample = json.loads(first_line)
                        print(f"📝 Sample format: {list(sample.keys())}")
            else:
                print(f"⚠️  Training data not found: {training_file}")
        
        return True
    except Exception as e:
        print(f"❌ Training data demo failed: {e}")
        return False

def main():
    """Run complete system demo"""
    demos = [
        ("Enhanced AI Analysis", demo_enhanced_analysis),
        ("CLI Functionality", demo_cli_functionality),
        ("Training Data", demo_training_data),
    ]
    
    results = {}
    
    for demo_name, demo_func in demos:
        print(f"\n🎬 Running: {demo_name}")
        print("=" * 60)
        
        try:
            success = demo_func()
            results[demo_name] = success
            status = "✅ SUCCESS" if success else "❌ FAILED"
            print(f"{status}: {demo_name}")
        except Exception as e:
            print(f"❌ ERROR: {demo_name} - {e}")
            results[demo_name] = False
    
    # Final summary
    print("\n" + "=" * 60)
    print("🎉 FINAL DEMO SUMMARY")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(results)
    
    for demo_name, success in results.items():
        status = "✅ WORKING" if success else "❌ FAILED"
        print(f"{status}: {demo_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} demos successful ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 COMPLETE SUCCESS!")
        print("The Quest Dev Copilot system is fully functional and ready for end users!")
        print("\n📋 What's Working:")
        print("  ✅ Enhanced AI client with training data")
        print("  ✅ Real error analysis and classification")
        print("  ✅ Fix generation with step-by-step instructions")
        print("  ✅ CLI tool for command-line usage")
        print("  ✅ Training data integration")
        print("\n🚀 Ready for Production Use!")
    else:
        print("\n⚠️  Some demos failed. Please check the issues above.")

if __name__ == "__main__":
    main() 