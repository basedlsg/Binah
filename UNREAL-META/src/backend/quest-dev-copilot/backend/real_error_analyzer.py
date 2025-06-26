"""
Real Error Analyzer - Processes actual Unreal Engine Quest development errors
and provides concrete solutions based on real forum data and error patterns.
"""

import re
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path
import structlog
from datetime import datetime

logger = structlog.get_logger(__name__)

@dataclass
class ErrorSolution:
    """A concrete solution for a specific error"""
    solution_id: str
    error_type: str
    title: str
    description: str
    steps: List[str]
    code_changes: Optional[Dict[str, str]] = None
    config_changes: Optional[Dict[str, Any]] = None
    verification_steps: Optional[List[str]] = None
    confidence: float = 0.9
    source: str = "real_analysis"

class RealErrorAnalyzer:
    """
    Analyzes actual Unreal Engine Quest development errors and provides
    concrete solutions based on real error patterns and forum solutions.
    """
    
    def __init__(self):
        self.error_patterns = self._load_error_patterns()
        self.solutions_database = self._load_solutions_database()
        logger.info("RealErrorAnalyzer initialized with real error patterns and solutions")
    
    def _load_error_patterns(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load real error patterns from actual log analysis"""
        return {
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
                },
                {
                    "pattern": r"OpenXR plugin conflicts with MetaXR",
                    "indicators": ["OpenXR", "MetaXR", "conflicts", "simultaneously"],
                    "severity": "critical", 
                    "confidence": 0.98
                },
                {
                    "pattern": r"Failed to initialize XR system due to plugin conflict",
                    "indicators": ["XR system", "initialization failed", "plugin conflict"],
                    "severity": "critical",
                    "confidence": 0.92
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
                    "indicators": ["SDK version 33", "not supported", "Quest development"],
                    "severity": "critical",
                    "confidence": 0.96
                },
                {
                    "pattern": r"Quest requires Target SDK version 32",
                    "indicators": ["Target SDK", "version 32", "compatibility"],
                    "severity": "high",
                    "confidence": 0.94
                },
                {
                    "pattern": r"MetaXR SDK requires Android Target SDK 32",
                    "indicators": ["MetaXR SDK", "Android Target SDK", "32 or lower"],
                    "severity": "high",
                    "confidence": 0.93
                }
            ],
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
                    "indicators": ["eye render targets", "VR eye buffer", "allocation failed"],
                    "severity": "critical",
                    "confidence": 0.91
                },
                {
                    "pattern": r"VR eye buffer allocation failed.*insufficient GPU memory",
                    "indicators": ["GPU memory", "eye buffer", "allocation failed"],
                    "severity": "high",
                    "confidence": 0.89
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
                },
                {
                    "pattern": r"BUILD FAILED.*AutomationTool",
                    "indicators": ["BUILD FAILED", "AutomationTool", "PackagingResults"],
                    "severity": "critical",
                    "confidence": 0.92
                },
                {
                    "pattern": r"Failed to package for Android",
                    "indicators": ["packaging", "Android", "failed", "APK"],
                    "severity": "critical",
                    "confidence": 0.92
                },
                {
                    "pattern": r"Gradle build failed",
                    "indicators": ["Gradle", "build", "failed", "Android"],
                    "severity": "high",
                    "confidence": 0.88
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
                },
                {
                    "pattern": r"Shader compilation failed",
                    "indicators": ["Shader", "compilation", "failed"],
                    "severity": "high",
                    "confidence": 0.9
                },
                {
                    "pattern": r"Error X3004: undeclared identifier",
                    "indicators": ["undeclared identifier", "X3004", "HLSL"],
                    "severity": "high",
                    "confidence": 0.88
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
    
    def _load_solutions_database(self) -> Dict[str, List[ErrorSolution]]:
        """Load concrete solutions based on real forum analysis"""
        return {
            "plugin_conflict": [
                ErrorSolution(
                    solution_id="plugin_conflict_001",
                    error_type="plugin_conflict",
                    title="Disable OpenXR Plugin for Quest Development",
                    description="Quest development requires MetaXR plugin only. OpenXR conflicts with MetaXR and must be disabled.",
                    steps=[
                        "Open your Unreal Engine project",
                        "Go to Edit → Plugins",
                        "Search for 'OpenXR'",
                        "Uncheck/Disable the OpenXR plugin",
                        "Keep MetaXR plugin enabled",
                        "Restart Unreal Engine",
                        "Clean and rebuild your project"
                    ],
                    config_changes={
                        "DefaultEngine.ini": {
                            "[Plugins]": {
                                "OpenXREnabled": "False",
                                "MetaXREnabled": "True"
                            }
                        }
                    },
                    verification_steps=[
                        "Check that only MetaXR appears in enabled XR plugins",
                        "Verify no XR plugin conflict errors in output log",
                        "Test packaging for Android without errors"
                    ],
                    confidence=0.98
                )
            ],
            "sdk_mismatch": [
                ErrorSolution(
                    solution_id="sdk_mismatch_001", 
                    error_type="sdk_mismatch",
                    title="Set Target SDK Version to 32 for Quest Compatibility",
                    description="Quest development requires Android Target SDK version 32. SDK 33+ introduces breaking changes for VR applications.",
                    steps=[
                        "Open Project Settings in Unreal Engine",
                        "Navigate to Platforms → Android",
                        "Find 'APK Packaging' section",
                        "Set 'Target SDK Version' to 32",
                        "Set 'Minimum SDK Version' to 23",
                        "Save project settings",
                        "Clean and rebuild project"
                    ],
                    config_changes={
                        "DefaultEngine.ini": {
                            "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]": {
                                "TargetSDKVersion": "32",
                                "MinSDKVersion": "23",
                                "BuildToolsVersion": "32.0.0"
                            }
                        }
                    },
                    verification_steps=[
                        "Check Project Settings shows Target SDK = 32",
                        "Verify no SDK version warnings in packaging log",
                        "Test APK installation on Quest device"
                    ],
                    confidence=0.96
                )
            ],
            "black_screen": [
                ErrorSolution(
                    solution_id="black_screen_001",
                    error_type="black_screen", 
                    title="Fix VR Eye Render Target Memory Issues",
                    description="Black screen often caused by insufficient GPU memory for VR eye render targets. Reduce render target size and optimize memory usage.",
                    steps=[
                        "Open Project Settings → Rendering",
                        "Set 'VR Pixel Density' to 1.0 or lower (try 0.8)",
                        "Disable 'Mobile HDR' if enabled",
                        "Set 'Mobile MSAA' to 'No MSAA' or '2x'",
                        "In VR settings, reduce eye texture resolution",
                        "Test with simplified materials/shaders",
                        "Monitor GPU memory usage in stat commands"
                    ],
                    config_changes={
                        "DefaultEngine.ini": {
                            "[/Script/Engine.RendererSettings]": {
                                "vr.PixelDensity": "0.8",
                                "r.Mobile.DisableVertexFog": "True",
                                "r.MobileHDR": "False"
                            }
                        }
                    },
                    verification_steps=[
                        "Check VR preview shows proper rendering",
                        "Verify no render target allocation errors",
                        "Test on Quest device - should show game view, not black screen",
                        "Monitor performance with stat GPU, stat Memory"
                    ],
                    confidence=0.89
                ),
                ErrorSolution(
                    solution_id="black_screen_002",
                    error_type="black_screen",
                    title="Fix Vulkan Renderer Issues for Quest",
                    description="Black screen may be caused by Vulkan renderer problems. Switch to appropriate renderer or fix Vulkan configuration.",
                    steps=[
                        "Open Project Settings → Platforms → Android",
                        "Check 'Vulkan' support settings",
                        "Try disabling Vulkan if enabled (use OpenGL ES 3.1)",
                        "Or ensure Vulkan is properly configured for Quest",
                        "Update graphics drivers on development machine",
                        "Test with basic level/scene first"
                    ],
                    config_changes={
                        "DefaultEngine.ini": {
                            "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]": {
                                "bSupportsVulkan": "False",
                                "bSupportsOpenGLES31": "True"
                            }
                        }
                    },
                    verification_steps=[
                        "Check renderer initialization logs",
                        "Verify no Vulkan-related errors",
                        "Test rendering in VR preview mode"
                    ],
                    confidence=0.82
                )
            ],
            "shader_compile": [
                ErrorSolution(
                    solution_id="shader_compile_001",
                    error_type="shader_compile",
                    title="Fix Shader Compilation Errors",
                    description="Shader compilation errors are often caused by syntax errors in material graphs or HLSL code.",
                    steps=[
                        "Open the material or shader asset that is causing the error",
                        "Look for disconnected pins or incorrect node setups in the material graph",
                        "If using custom HLSL, check for syntax errors like undeclared variables",
                        "Ensure all shader inputs and outputs are correctly configured",
                        "Recompile the shader after making changes"
                    ],
                    verification_steps=[
                        "Verify that the material compiles without errors",
                        "Check that the material appears correctly on objects in the scene"
                    ],
                    confidence=0.85
                )
            ],
            "packaging_error": [
                ErrorSolution(
                    solution_id="packaging_error_001",
                    error_type="packaging_error",
                    title="Fix Common Android Packaging Errors",
                    description="Android packaging can fail due to misconfigured SDK paths, Gradle issues, or manifest errors.",
                    steps=[
                        "Verify that the Android SDK and NDK paths are set correctly in Project Settings -> Platforms -> Android",
                        "Ensure you have the correct Java Development Kit (JDK) installed",
                        "Delete the Intermediate and Saved folders from your project directory",
                        "Try packaging a clean, empty project to isolate the issue",
                        "Check the AndroidManifest.xml for any errors"
                    ],
                    verification_steps=[
                        "Verify that the project packages successfully for Android",
                        "Test the APK on a Quest device"
                    ],
                    confidence=0.9
                )
            ]
        }
    
    def analyze_error_log(self, log_content: str) -> Dict[str, Any]:
        """
        Analyze error log with enhanced multi-error detection and complex patterns
        """
        logger.info("Starting enhanced error analysis", content_length=len(log_content))
        
        # Multi-error detection
        detected_errors = self._detect_multiple_errors(log_content)
        
        if not detected_errors:
            return self._analyze_unknown_error(log_content)
        
        # For multiple errors, return the most critical one as primary
        primary_error = max(detected_errors, key=lambda x: x['confidence'] * x['severity_weight'])
        
        # Get solutions for primary error
        solutions = self.solutions_database.get(primary_error['error_type'], [])
        
        # If no direct solutions, check for generic solutions
        if not solutions and primary_error['error_type'] in ['packaging_error', 'shader_compile']:
             solutions = self.solutions_database.get(primary_error['error_type'], [])
        
        # Enhanced analysis with context extraction
        context_info = self._extract_error_context(log_content, primary_error['error_type'])
        
        # Generate related issues if multiple errors detected
        related_issues = []
        if len(detected_errors) > 1:
            related_issues = [
                {
                    "error_type": err['error_type'],
                    "confidence": err['confidence'],
                    "description": f"Secondary issue: {err['error_type'].replace('_', ' ').title()}"
                }
                for err in detected_errors if err != primary_error
            ]
        
        result = {
            "error_type": primary_error['error_type'],
            "confidence": primary_error['confidence'],
            "severity": primary_error['severity'],
            "description": primary_error.get('description', f"{primary_error['error_type'].replace('_', ' ').title()} detected"),
            "indicators_found": primary_error['indicators'],
            "solutions": [self._solution_to_dict(sol) for sol in solutions],
            "context": context_info,
            "related_issues": related_issues,
            "analysis_metadata": {
                "total_errors_detected": len(detected_errors),
                "log_length": len(log_content),
                "analysis_timestamp": datetime.now().isoformat(),
                "analyzer_version": "2.0_enhanced"
            }
        }
        
        logger.info("Enhanced error analysis completed", 
                   primary_error=primary_error['error_type'],
                   confidence=primary_error['confidence'],
                   related_issues_count=len(related_issues))
        
        return result
    
    def analyze_error_enhanced(self, log_content: str) -> Dict[str, Any]:
        """
        Enhanced error analysis with comprehensive multi-error detection and context extraction.
        This method provides more detailed analysis than the standard analyze_error_log method.
        """
        logger.info("Starting enhanced multi-error analysis", content_length=len(log_content))
        
        # Multi-error detection with full context
        detected_errors = self._detect_multiple_errors(log_content)
        
        if not detected_errors:
            return self._analyze_unknown_error(log_content)
        
        # Enhanced result with all detected errors
        primary_error = detected_errors[0]  # Highest confidence/severity
        secondary_errors = detected_errors[1:3]  # Up to 2 additional errors
        
        # Get solutions for primary error
        solutions = self.solutions_database.get(primary_error['error_type'], [])
        
        # Extract comprehensive context
        context_info = self._extract_error_context(log_content, primary_error['error_type'])
        
        # Auto-fix commands if available
        auto_fix = self.get_auto_fix_commands(primary_error['error_type'], log_content)
        
        result = {
            "primary_error": {
                "error_type": primary_error['error_type'],
                "confidence": primary_error['confidence'],
                "severity": primary_error['severity'],
                "description": primary_error.get('description', f"{primary_error['error_type'].replace('_', ' ').title()} detected"),
                "indicators_found": primary_error['indicators']
            },
            "secondary_errors": [
                {
                    "error_type": err['error_type'],
                    "confidence": err['confidence'],
                    "severity": err['severity'],
                    "description": err.get('description', f"{err['error_type'].replace('_', ' ').title()} detected")
                }
                for err in secondary_errors
            ],
            "solutions": [self._solution_to_dict(sol) for sol in solutions],
            "auto_fix": auto_fix,
            "context": context_info,
            "analysis_summary": {
                "total_errors_detected": len(detected_errors),
                "error_types": [err['error_type'] for err in detected_errors],
                "highest_confidence": max(err['confidence'] for err in detected_errors) if detected_errors else 0,
                "analysis_timestamp": datetime.now().isoformat(),
                "analyzer_version": "2.0_enhanced_multi"
            }
        }
        
        logger.info("Enhanced multi-error analysis completed", 
                   primary_error=primary_error['error_type'],
                   total_errors=len(detected_errors),
                   confidence=primary_error['confidence'])
        
        return result
    
    def _detect_multiple_errors(self, log_content: str) -> List[Dict[str, Any]]:
        """
        Enhanced multi-error detection with confidence scoring and severity weighting
        """
        detected_errors = []
        log_content_lower = log_content.lower()
        
        # Severity weights for prioritization
        severity_weights = {
            "critical": 3.0,
            "high": 2.0,
            "medium": 1.5,
            "low": 1.0
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
                    
                    # Calculate enhanced confidence
                    indicator_boost = (len(indicator_matches) / len(indicators)) * 0.1
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
                            "description": f"{error_type.replace('_', ' ').title()} detected with {len(indicator_matches)} indicators"
                        }
            
            if best_match and max_confidence > 0.5:  # Lower threshold for inclusion
                detected_errors.append(best_match)
        
        # Sort by confidence * severity weight
        detected_errors.sort(key=lambda x: x['confidence'] * x['severity_weight'], reverse=True)
        
        return detected_errors
    
    def _extract_error_context(self, log_content: str, error_type: str) -> Dict[str, Any]:
        """
        Extract contextual information around the error for better understanding
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
            
            # Extract context around key patterns
            for pattern_info in self.error_patterns.get(error_type, []):
                if re.search(pattern_info['pattern'], line, re.IGNORECASE):
                    # Get surrounding context (3 lines before and after)
                    start_idx = max(0, i-3)
                    end_idx = min(len(lines), i+4)
                    context_block = lines[start_idx:end_idx]
                    context_lines.extend([
                        {"line_num": start_idx + j + 1, "content": context_line.strip()}
                        for j, context_line in enumerate(context_block)
                        if context_line.strip()
                    ])
        
        # Remove duplicates and sort by line number
        unique_context = {}
        for ctx in context_lines:
            unique_context[ctx['line_num']] = ctx['content']
        
        sorted_context = [
            {"line_num": line_num, "content": content}
            for line_num, content in sorted(unique_context.items())
        ]
        
        return {
            "error_lines": error_lines[:10],  # Limit to first 10
            "warning_lines": warning_lines[:10],
            "context_lines": sorted_context[:15],  # Limit to 15 most relevant
            "total_errors": len(error_lines),
            "total_warnings": len(warning_lines),
            "log_structure": {
                "total_lines": len(lines),
                "non_empty_lines": len([l for l in lines if l.strip()]),
                "error_percentage": len(error_lines) / len(lines) * 100 if lines else 0
            }
        }
    
    def analyze_unsolved_issues(self, log_content: str) -> Dict[str, Any]:
        """
        Analyze potentially unsolved or complex issues that don't match known patterns
        """
        logger.info("Analyzing potentially unsolved issue")
        
        # Try standard analysis first
        standard_result = self.analyze_error_log(log_content)
        
        # If confidence is low, this might be an unsolved issue
        if standard_result['confidence'] < 0.8:
            return self._analyze_complex_unsolved_issue(log_content, standard_result)
        
        return standard_result
    
    def _analyze_complex_unsolved_issue(self, log_content: str, initial_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle complex unsolved issues with enhanced analysis
        """
        # Extract unique error patterns not in our database
        unique_patterns = self._extract_unique_error_patterns(log_content)
        
        # Analyze error clustering
        error_clusters = self._cluster_related_errors(log_content)
        
        # Generate research suggestions
        research_suggestions = self._generate_research_suggestions(log_content, unique_patterns)
        
        enhanced_result = initial_analysis.copy()
        enhanced_result.update({
            "unsolved_issue_analysis": {
                "is_potentially_unsolved": True,
                "unique_patterns": unique_patterns,
                "error_clusters": error_clusters,
                "research_suggestions": research_suggestions,
                "complexity_score": self._calculate_complexity_score(log_content),
                "recommended_actions": [
                    "Search for similar issues in recent forum posts",
                    "Check for plugin version compatibility",
                    "Review recent Unreal Engine updates",
                    "Consider creating a minimal reproduction case",
                    "Post detailed issue to community forums"
                ]
            }
        })
        
        return enhanced_result
    
    def _extract_unique_error_patterns(self, log_content: str) -> List[Dict[str, Any]]:
        """
        Extract error patterns that don't match our known database
        """
        lines = log_content.split('\n')
        unique_patterns = []
        
        # Look for error lines with unique signatures
        for line in lines:
            if 'error' in line.lower() and line.strip():
                # Extract potential error codes, module names, function names
                error_code_match = re.search(r'error\s+([a-z]\d+)', line, re.IGNORECASE)
                module_match = re.search(r'Log(\w+):', line)
                
                if error_code_match:
                    unique_patterns.append({
                        "type": "error_code",
                        "value": error_code_match.group(1),
                        "line": line.strip(),
                        "potential_search_terms": [error_code_match.group(1), "Unreal Engine"]
                    })
                
                if module_match:
                    module_name = module_match.group(1)
                    # Check if this is a known module
                    known_modules = ['Temp', 'Init', 'Engine', 'Android', 'VR', 'MetaXR', 'OpenXR']
                    if module_name not in known_modules:
                        unique_patterns.append({
                            "type": "unknown_module",
                            "value": module_name,
                            "line": line.strip(),
                            "potential_search_terms": [module_name, "Unreal Engine", "Quest"]
                        })
        
        return unique_patterns[:5]  # Limit to 5 most relevant
    
    def _cluster_related_errors(self, log_content: str) -> List[Dict[str, Any]]:
        """
        Group related errors together for pattern analysis
        """
        lines = log_content.split('\n')
        error_lines = [(i, line) for i, line in enumerate(lines) if 'error' in line.lower()]
        
        clusters = []
        current_cluster = []
        
        for i, (line_num, error_line) in enumerate(error_lines):
            if not current_cluster:
                current_cluster = [{"line_num": line_num, "content": error_line.strip()}]
            else:
                # If errors are close together (within 5 lines), group them
                if line_num - current_cluster[-1]["line_num"] <= 5:
                    current_cluster.append({"line_num": line_num, "content": error_line.strip()})
                else:
                    # Save current cluster and start new one
                    if len(current_cluster) > 1:
                        clusters.append({
                            "cluster_id": len(clusters) + 1,
                            "errors": current_cluster,
                            "line_range": f"{current_cluster[0]['line_num']}-{current_cluster[-1]['line_num']}",
                            "error_count": len(current_cluster)
                        })
                    current_cluster = [{"line_num": line_num, "content": error_line.strip()}]
        
        # Don't forget the last cluster
        if len(current_cluster) > 1:
            clusters.append({
                "cluster_id": len(clusters) + 1,
                "errors": current_cluster,
                "line_range": f"{current_cluster[0]['line_num']}-{current_cluster[-1]['line_num']}",
                "error_count": len(current_cluster)
            })
        
        return clusters
    
    def _generate_research_suggestions(self, log_content: str, unique_patterns: List[Dict]) -> List[str]:
        """
        Generate research suggestions for unsolved issues
        """
        suggestions = []
        
        # Based on unique patterns found
        for pattern in unique_patterns:
            if pattern["type"] == "error_code":
                suggestions.append(f"Search forums for error code: {pattern['value']}")
            elif pattern["type"] == "unknown_module":
                suggestions.append(f"Research {pattern['value']} module compatibility with Quest")
        
        # General suggestions based on content analysis
        if 'vulkan' in log_content.lower():
            suggestions.append("Check Vulkan driver compatibility and rendering settings")
        
        if 'android' in log_content.lower():
            suggestions.append("Verify Android SDK and NDK versions for Quest development")
        
        if 'plugin' in log_content.lower():
            suggestions.append("Review all enabled plugins for version compatibility")
        
        # Limit to most relevant suggestions
        return suggestions[:5]
    
    def _calculate_complexity_score(self, log_content: str) -> float:
        """
        Calculate a complexity score for the issue (0.0 to 1.0)
        """
        lines = log_content.split('\n')
        error_count = len([l for l in lines if 'error' in l.lower()])
        warning_count = len([l for l in lines if 'warning' in l.lower()])
        unique_modules = len(set(re.findall(r'Log(\w+):', log_content)))
        
        # Normalize factors
        error_factor = min(error_count / 10.0, 1.0)  # 10+ errors = max complexity
        warning_factor = min(warning_count / 20.0, 0.5)  # Warnings add some complexity
        module_factor = min(unique_modules / 15.0, 0.3)  # Many modules = more complex
        
        complexity = error_factor + warning_factor + module_factor
        return min(complexity, 1.0)
    
    def get_solution_by_id(self, solution_id: str) -> Optional[ErrorSolution]:
        """Get a specific solution by ID"""
        for solutions_list in self.solutions_database.values():
            for solution in solutions_list:
                if solution.solution_id == solution_id:
                    return solution
        return None
    
    def get_auto_fix_commands(self, error_type: str, log_content: str) -> Optional[Dict[str, Any]]:
        """
        Generate automated fix commands for the error type
        """
        solutions = self.solutions_database.get(error_type, [])
        if not solutions:
            return None
        
        # Get the highest confidence solution
        best_solution = max(solutions, key=lambda x: x.confidence)
        
        auto_fix = {
            "solution_id": best_solution.solution_id,
            "error_type": error_type,
            "fix_type": "configuration_change",
            "commands": []
        }
        
        # Generate specific commands based on error type
        if error_type == "plugin_conflict":
            auto_fix["commands"] = [
                {
                    "action": "disable_plugin",
                    "plugin_name": "OpenXR",
                    "description": "Disable OpenXR plugin to resolve conflict with MetaXR"
                },
                {
                    "action": "ensure_plugin_enabled", 
                    "plugin_name": "MetaXR",
                    "description": "Ensure MetaXR plugin remains enabled for Quest development"
                }
            ]
        elif error_type == "sdk_mismatch":
            auto_fix["commands"] = [
                {
                    "action": "update_config",
                    "file": "Config/DefaultEngine.ini",
                    "section": "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]",
                    "key": "TargetSDKVersion",
                    "value": "32",
                    "description": "Set Target SDK Version to 32 for Quest compatibility"
                },
                {
                    "action": "update_config",
                    "file": "Config/DefaultEngine.ini", 
                    "section": "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]",
                    "key": "MinSDKVersion",
                    "value": "23",
                    "description": "Set Minimum SDK Version to 23"
                }
            ]
        elif error_type == "black_screen":
            auto_fix["commands"] = [
                {
                    "action": "update_config",
                    "file": "Config/DefaultEngine.ini",
                    "section": "[/Script/Engine.RendererSettings]", 
                    "key": "vr.PixelDensity",
                    "value": "0.8",
                    "description": "Reduce VR pixel density to save GPU memory"
                },
                {
                    "action": "update_config",
                    "file": "Config/DefaultEngine.ini",
                    "section": "[/Script/Engine.RendererSettings]",
                    "key": "r.MobileHDR", 
                    "value": "False",
                    "description": "Disable Mobile HDR to reduce memory usage"
                }
            ]
        
        return auto_fix
    
    def _analyze_unknown_error(self, log_content: str) -> Dict[str, Any]:
        """Analyze errors that don't match known patterns"""
        
        # Look for common error keywords with proper mapping to expected types
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
            "key_log_lines": self._extract_key_log_lines(log_content, likely_category),
            "solutions": [],
            "analysis_method": "improved_keyword_analysis",
            "recommendation": "Pattern-based analysis with improved keyword matching"
        }
    
    def _extract_key_log_lines(self, log_content: str, error_type: str) -> List[str]:
        """Extract the most relevant log lines for the error type"""
        lines = log_content.split('\n')
        
        # Keywords to look for based on error type
        keywords_map = {
            "plugin_conflict": ["plugin", "xr", "openxr", "metaxr", "conflict", "multiple"],
            "sdk_mismatch": ["sdk", "version", "target", "android", "32", "33"],
            "black_screen": ["render", "eye", "buffer", "vulkan", "black", "screen", "memory"],
            "unknown": ["error", "failed", "warning"]
        }
        
        keywords = keywords_map.get(error_type, keywords_map["unknown"])
        
        # Find lines containing relevant keywords
        relevant_lines = []
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in keywords):
                relevant_lines.append(line.strip())
        
        # Return top 10 most relevant lines
        return relevant_lines[:10]
    
    def _solution_to_dict(self, solution: ErrorSolution) -> Dict[str, Any]:
        """Convert ErrorSolution to dictionary for JSON serialization"""
        return {
            "solution_id": solution.solution_id,
            "error_type": solution.error_type,
            "title": solution.title,
            "description": solution.description,
            "steps": solution.steps,
            "code_changes": solution.code_changes,
            "config_changes": solution.config_changes,
            "verification_steps": solution.verification_steps,
            "confidence": solution.confidence,
            "source": solution.source
        }

# Global instance
_real_analyzer: Optional[RealErrorAnalyzer] = None

def get_real_analyzer() -> RealErrorAnalyzer:
    """Get the global real error analyzer instance"""
    global _real_analyzer
    if _real_analyzer is None:
        _real_analyzer = RealErrorAnalyzer()
    return _real_analyzer

def analyze_real_error(log_content: str) -> Dict[str, Any]:
    """Main function to analyze real error logs"""
    analyzer = get_real_analyzer()
    return analyzer.analyze_error_log(log_content) 