#!/usr/bin/env python3
"""
Quest Dev Copilot - Vision-Enhanced Demo
Demonstrates AI-powered debugging with screenshot analysis for Unreal Engine Quest VR development.
"""

import asyncio
import requests
import json
import base64
import time
from pathlib import Path
from typing import Dict, Any, Optional

class QuestCopilotDemo:
    def __init__(self, backend_url: str = "http://localhost:5000"):
        self.backend_url = backend_url
        self.session = requests.Session()
        
    def create_demo_screenshot(self) -> str:
        """Create a base64 encoded demo screenshot for testing."""
        # This would normally be a real screenshot, but for demo we'll use a placeholder
        # 1x1 pixel PNG in base64
        demo_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        return f"data:image/png;base64,{demo_png_base64}"
    
    def test_health(self) -> bool:
        """Test if the backend is healthy."""
        try:
            response = self.session.get(f"{self.backend_url}/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    def analyze_error(self, log_content: str, screenshot_data: Optional[str] = None, 
                     screenshot_description: Optional[str] = None, use_demo: bool = False) -> Dict[str, Any]:
        """Send error analysis request with optional screenshot."""
        payload = {
            "log_content": log_content,
            "ue_version": "5.3",
            "use_demo": use_demo
        }
        
        if screenshot_data:
            payload["screenshot_data"] = screenshot_data
            
        if screenshot_description:
            payload["screenshot_description"] = screenshot_description
            
        try:
            response = self.session.post(
                f"{self.backend_url}/analyze",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def print_analysis_results(self, results: Dict[str, Any]) -> None:
        """Pretty print analysis results."""
        if "error" in results:
            print(f"❌ Error: {results['error']}")
            return
            
        print("\n" + "="*80)
        print("🎯 QUEST DEV COPILOT - ANALYSIS RESULTS")
        print("="*80)
        
        # Classification
        if "classification" in results:
            classification = results["classification"]
            print(f"\n📊 ERROR CLASSIFICATION:")
            print(f"   Type: {classification.get('error_type', 'Unknown').upper()}")
            print(f"   Confidence: {classification.get('confidence', 0) * 100:.1f}%")
            print(f"   Description: {classification.get('description', 'No description')}")
            print(f"   Auto-fixable: {'✅ Yes' if classification.get('auto_fixable', False) else '❌ No'}")
        
        # Visual Analysis
        if "visual_analysis" in results and results["visual_analysis"]:
            print(f"\n👁️ VISUAL ANALYSIS:")
            print(f"   {results['visual_analysis']}")
            
        if "visual_indicators" in results and results["visual_indicators"]:
            print(f"\n🔍 VISUAL INDICATORS DETECTED:")
            for indicator in results["visual_indicators"]:
                print(f"   • {indicator}")
        
        # Fix Suggestion
        if "fix" in results and results["fix"]:
            print(f"\n💡 RECOMMENDED FIX:")
            print(f"   {results['fix']}")
        
        # Auto-fix
        if "auto_fix" in results and results["auto_fix"]:
            auto_fix = results["auto_fix"]
            print(f"\n🔧 AUTO-FIX AVAILABLE:")
            print(f"   Type: {auto_fix.get('fix_type', 'Unknown')}")
            print(f"   Confidence: {auto_fix.get('confidence', 0) * 100:.1f}%")
            if auto_fix.get("instructions"):
                print(f"   Instructions: {auto_fix['instructions']}")
        
        # Sources
        if "sources" in results and results["sources"]:
            print(f"\n📚 RELEVANT SOURCES:")
            for i, source in enumerate(results["sources"], 1):
                print(f"   {i}. {source.get('title', 'Unknown Source')}")
                if source.get('url'):
                    print(f"      URL: {source['url']}")
                if source.get('content_snippet'):
                    print(f"      Snippet: {source['content_snippet'][:100]}...")
        
        print("\n" + "="*80)

def main():
    print("🚀 Quest Dev Copilot - Vision-Enhanced Demo")
    print("============================================")
    
    demo = QuestCopilotDemo()
    
    # Test health
    print("\n1️⃣ Testing backend health...")
    if not demo.test_health():
        print("❌ Backend is not healthy. Please start the backend service.")
        return
    print("✅ Backend is healthy!")
    
    # Demo scenarios
    scenarios = [
        {
            "name": "Plugin Conflict with Screenshot",
            "log": """LogPluginManager: Error: Unable to load plugin 'OculusXR'. Attempt to load a disabled plugin.
LogPluginManager: Error: Plugin 'MetaXR' conflicts with 'OculusXR'
LogAndroidPermission: UAndroidPermission::CheckPermission failed: Permission 'android.permission.CAMERA' was not granted""",
            "screenshot": True,
            "description": "Screenshot showing plugin manager with conflicting VR plugins highlighted in red"
        },
        {
            "name": "Android SDK Mismatch",
            "log": """LogPlayLevel: Error: Unable to package project for Android
LogAndroid: Error: Android SDK version 31 is required, but found version 28
LogPlayLevel: BuildCommand.Execute: ERROR: AutomationTool terminated with exception: Android build failed""",
            "screenshot": False,
            "description": None
        },
        {
            "name": "Quest Black Screen Issue with Visual Evidence",
            "log": """LogHMD: Warning: OpenXR instance creation failed
LogQuest: Error: Failed to initialize Quest headset
LogRenderer: Error: VR compositor initialization failed
LogCore: Error: Assertion failed: VRSystem != nullptr""",
            "screenshot": True,
            "description": "Black screen in VR preview window, error dialogs visible in editor"
        }
    ]
    
    for i, scenario in enumerate(scenarios, 2):
        print(f"\n{i}️⃣ Demo Scenario: {scenario['name']}")
        print("-" * 50)
        
        screenshot_data = None
        if scenario['screenshot']:
            screenshot_data = demo.create_demo_screenshot()
            print("📸 Screenshot captured for analysis")
        
        print("🔄 Analyzing error with AI...")
        start_time = time.time()
        
        results = demo.analyze_error(
            log_content=scenario['log'],
            screenshot_data=screenshot_data,
            screenshot_description=scenario['description'],
            use_demo=True  # Use demo mode for consistent results
        )
        
        analysis_time = time.time() - start_time
        print(f"⏱️ Analysis completed in {analysis_time:.2f} seconds")
        
        demo.print_analysis_results(results)
        
        # Pause between scenarios
        if i < len(scenarios) + 1:
            input("\nPress Enter to continue to next scenario...")
    
    print("\n🎉 Demo completed! Key features demonstrated:")
    print("   ✅ AI-powered error classification using Llama models")
    print("   ✅ RAG-enhanced context from forum discussions") 
    print("   ✅ Screenshot analysis with Gemini Vision")
    print("   ✅ Structured auto-fix generation")
    print("   ✅ Multi-modal analysis (text + visual)")
    print("   ✅ Real-time processing with cost tracking")
    
    print("\n📊 System Architecture:")
    print("   • Frontend: Unreal Engine C++ Plugin (Slate UI)")
    print("   • Backend: Flask + asyncio (Python)")
    print("   • AI Models: Llama-4-Scout (classification) + Llama-4-Maverick (fixes)")
    print("   • Vision: Gemini-1.5-Flash for screenshot analysis")
    print("   • RAG: ChromaDB + OpenAI embeddings")
    print("   • Data: Scraped forum discussions (Epic Games, Meta)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed: {e}") 