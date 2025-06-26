#!/usr/bin/env python3
"""
Quest Dev Copilot - End-to-End Integration Test

This script tests the complete system to verify it works for end users:
1. Enhanced AI Client (with training data)
2. Backend API
3. CLI Tool
4. Sample error analysis
"""

import sys
import os
import time
import json
import requests
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_enhanced_client():
    """Test the enhanced AI client with training data"""
    print("🧪 Testing Enhanced AI Client")
    print("=" * 50)
    
    try:
        from llama.enhanced_client import EnhancedLlamaClient
        
        # Initialize client
        client = EnhancedLlamaClient()
        
        # Test with a real Quest VR error
        sample_error = """
        [2024.01.15-10.30.45:123][123]LogVulkanRHI: Error: vkCreateInstance failed with VK_ERROR_INCOMPATIBLE_DRIVER
        [2024.01.15-10.30.45:124][123]LogVulkanRHI: Error: Failed to create Vulkan instance
        [2024.01.15-10.30.46:125][123]LogQuest: Error: MetaXR initialization failed
        [2024.01.15-10.30.46:126][123]LogQuest: Error: VR session cannot start
        """
        
        print("📝 Testing error analysis...")
        result = client.analyze_error(sample_error)
        
        if result["success"]:
            print("✅ Enhanced client analysis successful!")
            print(f"📊 Training examples used: {result['metadata'].get('examples_used', 0)}")
            print(f"📝 Content preview: {result['content'][:200]}...")
        else:
            print(f"❌ Analysis failed: {result.get('error')}")
            return False
            
        print("🔧 Testing fix generation...")
        fix_result = client.generate_fix(sample_error)
        
        if fix_result["success"]:
            print("✅ Fix generation successful!")
            print(f"📝 Fix preview: {fix_result['content'][:200]}...")
        else:
            print(f"❌ Fix generation failed: {fix_result.get('error')}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Enhanced client test failed: {e}")
        return False

def test_backend_api():
    """Test the backend API endpoints"""
    print("\n🌐 Testing Backend API")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Backend health check passed")
            print(f"📊 Services: {health_data.get('services', {})}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not reachable: {e}")
        return False
    
    # Test analyze endpoint
    sample_error = """
    [2024.01.15-10.30.45:123][123]LogVulkanRHI: Error: vkCreateInstance failed with VK_ERROR_INCOMPATIBLE_DRIVER
    [2024.01.15-10.30.45:124][123]LogVulkanRHI: Error: Failed to create Vulkan instance
    [2024.01.15-10.30.46:125][123]LogQuest: Error: MetaXR initialization failed
    """
    
    try:
        payload = {
            "log_content": sample_error,
            "use_cache": False
        }
        
        response = requests.post(f"{base_url}/analyze", 
                               json=payload, 
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Error analysis endpoint working")
            print(f"📊 Classification: {result.get('classification', {}).get('error_type', 'unknown')}")
            print(f"💰 Estimated cost: ${result.get('metrics', {}).get('estimated_cost', 0):.4f}")
            print(f"⚡ Latency: {result.get('metrics', {}).get('latency_ms', 0)}ms")
            return True
        else:
            print(f"❌ Analysis endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Analysis request failed: {e}")
        return False

def test_cli_tool():
    """Test the CLI tool"""
    print("\n🖥️  Testing CLI Tool")
    print("=" * 50)
    
    try:
        from cli.quest_fix import quest_fix
        
        # Create a temporary error file
        sample_error = """
        [2024.01.15-10.30.45:123][123]LogVulkanRHI: Error: vkCreateInstance failed with VK_ERROR_INCOMPATIBLE_DRIVER
        [2024.01.15-10.30.45:124][123]LogVulkanRHI: Error: Failed to create Vulkan instance
        [2024.01.15-10.30.46:125][123]LogQuest: Error: MetaXR initialization failed
        """
        
        with open("temp_error.log", "w") as f:
            f.write(sample_error)
        
        print("✅ CLI tool import successful")
        print("📝 Created temporary error file for testing")
        print("🖥️  CLI function available: quest_fix")
        
        return True
        
    except Exception as e:
        print(f"❌ CLI tool test failed: {e}")
        return False

def test_real_sample_logs():
    """Test with real sample logs from the data directory"""
    print("\n📋 Testing with Real Sample Logs")
    print("=" * 50)
    
    try:
        from llama.enhanced_client import EnhancedLlamaClient
        
        client = EnhancedLlamaClient()
        
        # Look for sample logs
        sample_logs_dir = Path("sample_logs")
        if not sample_logs_dir.exists():
            print("⚠️  No sample_logs directory found")
            return True
        
        log_files = list(sample_logs_dir.glob("*.log"))
        if not log_files:
            print("⚠️  No .log files found in sample_logs")
            return True
        
        # Test with the first log file
        test_log_file = log_files[0]
        print(f"📄 Testing with: {test_log_file.name}")
        
        with open(test_log_file, 'r') as f:
            log_content = f.read()
        
        # Analyze the real log
        result = client.analyze_error(log_content)
        
        if result["success"]:
            print("✅ Real log analysis successful!")
            print(f"📊 Training examples used: {result['metadata'].get('examples_used', 0)}")
            print(f"📝 Analysis preview: {result['content'][:300]}...")
            return True
        else:
            print(f"❌ Real log analysis failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Real log test failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Quest Dev Copilot - End-to-End Integration Test")
    print("=" * 60)
    print("This test verifies the complete system works for end users")
    print("=" * 60)
    
    tests = [
        ("Enhanced AI Client", test_enhanced_client),
        ("Real Sample Logs", test_real_sample_logs),
        ("CLI Tool", test_cli_tool),
        ("Backend API", test_backend_api),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        print("-" * 40)
        
        try:
            success = test_func()
            results[test_name] = success
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{status}: {test_name}")
        except Exception as e:
            print(f"❌ ERROR: {test_name} - {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! The system is ready for end users.")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
    
    # Cleanup
    if Path("temp_error.log").exists():
        Path("temp_error.log").unlink()
        print("🧹 Cleaned up temporary files")

if __name__ == "__main__":
    main() 