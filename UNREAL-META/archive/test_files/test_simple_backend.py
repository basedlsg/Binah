#!/usr/bin/env python3
"""
Simple Backend Test - Tests the backend without import issues
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_backend_direct():
    """Test backend by running it directly"""
    print("🧪 Testing Backend Directly")
    print("=" * 50)
    
    try:
        # Change to backend directory and run
        os.chdir("backend")
        
        # Test if we can import the modules
        sys.path.insert(0, "..")
        
        from llama.enhanced_client import EnhancedLlamaClient
        print("✅ Enhanced client import successful")
        
        # Test the client
        client = EnhancedLlamaClient()
        print("✅ Enhanced client initialization successful")
        
        # Test with sample error
        sample_error = """
        [2024.01.15-10.30.45:123][123]LogVulkanRHI: Error: vkCreateInstance failed with VK_ERROR_INCOMPATIBLE_DRIVER
        """
        
        result = client.analyze_error(sample_error)
        if result["success"]:
            print("✅ Direct backend analysis successful")
            print(f"📊 Training examples used: {result['metadata'].get('examples_used', 0)}")
            return True
        else:
            print(f"❌ Direct analysis failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Direct backend test failed: {e}")
        return False

def test_cli_import():
    """Test CLI import"""
    print("\n🖥️  Testing CLI Import")
    print("=" * 50)
    
    try:
        from cli.quest_fix import quest_fix
        print("✅ CLI import successful")
        print("🖥️  CLI function: quest_fix")
        return True
    except Exception as e:
        print(f"❌ CLI import failed: {e}")
        return False

def main():
    """Run simple tests"""
    print("🚀 Quest Dev Copilot - Simple Integration Test")
    print("=" * 60)
    
    tests = [
        ("Backend Direct", test_backend_direct),
        ("CLI Import", test_cli_import),
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

if __name__ == "__main__":
    main() 