# comprehensive_test.py
import asyncio
import sys
from pathlib import Path
import os
import structlog
from dotenv import load_dotenv
import json
from typing import List, Dict

# Configure logging
logger = structlog.get_logger()

# Add the quest-dev-copilot directory to Python path
project_root = Path(__file__).parent
quest_copilot_dir = project_root / "quest-dev-copilot"
sys.path.insert(0, str(quest_copilot_dir))

# Import the components
from backend.real_error_analyzer import RealErrorAnalyzer
from rag.retrieval import DocumentRetriever
from rag.embeddings import GeminiEmbeddingGenerator
from rag.vector_store import ChromaVectorStore

class ComprehensiveTestSuite:
    """
    Comprehensive test suite for the Quest Dev Copilot RAG pipeline.
    Tests various real-world error scenarios to validate system performance.
    """
    
    def __init__(self):
        self.analyzer = None
        self.retriever = None
        self.test_results = []
        
    async def initialize_components(self):
        """Initialize all RAG pipeline components."""
        try:
            # Initialize embedding generator
            embedding_generator = GeminiEmbeddingGenerator()
            
            # Initialize vector store
            db_path = str(project_root / "chroma_db_store")
            vector_store = ChromaVectorStore(path=db_path, collection_name="unreal_quest_forum_data_v1")
            
            # Initialize components
            self.analyzer = RealErrorAnalyzer()
            self.retriever = DocumentRetriever(embedding_generator=embedding_generator, vector_store=vector_store)
            
            # Verify ChromaDB has data
            collection_count = vector_store.get_collection_count()
            logger.info("Components initialized successfully.", collection_count=collection_count)
            
            if collection_count == 0:
                raise Exception("ChromaDB collection is empty - no data to test against!")
                
            return True
            
        except Exception as e:
            logger.error("Failed to initialize components.", error=str(e))
            return False
    
    async def test_error_scenario(self, test_name: str, log_content: str, expected_error_type: str = None, description: str = ""):
        """Test a single error scenario and return detailed results."""
        print(f"\n{'='*80}")
        print(f"TEST: {test_name}")
        print(f"{'='*80}")
        if description:
            print(f"Description: {description}")
        print(f"Log Content: {log_content[:200]}{'...' if len(log_content) > 200 else ''}")
        print("-" * 80)
        
        test_result = {
            "test_name": test_name,
            "log_content": log_content,
            "expected_error_type": expected_error_type,
            "description": description,
            "success": False,
            "error_classification": None,
            "retrieved_documents": [],
            "retrieval_success": False,
            "notes": []
        }
        
        try:
            # 1. Error Analysis
            analysis_result = self.analyzer.analyze_error_log(log_content)
            test_result["error_classification"] = analysis_result
            
            if not analysis_result or analysis_result['error_type'] == 'unknown':
                test_result["notes"].append("Error classification failed or returned 'unknown'")
                print(f"❌ Error Classification: FAILED (returned {analysis_result['error_type'] if analysis_result else 'None'})")
            else:
                detected_type = analysis_result['error_type']
                confidence = analysis_result['confidence']
                print(f"✅ Error Classification: {detected_type} (confidence: {confidence:.2f})")
                
                if expected_error_type and detected_type != expected_error_type:
                    test_result["notes"].append(f"Expected {expected_error_type}, got {detected_type}")
                    print(f"⚠️  Expected {expected_error_type}, got {detected_type}")
            
            # 2. Document Retrieval
            if analysis_result and analysis_result['error_type'] != 'unknown':
                query = f"{analysis_result['error_type']}: {analysis_result.get('context', log_content[:200])}"
                print(f"🔍 Search Query: {query[:100]}{'...' if len(query) > 100 else ''}")
                
                retrieved_docs = await self.retriever.retrieve_relevant_documents(query, n_results=5)
                test_result["retrieved_documents"] = retrieved_docs
                
                if retrieved_docs and len(retrieved_docs) > 0:
                    test_result["retrieval_success"] = True
                    print(f"✅ Document Retrieval: Found {len(retrieved_docs)} relevant documents")
                    
                    # Show top 2 results
                    for i, doc in enumerate(retrieved_docs[:2], 1):
                        title = doc.get('metadata', {}).get('title', 'No title')[:60]
                        distance = doc.get('distance', 'N/A')
                        print(f"   {i}. {title}... (distance: {distance})")
                else:
                    print(f"❌ Document Retrieval: No relevant documents found")
                    test_result["notes"].append("No relevant documents retrieved")
            else:
                print(f"⏭️  Document Retrieval: Skipped due to classification failure")
            
            # Overall success
            test_result["success"] = (
                analysis_result is not None and 
                analysis_result['error_type'] != 'unknown' and
                (not expected_error_type or analysis_result['error_type'] == expected_error_type)
            )
            
        except Exception as e:
            test_result["notes"].append(f"Exception during test: {str(e)}")
            logger.error("Test failed with exception.", test_name=test_name, error=str(e))
            print(f"💥 Test failed with exception: {str(e)}")
        
        self.test_results.append(test_result)
        return test_result
    
    def print_summary(self):
        """Print a comprehensive summary of all test results."""
        print(f"\n{'='*80}")
        print("COMPREHENSIVE TEST SUMMARY")
        print(f"{'='*80}")
        
        total_tests = len(self.test_results)
        successful_classifications = sum(1 for r in self.test_results if r["error_classification"] and r["error_classification"]["error_type"] != "unknown")
        successful_retrievals = sum(1 for r in self.test_results if r["retrieval_success"])
        overall_success = sum(1 for r in self.test_results if r["success"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Successful Classifications: {successful_classifications}/{total_tests} ({successful_classifications/total_tests*100:.1f}%)")
        print(f"Successful Retrievals: {successful_retrievals}/{total_tests} ({successful_retrievals/total_tests*100:.1f}%)")
        print(f"Overall Success Rate: {overall_success}/{total_tests} ({overall_success/total_tests*100:.1f}%)")
        
        print(f"\n{'='*60}")
        print("DETAILED RESULTS:")
        print(f"{'='*60}")
        
        for i, result in enumerate(self.test_results, 1):
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            error_type = result["error_classification"]["error_type"] if result["error_classification"] else "None"
            confidence = result["error_classification"]["confidence"] if result["error_classification"] else 0
            doc_count = len(result["retrieved_documents"]) if result["retrieved_documents"] else 0
            
            print(f"{i:2d}. {status} | {result['test_name'][:40]:40} | {error_type:15} | {confidence:.2f} | {doc_count} docs")
            
            if result["notes"]:
                for note in result["notes"]:
                    print(f"     Note: {note}")
        
        # Error type analysis
        error_types = {}
        for result in self.test_results:
            if result["error_classification"]:
                error_type = result["error_classification"]["error_type"]
                if error_type not in error_types:
                    error_types[error_type] = {"count": 0, "avg_confidence": 0, "confidences": []}
                error_types[error_type]["count"] += 1
                error_types[error_type]["confidences"].append(result["error_classification"]["confidence"])
        
        print(f"\n{'='*60}")
        print("ERROR TYPE ANALYSIS:")
        print(f"{'='*60}")
        
        for error_type, stats in error_types.items():
            avg_conf = sum(stats["confidences"]) / len(stats["confidences"])
            print(f"{error_type:20} | Count: {stats['count']:2d} | Avg Confidence: {avg_conf:.2f}")

async def run_comprehensive_tests():
    """Run the comprehensive test suite with various error scenarios."""
    
    # Load environment
    env_path = quest_copilot_dir / '.env'
    if not env_path.exists():
        env_path = project_root / '.env'
    
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"Loaded environment from {env_path}")
    
    if not os.getenv('GEMINI_API_KEY'):
        print("FATAL: GEMINI_API_KEY not found in environment")
        return
    
    # Initialize test suite
    test_suite = ComprehensiveTestSuite()
    
    if not await test_suite.initialize_components():
        print("Failed to initialize components. Exiting.")
        return
    
    # Define comprehensive test cases
    test_cases = [
        # VR/Graphics Errors
        {
            "name": "VR Eye Buffer Allocation",
            "log": "LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048",
            "expected": "black_screen",
            "description": "VR eye buffer allocation failure"
        },
        {
            "name": "Vulkan Render Pass Error", 
            "log": "LogVulkanRHI: Error: vkCreateRenderPass failed, VkResult=VK_ERROR_OUT_OF_DEVICE_MEMORY",
            "expected": "black_screen",
            "description": "Vulkan device memory exhaustion"
        },
        {
            "name": "OpenXR Session Error",
            "log": "LogOpenXR: Error: xrCreateSession failed with XR_ERROR_GRAPHICS_DEVICE_INVALID",
            "expected": "black_screen", 
            "description": "OpenXR graphics device validation failure"
        },
        
        # Packaging/Build Errors
        {
            "name": "Android Packaging Failure",
            "log": "UATHelper: Packaging (Android): BUILD FAILED: Task :app:packageDebug FAILED",
            "expected": "packaging_error",
            "description": "Android APK packaging failure"
        },
        {
            "name": "Gradle Build Error",
            "log": "LogPlayLevel: CommandUtils.Run: ERROR: cmd.exe failed with args /c \"C:\\Android\\gradle\\bin\\gradle.bat\" assembleDebug --stacktrace",
            "expected": "packaging_error",
            "description": "Gradle assembly failure with stacktrace"
        },
        {
            "name": "APK Signing Error",
            "log": "UATHelper: Packaging (Android): Error: Failed to sign APK: jarsigner error",
            "expected": "packaging_error",
            "description": "APK signing process failure"
        },
        
        # Plugin/SDK Conflicts
        {
            "name": "MetaXR Plugin Conflict",
            "log": "LogPluginManager: Error: Plugin 'MetaXR' failed to load because module 'OculusXRHMD' could not be found",
            "expected": "plugin_conflict",
            "description": "MetaXR plugin module dependency missing"
        },
        {
            "name": "OpenXR Plugin Version Mismatch",
            "log": "LogOpenXRHMD: Error: OpenXR runtime version 1.0.25 is incompatible with plugin version 1.0.28",
            "expected": "sdk_mismatch",
            "description": "OpenXR runtime and plugin version incompatibility"
        },
        {
            "name": "Multiple XR Plugins",
            "log": "LogXRSystem: Warning: Multiple XR plugins detected: OculusXR, OpenXR. This may cause conflicts.",
            "expected": "plugin_conflict",
            "description": "Multiple XR systems causing conflicts"
        },
        
        # Shader Compilation
        {
            "name": "Mobile Shader Compile Error",
            "log": "LogShaderCompilers: Error: Failed to compile shader for platform Android_VULKAN: Syntax error at line 45",
            "expected": "shader_compile",
            "description": "Mobile Vulkan shader compilation syntax error"
        },
        {
            "name": "HLSL Compilation Failure",
            "log": "LogD3D11ShaderCompiler: Error: HLSL compilation failed: undeclared identifier 'SV_Position'",
            "expected": "shader_compile", 
            "description": "HLSL shader semantic identifier error"
        },
        
        # Complex Multi-line Errors
        {
            "name": "Complex Crash Log",
            "log": """LogCore: Fatal error!
Unhandled Exception: EXCEPTION_ACCESS_VIOLATION reading address 0x00000000
LogWindows: Error: === Critical error: ===
Fatal error!
Unhandled Exception: EXCEPTION_ACCESS_VIOLATION reading address 0x00000000
0x00007FF7A1234567 UnrealEngine!FVulkanDevice::CreateBuffer()
0x00007FF7A1234568 UnrealEngine!FVulkanRHI::RHICreateVertexBuffer()""",
            "expected": None,  # Let's see what it detects
            "description": "Complex crash with access violation and stack trace"
        },
        
        # Edge Cases
        {
            "name": "Empty Log",
            "log": "",
            "expected": None,
            "description": "Empty log content"
        },
        {
            "name": "Generic Warning Only", 
            "log": "LogTemp: Warning: This is just a warning message",
            "expected": None,
            "description": "Non-error log message"
        },
        {
            "name": "Unknown Error Pattern",
            "log": "SomeCustomSystem: CriticalFailure: Quantum flux capacitor overload detected in subsystem 7",
            "expected": None,
            "description": "Completely unknown error pattern"
        },
        
        # Real-world Quest-specific issues
        {
            "name": "Quest Link Connection",
            "log": "LogOculusXRHMD: Error: Failed to initialize Oculus Link connection: USB_DEVICE_NOT_FOUND",
            "expected": None,
            "description": "Quest Link USB connection failure"
        },
        {
            "name": "Hand Tracking Error",
            "log": "LogOculusInput: Error: Hand tracking initialization failed: OVRP_FAILURE_INVALID_PARAMETER", 
            "expected": None,
            "description": "Quest hand tracking initialization failure"
        },
        {
            "name": "Guardian System Error",
            "log": "LogOculusXRHMD: Error: Guardian system boundary setup failed: BOUNDARY_NOT_CONFIGURED",
            "expected": None,
            "description": "Quest guardian boundary configuration error"
        }
    ]
    
    # Run all test cases
    print(f"Running {len(test_cases)} comprehensive tests...")
    
    for test_case in test_cases:
        await test_suite.test_error_scenario(
            test_name=test_case["name"],
            log_content=test_case["log"],
            expected_error_type=test_case.get("expected"),
            description=test_case.get("description", "")
        )
        
        # Small delay to avoid overwhelming APIs
        await asyncio.sleep(0.5)
    
    # Print comprehensive summary
    test_suite.print_summary()
    
    # Save detailed results to JSON
    results_file = project_root / "comprehensive_test_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(test_suite.test_results, f, indent=2, default=str)
    
    print(f"\n📁 Detailed results saved to: {results_file}")

if __name__ == "__main__":
    # Configure logging
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    
    asyncio.run(run_comprehensive_tests()) 