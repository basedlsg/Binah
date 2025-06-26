"""
Test fixtures and sample data for Quest Dev Copilot tests.
Provides realistic error logs, API responses, and test data.
"""

import json
from typing import Dict, List, Any


class SampleErrorLogs:
    """Sample error logs for different error types."""

    PLUGIN_CONFLICT = """
LogTemp: Error: Plugin 'OculusVR' failed to load because module 'OculusHMD' could not be found.
LogTemp: Error: Please ensure that this module exists and is properly built.
LogTemp: Error: Module 'OculusHMD' not found in: C:\\Program Files\\Epic Games\\UE_5.3\\Engine\\Plugins\\Runtime\\Oculus\\OculusVR\\Binaries\\Win64\\
LogTemp: Error: Failed to load plugin: OculusVR
LogPackageName: Error: DoesPackageExist: DoesPackageExist FAILED: '/Script/OculusHMD' is not mounted
LogUObjectGlobals: Warning: Failed to load '/Script/OculusHMD': Can't find file.
LogModuleManager: Warning: ModuleManager: Unable to load module 'OculusHMD' because the file 'C:\\Program Files\\Epic Games\\UE_5.3\\Engine\\Binaries\\Win64\\UnrealEditor-OculusHMD.dll' was not found.
"""

    SDK_MISMATCH = """
LogAndroid: Error: Android SDK not found. Please install Android SDK and set ANDROID_HOME environment variable.
LogAndroid: Error: ANDROID_HOME is not set or points to invalid SDK location: C:\\Users\\Dev\\AppData\\Local\\Android\\Sdk
LogAndroid: Error: Required SDK components not found:
LogAndroid: Error:   - Android SDK Platform 33 (android-33)
LogAndroid: Error:   - Android SDK Build-Tools 33.0.1
LogAndroid: Error:   - Android NDK (Side by side) 21.4.7075529
LogAndroid: Error: Please install missing components using Android Studio SDK Manager
"""

    BLACK_SCREEN = """
LogRenderer: Error: Failed to create swap chain for window
LogD3D11RHI: Error: D3D11 device creation failed with error: DXGI_ERROR_UNSUPPORTED (0x887A0001)
LogD3D11RHI: Error: Available feature levels: D3D_FEATURE_LEVEL_11_1, D3D_FEATURE_LEVEL_11_0
LogD3D11RHI: Error: Requested feature level: D3D_FEATURE_LEVEL_11_1
LogRHI: Error: Failed to initialize D3D11 RHI
LogRenderer: Error: Rendering device failed to initialize
LogEngine: Error: Failed to initialize rendering subsystem
"""

    PACKAGING_ERROR = """
LogUBT: Error: C:\\Program Files\\Epic Games\\UE_5.3\\Engine\\Source\\Programs\\UnrealBuildTool\\Platform\\Android\\AndroidToolChain.cs(1234,56): error: Android NDK not found
LogUBT: Error: Expected NDK path: C:\\Users\\Dev\\AppData\\Local\\Android\\Sdk\\ndk\\21.4.7075529
LogUBT: Error: Please install Android NDK via Android Studio or set NDKROOT environment variable
LogCook: Error: Cook failed for platform Android
LogPackagingResults: Error: Package failed - cook failed
LogPackagingResults: Error: Took 45.67s to run UnrealBuildTool.exe, ExitCode=1
"""

    SHADER_COMPILE = """
LogShaderCompilers: Error: Failed to compile shader for platform SF_VULKAN_ES3_1_ANDROID
LogShaderCompilers: Error: Shader compilation errors:
LogShaderCompilers: Error: /Engine/Generated/Material.ush(123): error X3004: undeclared identifier 'CustomExpression0'
LogShaderCompilers: Error: /Engine/Generated/Material.ush(124): error X3004: undeclared identifier 'MaterialFloat3'
LogShaderCompilers: Error: Shader compilation failed for material: /Game/Materials/M_QuestUI.M_QuestUI
LogMaterial: Error: Failed to compile material /Game/Materials/M_QuestUI for platform Android
"""


