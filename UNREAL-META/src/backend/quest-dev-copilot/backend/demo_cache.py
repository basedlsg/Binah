from typing import Dict, Any, List, Optional

# This cache provides example responses for demo mode.
# The structure aligns with AnalyzeResponse and its sub-models.

DEMO_RESPONSES: Dict[str, Dict[str, Any]] = {
    "plugin_conflict": {
        "request_id": "demo_plugin_conflict_123",
        "classification": {
            "error_type": "plugin_conflict",
            "confidence": 0.95,
            "key_indicators": ["OpenXR initialization failed", "MetaXR already initialized", "Multiple XR plugins"],
            "auto_fixable": True,
            "explanation": "Multiple XR plugins (e.g., OpenXR and MetaXR/OculusXR) are active. Unreal Engine typically supports only one XR plugin for a given platform at a time."
        },
        "fix_suggestion_text": """## Fix: Disable Conflicting XR Plugin

1.  Open your project in Unreal Editor.
2.  Go to **Edit > Plugins**.
3.  Search for the conflicting plugins (e.g., "OpenXR", "MetaXR", "OculusXR").
4.  Disable one of them by unchecking its "Enabled" checkbox. For example, to use MetaXR, disable OpenXR.
5.  Restart the Unreal Editor when prompted.
6.  If issues persist, try deleting the `Intermediate` and `Saved` folders in your project directory and then regenerating project files.
7.  Attempt to package your project again for Quest.""",
        "auto_fix_generated": {
            "action": "toggle_plugin",
            "details": {"plugin_name": "OpenXR", "enabled": False},
            "confidence": 0.90
        },
        "relevant_sources": [
            {"title": "Meta Docs: Common Unreal Issues", "url": "https://developer.oculus.com/documentation/unreal/unreal-common-issues/", "snippet": "Ensure only one XR plugin is active..."},
            {"title": "UE Forums: OpenXR and OculusXR Conflict", "url": "https://forums.unrealengine.com/t/openxr-and-oculusxr-conflict-error/12345", "snippet": "Many users report needing to disable one of the XR plugins..."}
        ],
        "metrics": {
            "retrieval_time_ms": 150.5,
            "classification_time_ms": 800.2,
            "fix_generation_time_ms": 1200.7,
            "total_processing_time_ms": 2151.4,
            "tokens_used_classification": 350,
            "tokens_used_fix_generation": 450,
            "cost_usd_classification": 0.0007,
            "cost_usd_fix_generation": 0.0009
        }
    },
    "sdk_mismatch": {
        "request_id": "demo_sdk_mismatch_456",
        "classification": {
            "error_type": "sdk_mismatch",
            "confidence": 0.92,
            "key_indicators": ["Target SDK 33", "Quest requires SDK 32", "Android SDK version"],
            "auto_fixable": True,
            "explanation": "The project's Target SDK Version is set higher than what is currently recommended or fully supported for Quest development (often SDK 32)."
        },
        "fix_suggestion_text": """## Fix: Adjust Target SDK Version

1.  In Unreal Editor, go to **Edit > Project Settings**.
2.  Navigate to **Platforms > Android SDK** (you might need to scroll down).
3.  Locate "Target SDK Version" (and potentially "SDK API Level" if targeting specific Android versions).
4.  Change the value to `32` (or the recommended version for your UE/Quest OS combination).
5.  Ensure "Minimum SDK Version" is also appropriate (e.g., 29 or higher for recent Quest OS compatibility).
6.  Save and close Project Settings.
7.  It's good practice to delete `Intermediate` and `Saved` folders in your project directory, then regenerate project files (right-click .uproject file > Generate Visual Studio project files).
8.  Attempt to package your project again.""",
        "auto_fix_generated": {
            "action": "update_config",
            "details": {
                "file_path": "Config/DefaultEngine.ini",
                "section": "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]",
                "key": "TargetSDKVersion",
                "value": "32"
            },
            "confidence": 0.85
        },
        "relevant_sources": [
            {"title": "Android SDK and NDK Setup for Unreal", "url": "https://docs.unrealengine.com/en-US/setting-up-android-sdk-and-ndk-for-unreal-engine/index.html", "snippet": "Configure SDK API Level and Target SDK Version under Android SDK settings..."},
            {"title": "Oculus Developer: Target SDK Version for Quest", "url": "https://developer.oculus.com/documentation/native/android/android-manifest/#targetsdkversion", "snippet": "For optimal compatibility and performance on Meta Quest devices, it is crucial to set the targetSdkVersion correctly..."}
        ],
        "metrics": {
            "retrieval_time_ms": 200.0,
            "classification_time_ms": 750.0,
            "fix_generation_time_ms": 1100.0,
            "total_processing_time_ms": 2050.0,
            "tokens_used_classification": 320,
            "tokens_used_fix_generation": 400,
            "cost_usd_classification": 0.00064,
            "cost_usd_fix_generation": 0.0008
        }
    },
    "default_no_fix_example": { 
        "request_id": "demo_default_error_789",
        "classification": {
            "error_type": "shader_compile",
            "confidence": 0.88,
            "key_indicators": ["Shader compilation failed", "Error X3004", "undeclared identifier"],
            "auto_fixable": False,
            "explanation": "A custom shader or material contains an error, such as using a variable or function that hasn\'t been declared or a syntax error in HLSL code."
        },
        "fix_suggestion_text": """## Fix: Debug Shader/Material Error

1.  Identify the problematic shader or material from the log (e.g., `/Engine/Private/MyMaterial.usf`).
2.  Open the material in the Material Editor or the shader file in a text editor.
3.  Look for undeclared identifiers (like 'MyCustomFunction' in the example) or other syntax errors around the line number indicated in the error message.
4.  Ensure all functions and variables are correctly defined and spelled.
5.  If using custom HLSL code, verify its compatibility with the target shader model and platform (e.g., ES3_1_ANDROID for Quest).
6.  After making corrections, recompile shaders (Build > Recompile Shaders for Project) or resave the material.""",
        "auto_fix_generated": None,
        "relevant_sources": [
            {"title": "Debugging Shader Errors in Unreal", "url": "https://docs.unrealengine.com/en-US/optimizing-and-debugging-materials-in-unreal-engine/index.html", "snippet": "Check shader compile errors in the output log. Common issues include syntax errors or using features not supported by the target platform..."}
        ],
        "metrics": {
            "retrieval_time_ms": 180.0,
            "classification_time_ms": 900.0,
            "fix_generation_time_ms": 0.0,
            "total_processing_time_ms": 1080.0,
            "tokens_used_classification": 400,
            "tokens_used_fix_generation": 0,
            "cost_usd_classification": 0.0008,
            "cost_usd_fix_generation": 0.0
        }
    }
} 