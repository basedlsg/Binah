#!/usr/bin/env python3
"""
Test script to verify the enhanced client integration
"""

import os
import sys
import json
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_enhanced_client():
    """Test the enhanced client directly"""
    print("🧪 Testing Enhanced Client Integration")
    print("=" * 50)
    
    try:
        from llama.enhanced_client import EnhancedLlamaClient
        
        # Initialize client
        client = EnhancedLlamaClient()
        
        # Get training stats
        stats = client.get_training_stats()
        print(f"✅ Training data loaded: {stats['training_data_loaded']}")
        print(f"📊 Training examples: {stats['total_examples']}")
        print(f"📋 Categories: {stats['example_types']}")
        
        # Test with a sample error
        test_error = """Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048
LogVulkanRHI: Error: vkAllocateMemory failed with VK_ERROR_OUT_OF_DEVICE_MEMORY
LogVulkanRHI: Error: Failed to create texture for VR eye buffer"""
        
        print(f"\n🔍 Testing error analysis...")
        result = client.analyze_error(test_error)
        
        if result["success"]:
            print("✅ Analysis successful!")
            print(f"📝 Content preview: {result['content'][:200]}...")
            print(f"📊 Metadata: {result['metadata']}")
            
            # Test fix generation
            print(f"\n🔧 Testing fix generation...")
            fix_result = client.generate_fix(test_error)
            
            if fix_result["success"]:
                print("✅ Fix generation successful!")
                print(f"📝 Fix preview: {fix_result['content'][:200]}...")
            else:
                print(f"❌ Fix generation failed: {fix_result.get('error')}")
        else:
            print(f"❌ Analysis failed: {result.get('error')}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

def test_backend_integration():
    """Test the backend integration"""
    print("\n🌐 Testing Backend Integration")
    print("=" * 50)
    
    try:
        import requests
        
        # Test health endpoint
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Backend health: {health_data['status']}")
            print(f"📊 Services: {health_data['services']}")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return
        
        # Test analysis endpoint
        test_error = """Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048"""
        
        response = requests.post(
            "http://localhost:5000/analyze",
            json={"log_content": test_error, "use_cache": False},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis endpoint working!")
            print(f"🔍 Classification: {result.get('classification', {}).get('error_type', 'unknown')}")
            print(f"📊 Enhanced analysis: {result.get('enhanced_analysis', False)}")
            print(f"📈 Training examples used: {result.get('metrics', {}).get('training_examples_used', 0)}")
        else:
            print(f"❌ Analysis endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running. Start with: python backend/app.py")
    except Exception as e:
        print(f"❌ Backend test failed: {e}")

def main():
    """Run all integration tests"""
    print("🚀 Quest Dev Copilot - Integration Test")
    print("=" * 60)
    
    # Test enhanced client
    test_enhanced_client()
    
    # Test backend integration
    test_backend_integration()
    
    print("\n" + "=" * 60)
    print("🎉 Integration test completed!")

if __name__ == "__main__":
    main() 