class SampleAPIResponses:
    """Sample API responses for different scenarios."""

    @staticmethod
    def plugin_conflict_response() -> Dict[str, Any]:
        """Sample response for plugin conflict error."""
        return {
            "classification": {
                "error_type": "plugin_conflict",
                "confidence": 0.95,
                "description": "OculusVR plugin conflict detected - module 'OculusHMD' could not be found",
                "auto_fixable": True,
                "key_indicators": [
                    "Plugin 'OculusVR' failed to load",
                    "module 'OculusHMD' could not be found",
                    "ModuleManager: Unable to load module 'OculusHMD'"
                ]
            },
            "fix": "The OculusVR plugin is missing the required OculusHMD module. This typically happens when the Oculus SDK is not properly installed or when there's a version mismatch between the plugin and SDK. Update your Oculus SDK installation and ensure plugin compatibility.",
            "auto_fix": {
                "fix_type": "config_change",
                "confidence": 0.88,
                "instructions": "Disable the problematic OculusVR plugin and enable the MetaXR plugin instead for Quest development",
                "file_changes": [
                    {
                        "file_path": "Config/DefaultEngine.ini",
                        "changes": [
                            {
                                "action": "modify",
                                "section": "[/Script/Engine.Engine]",
                                "key": "+ActiveClassRedirects=(OldClassName=\"OculusHMD\",NewClassName=\"MetaXRHMD\")",
                                "value": ""
                            }
                        ]
                    },
                    {
                        "file_path": "MyProject.uproject",
                        "changes": [
                            {
                                "action": "modify",
                                "section": "Plugins",
                                "key": "OculusVR",
                                "value": '{"Name": "OculusVR", "Enabled": false}'
                            },
                            {
                                "action": "add",
                                "section": "Plugins",
                                "key": "MetaXR",
                                "value": '{"Name": "MetaXR", "Enabled": true}'
                            }
                        ]
                    }
                ]
            },
            "sources": [
                {
                    "content": "Similar issue resolved by switching from OculusVR to MetaXR plugin. The OculusVR plugin is deprecated for Quest development.",
                    "source": "epic_games_forum",
                    "url": "https://forums.unrealengine.com/t/oculusvr-plugin-deprecated-use-metaxr/12345",
                    "confidence": 0.92
                },
                {
                    "content": "OculusHMD module loading errors are common when using outdated VR plugins. Update to latest Meta XR SDK.",
                    "source": "meta_developer_forum",
                    "url": "https://developer.oculus.com/forums/thread/67890",
                    "confidence": 0.87
                }
            ],
            "metrics": {
                "processing_time_ms": 1250,
                "tokens_used": 180,
                "cost_usd": 0.0036
            }
        }

    @staticmethod
    def sdk_mismatch_response() -> Dict[str, Any]:
        """Sample response for SDK mismatch error."""
        return {
            "classification": {
                "error_type": "sdk_mismatch",
                "confidence": 0.92,
                "description": "Android SDK configuration issues - missing required components for Quest development",
                "auto_fixable": False,
                "key_indicators": [
                    "Android SDK not found",
                    "ANDROID_HOME is not set",
                    "Required SDK components not found"
                ]
            },
            "fix": "Install the required Android SDK components using Android Studio SDK Manager. Ensure ANDROID_HOME environment variable points to valid SDK location. Required components: Android SDK Platform 33, Build-Tools 33.0.1, NDK 21.4.7075529.",
            "auto_fix": None,
            "sources": [
                {
                    "content": "Complete guide to setting up Android SDK for Quest development in Unreal Engine",
                    "source": "unreal_documentation",
                    "url": "https://docs.unrealengine.com/5.3/android-quick-start",
                    "confidence": 0.95
                }
            ],
            "metrics": {
                "processing_time_ms": 980,
                "tokens_used": 145,
                "cost_usd": 0.0029
            }
        }

    @staticmethod
    def unknown_error_response() -> Dict[str, Any]:
        """Sample response for unknown/unclassified error."""
        return {
            "classification": {
                "error_type": "unknown",
                "confidence": 0.65,
                "description": "Unable to classify this error with high confidence",
                "auto_fixable": False,
                "key_indicators": []
            },
            "fix": "This error could not be automatically classified. Please review the error log manually and consult the Unreal Engine documentation or community forums for assistance.",
            "auto_fix": None,
            "sources": [],
            "metrics": {
                "processing_time_ms": 750,
                "tokens_used": 95,
                "cost_usd": 0.0019
            }
        }


class SampleContextData:
    """Sample context data for testing."""

    BASIC_CONTEXT = {
        "project_name": "MyVRProject",
        "unreal_version": "5.3",
        "platform": "Windows"
    }

    FULL_CONTEXT = {
        "project_name": "QuestAdventure",
        "unreal_version": "5.3.2",
        "platform": "Windows",
        "build_configuration": "Development",
        "target_platform": "Quest2",
        "plugins": [
            "OculusVR",
            "MetaXR", 
            "AndroidPermission",
            "AndroidDeviceProfileSelector",
            "AndroidMedia"
        ],
        "additional_info": "Build fails during packaging for Quest 2 deployment"
    }

    MINIMAL_CONTEXT = {
        "project_name": "TestProject"
    }


