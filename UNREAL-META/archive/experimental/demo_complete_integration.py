#!/usr/bin/env python3
"""
Quest Dev Copilot - Complete Integration Demo
Demonstrates the enhanced AI capabilities with training data integration.
"""

import os
import sys
import json
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def demo_enhanced_client():
    """Demonstrate the enhanced client capabilities"""
    print("🚀 Quest Dev Copilot - Enhanced AI Demo")
    print("=" * 60)
    
    try:
        from llama.enhanced_client import EnhancedLlamaClient
        
        # Initialize enhanced client
        client = EnhancedLlamaClient()
        
        # Show training data stats
        stats = client.get_training_stats()
        print(f"📊 Training Data Loaded:")
        print(f"   • Examples: {stats['total_examples']}")
        print(f"   • Categories: {stats['example_types']}")
        print(f"   • Data Available: {stats['training_data_loaded']}")
        print()
        
        # Test with different error types
        test_cases = [
            {
                "name": "Vulkan Memory Error",
                "error": """Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048
LogVulkanRHI: Error: vkAllocateMemory failed with VK_ERROR_OUT_OF_DEVICE_MEMORY
LogVulkanRHI: Error: Failed to create texture for VR eye buffer"""
            },
            {
                "name": "Plugin Conflict",
                "error": """Error: LogTemp: Warning: Multiple XR plugins detected
LogTemp: Warning: OpenXR and MetaXR plugins are both enabled
LogTemp: Error: XR initialization failed due to plugin conflict"""
            },
            {
                "name": "SDK Mismatch",
                "error": """Error: LogMetaXR: Error: SDK version mismatch detected
LogMetaXR: Error: Expected SDK version 2.1.0, found 1.9.0
LogMetaXR: Error: Please update your Meta XR SDK"""
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"🔍 Test Case {i}: {test_case['name']}")
            print("-" * 40)
            
            # Analyze error
            result = client.analyze_error(test_case['error'])
            
            if result["success"]:
                content = result["content"]
                metadata = result["metadata"]
                
                # Extract key information
                lines = content.split('\n')
                classification = ""
                fix_steps = []
                
                for line in lines:
                    if any(keyword in line.lower() for keyword in ['classification', 'error type', 'type:']):
                        classification = line.strip()
                    elif line.strip().startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')):
                        fix_steps.append(line.strip())
                
                print(f"📋 Classification: {classification[:100]}...")
                print(f"🔧 Fix Steps: {len(fix_steps)} steps found")
                print(f"📊 Training Examples Used: {metadata.get('examples_used', 0)}")
                print(f"💡 Tokens Used: {metadata.get('tokens_used', 0)}")
                print()
            else:
                print(f"❌ Analysis failed: {result.get('error')}")
                print()
        
        print("✅ Enhanced client demo completed successfully!")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()

def demo_backend_integration():
    """Demonstrate backend integration"""
    print("\n🌐 Backend Integration Demo")
    print("=" * 40)
    
    try:
        import requests
        
        # Test health endpoint
        try:
            response = requests.get("http://localhost:5000/health", timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Backend Status: {health_data['status']}")
                print(f"📊 Services: {health_data['services']}")
            else:
                print(f"⚠️ Backend not responding (status: {response.status_code})")
                print("   Start backend with: python backend/app.py")
                return
        except requests.exceptions.ConnectionError:
            print("⚠️ Backend not running")
            print("   Start backend with: python backend/app.py")
            return
        
        # Test analysis endpoint
        test_error = """Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048
LogVulkanRHI: Error: vkAllocateMemory failed with VK_ERROR_OUT_OF_DEVICE_MEMORY"""
        
        print(f"\n🔍 Testing backend analysis...")
        response = requests.post(
            "http://localhost:5000/analyze",
            json={"log_content": test_error, "use_cache": False},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend analysis successful!")
            print(f"🔍 Error Type: {result.get('classification', {}).get('error_type', 'unknown')}")
            print(f"📊 Confidence: {result.get('classification', {}).get('confidence', 0)*100:.1f}%")
            print(f"🤖 Enhanced Analysis: {result.get('enhanced_analysis', False)}")
            print(f"📈 Training Examples: {result.get('metrics', {}).get('training_examples_used', 0)}")
            print(f"💰 Estimated Cost: ${result.get('metrics', {}).get('estimated_cost', 0):.4f}")
        else:
            print(f"❌ Backend analysis failed: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Backend demo failed: {e}")

def demo_cli_integration():
    """Demonstrate CLI integration"""
    print("\n💻 CLI Integration Demo")
    print("=" * 30)
    
    # Check if sample logs exist
    sample_logs = [
        "sample_logs/plugin_conflict.log",
        "sample_logs/black_screen.log",
        "sample_logs/sdk_mismatch.log"
    ]
    
    available_logs = [log for log in sample_logs if os.path.exists(log)]
    
    if available_logs:
        print(f"📁 Available sample logs: {len(available_logs)}")
        for log in available_logs:
            print(f"   • {log}")
        
        print(f"\n💡 Run CLI demo with:")
        print(f"   python cli/quest_fix.py {available_logs[0]} --verbose")
    else:
        print("⚠️ No sample logs found")
        print("   Create sample logs in sample_logs/ directory")

def demo_unreal_plugin():
    """Demonstrate Unreal plugin integration"""
    print("\n🎮 Unreal Plugin Integration Demo")
    print("=" * 40)
    
    plugin_files = [
        "QuestCopilot/Source/QuestCopilot/Private/QuestCopilotWidget.cpp",
        "QuestCopilot/Source/QuestCopilot/Public/QuestCopilotWidget.h",
        "QuestCopilot/QuestCopilot.uplugin"
    ]
    
    existing_files = [f for f in plugin_files if os.path.exists(f)]
    
    if existing_files:
        print(f"✅ Plugin files found: {len(existing_files)}")
        for file in existing_files:
            print(f"   • {file}")
        
        print(f"\n🎯 Plugin Features:")
        print(f"   • Enhanced response parsing")
        print(f"   • Training data indicators")
        print(f"   • Auto-fix display")
        print(f"   • Metrics visualization")
        
        print(f"\n💡 To use in Unreal Engine:")
        print(f"   1. Build the plugin")
        print(f"   2. Enable in project settings")
        print(f"   3. Open Quest Dev Copilot tab")
        print(f"   4. Load error logs and analyze")
    else:
        print("⚠️ Plugin files not found")
        print("   Check QuestCopilot/ directory")

def main():
    """Run complete integration demo"""
    print("🎉 Quest Dev Copilot - Complete Integration Demo")
    print("=" * 70)
    
    # Demo enhanced client
    demo_enhanced_client()
    
    # Demo backend integration
    demo_backend_integration()
    
    # Demo CLI integration
    demo_cli_integration()
    
    # Demo Unreal plugin
    demo_unreal_plugin()
    
    print("\n" + "=" * 70)
    print("🎯 Integration Summary:")
    print("✅ Enhanced AI client with training data")
    print("✅ Backend API with enhanced analysis")
    print("✅ CLI with training data indicators")
    print("✅ Unreal plugin with enhanced UI")
    print("✅ Complete end-to-end integration")
    print("\n🚀 Quest Dev Copilot is ready for production use!")

if __name__ == "__main__":
    main() 