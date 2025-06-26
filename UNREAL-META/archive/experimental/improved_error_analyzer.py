"""
Improved Error Analyzer - Fixes issues identified in comprehensive testing
"""

import re
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path
import structlog
from datetime import datetime

logger = structlog.get_logger(__name__)

class ImprovedErrorAnalyzer:
    """
    Improved error analyzer with better pattern matching and classification logic
    """
    
    def __init__(self):
        self.error_patterns = self._load_improved_error_patterns()
        logger.info("ImprovedErrorAnalyzer initialized with enhanced patterns")
    
    def _load_improved_error_patterns(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load improved error patterns with better coverage and confidence scoring"""
        return {
            "black_screen": [
                {
                    "pattern": r"Failed to allocate VR eye buffer",
                    "indicators": ["VR eye buffer", "allocation failed", "LogVulkanRHI"],
                    "severity": "critical",
                    "confidence": 1.0
                },
                {
                    "pattern": r"vkCreateRenderPass failed.*VK_ERROR_OUT_OF_DEVICE_MEMORY",
                    "indicators": ["vulkan", "device memory", "render pass"],
                    "severity": "critical", 
                    "confidence": 0.9
                },
                {
                    "pattern": r"VK_ERROR_OUT_OF_DEVICE_MEMORY",
                    "indicators": ["vulkan", "out of memory", "device"],
                    "severity": "critical",
                    "confidence": 0.85
                },
                {
                    "pattern": r"Unable to create eye render targets",
                    "indicators": ["eye render targets", "VR", "allocation"],
                    "severity": "critical",
                    "confidence": 0.9
                },
                {
                    "pattern": r"Quest shows 3 dots loading indefinitely",
                    "indicators": ["3 dots loading", "black screen", "Quest display"],
                    "severity": "medium",
                    "confidence": 0.85
                }
            ],
            "packaging_error": [
                {
                    "pattern": r"BUILD FAILED.*Task.*packageDebug FAILED",
                    "indicators": ["BUILD FAILED", "packageDebug", "Task"],
                    "severity": "critical",
                    "confidence": 0.95
                },
                {
                    "pattern": r"UATHelper.*Packaging.*BUILD FAILED",
                    "indicators": ["UATHelper", "Packaging", "BUILD FAILED"],
                    "severity": "critical",
                    "confidence": 0.9
                },
                {
                    "pattern": r"Failed to sign APK.*jarsigner error",
                    "indicators": ["sign APK", "jarsigner", "error"],
                    "severity": "critical",
                    "confidence": 0.9
                },
                {
                    "pattern": r"gradle.*assembleDebug.*failed",
                    "indicators": ["gradle", "assembleDebug", "failed"],
                    "severity": "critical",
                    "confidence": 0.85
                },
                {
                    "pattern": r"CommandUtils\.Run: ERROR.*gradle",
                    "indicators": ["CommandUtils", "gradle", "ERROR"],
                    "severity": "high",
                    "confidence": 0.8
                }
            ],
            "plugin_conflict": [
                {
                    "pattern": r"Multiple XR plugins detected.*may cause conflicts",
                    "indicators": ["Multiple XR plugins", "conflicts", "OpenXR", "OculusXR"],
                    "severity": "critical",
                    "confidence": 1.0
                },
                {
                    "pattern": r"Plugin.*failed to load because module.*could not be found",
                    "indicators": ["Plugin", "failed to load", "module", "not found"],
                    "severity": "critical",
                    "confidence": 0.85
                },
                {
                    "pattern": r"MetaXR.*failed to load.*OculusXRHMD",
                    "indicators": ["MetaXR", "failed to load", "OculusXRHMD"],
                    "severity": "critical",
                    "confidence": 0.9
                }
            ],
            "sdk_mismatch": [
                {
                    "pattern": r"OpenXR runtime version.*incompatible with plugin version",
                    "indicators": ["OpenXR", "runtime version", "incompatible", "plugin version"],
                    "severity": "critical",
                    "confidence": 0.95
                },
                {
                    "pattern": r"Target SDK version 33 is not supported",
                    "indicators": ["Target SDK version", "33", "not supported"],
                    "severity": "critical",
                    "confidence": 0.9
                },
                {
                    "pattern": r"Quest requires Target SDK version 32",
                    "indicators": ["Quest", "Target SDK", "version 32"],
                    "severity": "high",
                    "confidence": 0.9
                }
            ],
            "shader_compile": [
                {
                    "pattern": r"Failed to compile shader.*Android_VULKAN.*Syntax error",
                    "indicators": ["compile shader", "Android_VULKAN", "Syntax error"],
                    "severity": "high",
                    "confidence": 0.9
                },
                {
                    "pattern": r"HLSL compilation failed.*undeclared identifier",
                    "indicators": ["HLSL compilation", "failed", "undeclared identifier"],
                    "severity": "high",
                    "confidence": 0.9
                },
                {
                    "pattern": r"LogShaderCompilers.*Error.*Failed to compile shader",
                    "indicators": ["LogShaderCompilers", "Error", "compile shader"],
                    "severity": "high",
                    "confidence": 0.8
                },
                {
                    "pattern": r"LogD3D11ShaderCompiler.*Error.*HLSL",
                    "indicators": ["LogD3D11ShaderCompiler", "HLSL", "Error"],
                    "severity": "high",
                    "confidence": 0.8
                }
            ],
            "vr": [
                {
                    "pattern": r"xrCreateSession failed.*XR_ERROR_GRAPHICS_DEVICE_INVALID",
                    "indicators": ["xrCreateSession", "XR_ERROR_GRAPHICS_DEVICE_INVALID"],
                    "severity": "critical",
                    "confidence": 0.9
                },
                {
                    "pattern": r"Failed to initialize Oculus Link connection",
                    "indicators": ["Oculus Link", "connection", "failed"],
                    "severity": "high",
                    "confidence": 0.8
                },
                {
                    "pattern": r"Hand tracking initialization failed",
                    "indicators": ["Hand tracking", "initialization", "failed"],
                    "severity": "medium",
                    "confidence": 0.7
                },
                {
                    "pattern": r"Guardian system boundary setup failed",
                    "indicators": ["Guardian system", "boundary", "failed"],
                    "severity": "medium",
                    "confidence": 0.7
                }
            ]
        }
    
    def analyze_error_log(self, log_content: str) -> Dict[str, Any]:
        """
        Improved error analysis with better pattern matching
        """
        logger.info("Starting improved error analysis", content_length=len(log_content))
        
        # Enhanced multi-error detection with lower threshold
        detected_errors = self._detect_multiple_errors_improved(log_content)
        
        if not detected_errors:
            return self._analyze_unknown_error_improved(log_content)
        
        # Return the highest confidence error
        primary_error = detected_errors[0]
        
        # Extract context
        context_info = self._extract_error_context_improved(log_content, primary_error['error_type'])
        
        result = {
            "error_type": primary_error['error_type'],
            "confidence": primary_error['confidence'],
            "severity": primary_error['severity'],
            "description": primary_error.get('description', f"{primary_error['error_type'].replace('_', ' ').title()} detected"),
            "indicators_found": primary_error['indicators'],
            "context": context_info,
            "analysis_metadata": {
                "total_errors_detected": len(detected_errors),
                "log_length": len(log_content),
                "analysis_timestamp": datetime.now().isoformat(),
                "analyzer_version": "3.0_improved"
            }
        }
        
        logger.info("Improved error analysis completed", 
                   error_type=primary_error['error_type'],
                   confidence=primary_error['confidence'])
        
        return result
    
    def _detect_multiple_errors_improved(self, log_content: str) -> List[Dict[str, Any]]:
        """
        Improved multi-error detection with better confidence scoring
        """
        detected_errors = []
        log_content_lower = log_content.lower()
        
        # Lower severity weights for more balanced scoring
        severity_weights = {
            "critical": 1.2,
            "high": 1.1,
            "medium": 1.0,
            "low": 0.9
        }
        
        for error_type, patterns in self.error_patterns.items():
            best_match = None
            max_confidence = 0.0
            matched_indicators = []
            
            for pattern_info in patterns:
                pattern = pattern_info['pattern']
                indicators = pattern_info['indicators']
                base_confidence = pattern_info['confidence']
                severity = pattern_info['severity']
                
                # Check pattern match
                if re.search(pattern, log_content, re.IGNORECASE):
                    # Count indicator matches for confidence boost
                    indicator_matches = [ind for ind in indicators if ind.lower() in log_content_lower]
                    
                    # Calculate enhanced confidence with smaller boost
                    indicator_boost = (len(indicator_matches) / len(indicators)) * 0.05
                    confidence = min(base_confidence + indicator_boost, 1.0)
                    
                    if confidence > max_confidence:
                        max_confidence = confidence
                        matched_indicators = indicator_matches
                        best_match = {
                            "error_type": error_type,
                            "confidence": confidence,
                            "severity": severity,
                            "severity_weight": severity_weights.get(severity, 1.0),
                            "indicators": matched_indicators,
                            "pattern_matched": pattern,
                            "description": f"{error_type.replace('_', ' ').title()} detected"
                        }
            
            # Lower threshold for inclusion (0.5 instead of 0.7)
            if best_match and max_confidence > 0.5:
                detected_errors.append(best_match)
        
        # Sort by confidence * severity weight
        detected_errors.sort(key=lambda x: x['confidence'] * x['severity_weight'], reverse=True)
        
        return detected_errors
    
    def _analyze_unknown_error_improved(self, log_content: str) -> Dict[str, Any]:
        """Improved unknown error analysis with better keyword mapping"""
        
        # More specific error keywords with proper mapping to expected types
        error_keywords = {
            "packaging_error": ["packaging", "build failed", "gradle", "apk", "jarsigner", "assembleDebug"],
            "shader_compile": ["shader", "compile", "hlsl", "compilation failed", "syntax error"],
            "black_screen": ["vulkan", "render", "memory", "allocation", "eye buffer", "vk_error"],
            "plugin_conflict": ["plugin", "failed to load", "module", "could not be found"],
            "vr": ["xr", "openxr", "metaxr", "oculus", "quest", "headset", "vr"],
            "android": ["android", "sdk", "ndk", "target sdk"]
        }
        
        log_lower = log_content.lower()
        category_scores = {}
        
        for category, keywords in error_keywords.items():
            score = sum(1 for keyword in keywords if keyword in log_lower)
            if score > 0:
                category_scores[category] = score
        
        if category_scores:
            likely_category = max(category_scores, key=category_scores.get)
            # Higher confidence for keyword matches
            confidence = min(0.8, category_scores[likely_category] * 0.15)
        else:
            likely_category = "unknown"
            confidence = 0.3
        
        return {
            "error_type": likely_category,
            "confidence": confidence,
            "severity": "medium",
            "indicators_found": [],
            "context": self._extract_error_context_improved(log_content, likely_category),
            "analysis_method": "improved_keyword_analysis",
            "recommendation": "Pattern-based analysis with improved keyword matching"
        }
    
    def _extract_error_context_improved(self, log_content: str, error_type: str) -> Dict[str, Any]:
        """
        Improved context extraction
        """
        lines = log_content.split('\n')
        context_lines = []
        error_lines = []
        warning_lines = []
        
        # Extract different types of log lines
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if 'error' in line_lower:
                error_lines.append({"line_num": i+1, "content": line.strip()})
            elif 'warning' in line_lower:
                warning_lines.append({"line_num": i+1, "content": line.strip()})
            
            # Add all non-empty lines as context
            if line.strip():
                context_lines.append({"line_num": i+1, "content": line.strip()})
        
        # Calculate log structure statistics
        total_lines = len(lines)
        non_empty_lines = len([l for l in lines if l.strip()])
        error_percentage = (len(error_lines) / max(non_empty_lines, 1)) * 100
        
        return {
            "error_lines": error_lines,
            "warning_lines": warning_lines,
            "context_lines": context_lines[:10],  # Limit context
            "total_errors": len(error_lines),
            "total_warnings": len(warning_lines),
            "log_structure": {
                "total_lines": total_lines,
                "non_empty_lines": non_empty_lines,
                "error_percentage": error_percentage
            }
        }

# Test function to compare with original analyzer
async def test_improved_analyzer():
    """Test the improved analyzer against the comprehensive test cases"""
    
    # Add the quest-dev-copilot directory to Python path
    import sys
    from pathlib import Path
    project_root = Path(__file__).parent
    quest_copilot_dir = project_root / "quest-dev-copilot"
    sys.path.insert(0, str(quest_copilot_dir))
    
    from backend.real_error_analyzer import RealErrorAnalyzer
    
    # Test cases from comprehensive test
    test_cases = [
        ("VR Eye Buffer", "LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048", "black_screen"),
        ("Vulkan Memory", "LogVulkanRHI: Error: vkCreateRenderPass failed, VkResult=VK_ERROR_OUT_OF_DEVICE_MEMORY", "black_screen"),
        ("Android Packaging", "UATHelper: Packaging (Android): BUILD FAILED: Task :app:packageDebug FAILED", "packaging_error"),
        ("Gradle Build", "LogPlayLevel: CommandUtils.Run: ERROR: cmd.exe failed with args /c \"C:\\Android\\gradle\\bin\\gradle.bat\" assembleDebug --stacktrace", "packaging_error"),
        ("Plugin Conflict", "LogPluginManager: Error: Plugin 'MetaXR' failed to load because module 'OculusXRHMD' could not be found", "plugin_conflict"),
        ("Shader Compile", "LogShaderCompilers: Error: Failed to compile shader for platform Android_VULKAN: Syntax error at line 45", "shader_compile"),
    ]
    
    original_analyzer = RealErrorAnalyzer()
    improved_analyzer = ImprovedErrorAnalyzer()
    
    print("COMPARISON: Original vs Improved Analyzer")
    print("=" * 80)
    
    for test_name, log_content, expected in test_cases:
        print(f"\nTest: {test_name}")
        print(f"Expected: {expected}")
        print("-" * 40)
        
        # Original analyzer
        orig_result = original_analyzer.analyze_error_log(log_content)
        orig_type = orig_result.get('error_type', 'unknown')
        orig_conf = orig_result.get('confidence', 0)
        
        # Improved analyzer  
        improved_result = improved_analyzer.analyze_error_log(log_content)
        improved_type = improved_result.get('error_type', 'unknown')
        improved_conf = improved_result.get('confidence', 0)
        
        # Results
        orig_correct = "✅" if orig_type == expected else "❌"
        improved_correct = "✅" if improved_type == expected else "❌"
        
        print(f"Original:  {orig_correct} {orig_type} (conf: {orig_conf:.2f})")
        print(f"Improved:  {improved_correct} {improved_type} (conf: {improved_conf:.2f})")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_improved_analyzer()) 