class SampleVectorData:
    """Sample vector store data for testing."""

    @staticmethod
    def sample_documents() -> List[Dict[str, Any]]:
        """Sample documents for vector store testing."""
        return [
            {
                "id": "epic_forum_001",
                "content": "To fix OculusVR plugin loading errors, switch to the MetaXR plugin which is the recommended solution for Quest development. Disable OculusVR in your project settings and enable MetaXR instead.",
                "embedding": [0.1, 0.2, 0.3] * 128,  # 384-dimensional mock embedding
                "metadata": {
                    "source": "epic_games_forum",
                    "topic": "plugin_conflict",
                    "confidence": 0.95,
                    "url": "https://forums.unrealengine.com/example1",
                    "date": "2024-01-15"
                }
            },
            {
                "id": "meta_forum_002", 
                "content": "Android SDK setup for Quest development requires specific versions. Install Android SDK Platform 33, Build-Tools 33.0.1, and NDK 21.4.7075529. Set ANDROID_HOME environment variable correctly.",
                "embedding": [0.4, 0.5, 0.6] * 128,
                "metadata": {
                    "source": "meta_developer_forum",
                    "topic": "sdk_mismatch",
                    "confidence": 0.92,
                    "url": "https://developer.oculus.com/example2",
                    "date": "2024-01-10"
                }
            },
            {
                "id": "unreal_docs_003",
                "content": "Shader compilation errors on Android can be resolved by updating material nodes and ensuring compatibility with mobile rendering. Check material complexity and use mobile-friendly nodes.",
                "embedding": [0.7, 0.8, 0.9] * 128,
                "metadata": {
                    "source": "unreal_documentation",
                    "topic": "shader_compile",
                    "confidence": 0.88,
                    "url": "https://docs.unrealengine.com/example3",
                    "date": "2024-01-05"
                }
            }
        ]

    @staticmethod
    def sample_embeddings() -> List[List[float]]:
        """Sample embeddings for testing."""
        return [
            [0.1] * 384,  # Plugin conflict embedding
            [0.2] * 384,  # SDK mismatch embedding  
            [0.3] * 384,  # Shader compile embedding
            [0.4] * 384,  # Generic error embedding
        ]


class MockAPIResponses:
    """Mock API responses for external services."""

    @staticmethod
    def llama_classify_response() -> Dict[str, Any]:
        """Mock Llama API response for classification."""
        return {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "error_type": "plugin_conflict",
                        "confidence": 0.95,
                        "description": "Plugin loading failure detected",
                        "auto_fixable": True,
                        "key_indicators": ["Plugin failed to load", "Module not found"]
                    })
                }
            }],
            "usage": {
                "total_tokens": 150,
                "prompt_tokens": 100,
                "completion_tokens": 50
            },
            "model": "Llama-4-Scout-17B-16E-Instruct-FP8"
        }

    @staticmethod
    def llama_fix_response() -> Dict[str, Any]:
        """Mock Llama API response for fix generation."""
        return {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "fix_type": "config_change",
                        "confidence": 0.88,
                        "instructions": "Update plugin configuration",
                        "file_changes": []
                    })
                }
            }],
            "usage": {
                "total_tokens": 200,
                "prompt_tokens": 120,
                "completion_tokens": 80
            },
            "model": "Llama-4-Maverick-17B-128E-Instruct-FP8"
        }

    @staticmethod
    def gemini_embedding_response() -> Dict[str, Any]:
        """Mock Gemini API response for embeddings."""
        return {
            "embedding": [0.1, 0.2, 0.3] * 128  # 384-dimensional embedding
        }


class TestDataGenerator:
    """Utility class for generating test data."""

    @staticmethod
    def generate_error_log(error_type: str, length: int = 10) -> str:
        """Generate a synthetic error log of specified type and length."""
        base_logs = {
            "plugin_conflict": "LogTemp: Error: Plugin loading failed",
            "sdk_mismatch": "LogAndroid: Error: SDK component missing",
            "black_screen": "LogRenderer: Error: Rendering failed",
            "packaging_error": "LogUBT: Error: Build failed",
            "shader_compile": "LogShaderCompilers: Error: Compilation failed"
        }
        
        base_log = base_logs.get(error_type, "LogTemp: Error: Unknown error")
        return "\n".join([f"{base_log} #{i}" for i in range(length)])

    @staticmethod
    def generate_embeddings(count: int, dimension: int = 384) -> List[List[float]]:
        """Generate random embeddings for testing."""
        import random
        return [
            [random.random() for _ in range(dimension)]
            for _ in range(count)
        ]

    @staticmethod
    def generate_documents(count: int) -> List[Dict[str, Any]]:
        """Generate sample documents for testing."""
        sources = ["epic_games_forum", "meta_developer_forum", "unreal_documentation"]
        topics = ["plugin_conflict", "sdk_mismatch", "shader_compile", "packaging_error"]
        
        documents = []
        for i in range(count):
            documents.append({
                "id": f"doc_{i:03d}",
                "content": f"Sample solution content for document {i}",
                "embedding": [0.1 * i] * 384,
                "metadata": {
                    "source": sources[i % len(sources)],
                    "topic": topics[i % len(topics)],
                    "confidence": 0.8 + (0.2 * (i % 5) / 4),  # 0.8 to 1.0
                    "url": f"https://example.com/doc{i}",
                    "date": f"2024-01-{(i % 30) + 1:02d}"
                }
            })
        
        return documents 