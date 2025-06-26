"""
Real Functionality Integration Tests

Tests the actual Quest Dev Copilot system with real data, real error logs,
and real API integrations instead of mocks. This validates the system
works with actual problems and provides real solutions.
"""

import pytest
import asyncio
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys
import os

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Import backend modules from correct path
backend_path = project_root.parent / "backend"
sys.path.append(str(backend_path))

try:
    from real_error_analyzer import RealErrorAnalyzer, analyze_real_error
except ImportError:
    # Try alternative import path
    sys.path.append(str(project_root.parent))
    from backend.real_error_analyzer import RealErrorAnalyzer, analyze_real_error

from llama.cost_tracker import CostTracker, get_cost_tracker
from rag.vector_store import ChromaVectorStore
from rag.retrieval import DocumentRetriever
from rag.embeddings import GeminiEmbeddingGenerator

class TestRealErrorAnalysis:
    """Test real error analysis with actual error logs"""
    
    @pytest.fixture
    def sample_logs_dir(self):
        """Get path to real sample logs"""
        return project_root.parent / "sample_logs"
    
    @pytest.fixture 
    def real_analyzer(self):
        """Get real error analyzer instance"""
        return RealErrorAnalyzer()
    
    def test_plugin_conflict_analysis(self, real_analyzer, sample_logs_dir):
        """Test analysis of real plugin conflict error"""
        log_file = sample_logs_dir / "plugin_conflict.log"
        assert log_file.exists(), f"Plugin conflict log file should exist at {log_file}"
        
        with open(log_file, 'r') as f:
            log_content = f.read()
        
        result = real_analyzer.analyze_error_log(log_content)
        
        # Verify classification
        assert result["error_type"] == "plugin_conflict"
        assert result["confidence"] > 0.9
        assert result["severity"] == "critical"
        
        # Verify solutions are provided
        assert len(result["solutions"]) > 0
        solution = result["solutions"][0]
        assert solution["solution_id"] == "plugin_conflict_001"
        assert "OpenXR" in solution["title"]
        assert len(solution["steps"]) > 5
        
        # Verify auto-fix commands
        auto_fix = real_analyzer.get_auto_fix_commands("plugin_conflict", log_content)
        assert auto_fix is not None
        assert auto_fix["error_type"] == "plugin_conflict"
        assert len(auto_fix["commands"]) >= 2
        
        # Check for disable OpenXR command
        openxr_command = next((cmd for cmd in auto_fix["commands"] 
                              if cmd["action"] == "disable_plugin" and cmd["plugin_name"] == "OpenXR"), None)
        assert openxr_command is not None
    
    def test_sdk_mismatch_analysis(self, real_analyzer, sample_logs_dir):
        """Test analysis of real SDK mismatch error"""
        log_file = sample_logs_dir / "sdk_mismatch.log"
        assert log_file.exists(), f"SDK mismatch log file should exist at {log_file}"
        
        with open(log_file, 'r') as f:
            log_content = f.read()
        
        result = real_analyzer.analyze_error_log(log_content)
        
        # Verify classification
        assert result["error_type"] == "sdk_mismatch"
        assert result["confidence"] > 0.9
        assert result["severity"] in ["critical", "high"]
        
        # Verify SDK 33 is detected as problematic
        assert any("33" in indicator for indicator in result["indicators_found"])
        
        # Verify solution provides SDK 32 fix
        solution = result["solutions"][0]
        assert "32" in solution["title"] or "32" in solution["description"]
        
        # Verify auto-fix sets SDK to 32
        auto_fix = real_analyzer.get_auto_fix_commands("sdk_mismatch", log_content)
        sdk_command = next((cmd for cmd in auto_fix["commands"] 
                           if "TargetSDKVersion" in cmd.get("key", "")), None)
        assert sdk_command is not None
        assert sdk_command["value"] == "32"
    
    def test_black_screen_analysis(self, real_analyzer, sample_logs_dir):
        """Test analysis of real black screen error"""
        log_file = sample_logs_dir / "black_screen.log"
        assert log_file.exists(), f"Black screen log file should exist at {log_file}"
        
        with open(log_file, 'r') as f:
            log_content = f.read()
        
        result = real_analyzer.analyze_error_log(log_content)
        
        # Verify classification
        assert result["error_type"] == "black_screen"
        assert result["confidence"] > 0.8
        
        # Verify memory/rendering issues are detected
        indicators = [ind.lower() for ind in result["indicators_found"]]
        assert any("memory" in ind or "render" in ind or "buffer" in ind for ind in indicators)
        
        # Verify solutions address memory/rendering
        solution = result["solutions"][0]
        assert any(keyword in solution["description"].lower() 
                  for keyword in ["memory", "render", "gpu", "pixel density"])
        
        # Verify auto-fix reduces memory usage
        auto_fix = real_analyzer.get_auto_fix_commands("black_screen", log_content)
        assert auto_fix is not None
        
        # Should have commands to reduce VR pixel density or disable HDR
        memory_commands = [cmd for cmd in auto_fix["commands"] 
                          if "PixelDensity" in cmd.get("key", "") or "HDR" in cmd.get("key", "")]
        assert len(memory_commands) > 0


class TestRealCostTracking:
    """Test real cost tracking functionality"""
    
    @pytest.fixture
    def cost_tracker(self):
        """Get a fresh cost tracker instance"""
        return CostTracker(storage_path="./test_cost_tracking.json")
    
    def test_cost_calculation(self, cost_tracker):
        """Test real cost calculation for different models"""
        # Test Scout model
        scout_cost = cost_tracker.calculate_cost(
            "Llama-4-Scout-17B-16E-Instruct-FP8", 
            prompt_tokens=1000, 
            completion_tokens=500
        )
        expected_scout = (1000/1000 * 0.002) + (500/1000 * 0.004)  # 0.002 + 0.002 = 0.004
        assert abs(scout_cost - expected_scout) < 0.000001
        
        # Test Maverick model (more expensive)
        maverick_cost = cost_tracker.calculate_cost(
            "Llama-4-Maverick-17B-128E-Instruct-FP8",
            prompt_tokens=1000,
            completion_tokens=500
        )
        expected_maverick = (1000/1000 * 0.004) + (500/1000 * 0.008)  # 0.004 + 0.004 = 0.008
        assert abs(maverick_cost - expected_maverick) < 0.000001
        
        # Maverick should be more expensive than Scout
        assert maverick_cost > scout_cost
    
    def test_usage_tracking(self, cost_tracker):
        """Test real usage tracking and statistics"""
        # Track some usage
        record1 = cost_tracker.track_usage(
            model_name="Llama-4-Scout-17B-16E-Instruct-FP8",
            prompt_tokens=800,
            completion_tokens=200,
            operation="error_classification"
        )
        
        record2 = cost_tracker.track_usage(
            model_name="Llama-4-Maverick-17B-128E-Instruct-FP8", 
            prompt_tokens=1200,
            completion_tokens=800,
            operation="fix_generation"
        )
        
        # Verify records are created
        assert record1.model_name == "Llama-4-Scout-17B-16E-Instruct-FP8"
        assert record1.total_tokens == 1000
        assert record1.operation == "error_classification"
        
        # Get usage statistics
        stats = cost_tracker.get_usage_statistics(days=1)
        
        assert stats["total_requests"] == 2
        assert stats["total_tokens"] == 3000  # 1000 + 2000
        assert stats["total_cost"] > 0
        
        # Check model breakdown
        cost_by_model = stats["cost_by_model"]
        assert "Llama-4-Scout-17B-16E-Instruct-FP8" in cost_by_model
        assert "Llama-4-Maverick-17B-128E-Instruct-FP8" in cost_by_model
        
        # Maverick should cost more
        assert cost_by_model["Llama-4-Maverick-17B-128E-Instruct-FP8"] > cost_by_model["Llama-4-Scout-17B-16E-Instruct-FP8"]
    
    def test_budget_management(self, cost_tracker):
        """Test real budget management features"""
        # Set daily budget
        cost_tracker.set_daily_budget(10.0)  # $10 daily budget
        
        # Track some usage
        cost_tracker.track_usage(
            model_name="Llama-4-Scout-17B-16E-Instruct-FP8",
            prompt_tokens=10000,  # Large usage
            completion_tokens=5000,
            operation="test"
        )
        
        # Check budget status
        budget_status = cost_tracker.check_budget_status()
        
        assert budget_status["budget_limit"] == 10.0
        assert budget_status["cost_today"] > 0
        assert budget_status["remaining_budget"] < 10.0
        assert budget_status["requests_today"] == 1
        
        # Test efficiency metrics
        efficiency = cost_tracker.get_efficiency_metrics()
        assert "average_token_efficiency" in efficiency
        assert "cost_per_completion_token" in efficiency
    
    def test_usage_report_generation(self, cost_tracker):
        """Test usage report generation"""
        # Add some usage data
        cost_tracker.track_usage("Llama-4-Scout-17B-16E-Instruct-FP8", 500, 300, "classification")
        cost_tracker.track_usage("Llama-4-Maverick-17B-128E-Instruct-FP8", 1000, 600, "generation")
        
        # Generate report
        report = cost_tracker.export_usage_report(days=1)
        
        assert "Llama API Usage Report" in report
        assert "Total Requests: 2" in report
        assert "Total Cost:" in report
        assert "Budget Status" in report
        assert "Cost by Model" in report
        assert "Efficiency Metrics" in report


class TestRealVectorStoreIntegration:
    """Test real vector store integration with actual ChromaDB data"""
    
    @pytest.fixture
    def chroma_store(self):
        """Get ChromaDB instance with real data"""
        chroma_path = project_root / "chroma_db_store"
        return ChromaVectorStore(path=str(chroma_path), collection_name="unreal_quest_forum_data_v1")
    
    def test_real_chroma_data_access(self, chroma_store):
        """Test accessing real ChromaDB data"""
        # Check if we have real data
        count = chroma_store.get_collection_count()
        
        if count > 0:
            # We have real data - test querying it
            # Create a test query embedding (mock for this test)
            test_embedding = [0.1] * 768  # Assuming 768 dimensions
            
            results = chroma_store.query(
                query_embeddings=[test_embedding],
                n_results=5
            )
            
            assert results is not None
            assert 'documents' in results
            assert 'metadatas' in results
            
            # Verify we got some results
            if results['documents'] and results['documents'][0]:
                documents = results['documents'][0]
                assert len(documents) > 0
                
                # Check that documents contain relevant content
                doc_content = ' '.join(documents).lower()
                assert any(keyword in doc_content for keyword in 
                          ['unreal', 'quest', 'error', 'plugin', 'sdk', 'vr'])
        else:
            # No real data available - skip this test
            pytest.skip("No real ChromaDB data available for testing")
    
    @pytest.mark.skipif(not os.getenv('GEMINI_API_KEY'), reason="No Gemini API key available")
    def test_real_document_retrieval(self, chroma_store):
        """Test real document retrieval with actual embeddings"""
        try:
            # Create real embedding generator
            embedding_gen = GeminiEmbeddingGenerator()
            retriever = DocumentRetriever(embedding_gen, chroma_store)
            
            # Test retrieval with Quest-related query
            query = "Quest VR plugin conflict OpenXR MetaXR error"
            
            # This will make real API call to Gemini
            results = asyncio.run(retriever.retrieve_relevant_documents(
                query_text=query,
                n_results=3
            ))
            
            if results:
                assert len(results) > 0
                
                # Verify results are relevant
                for result in results:
                    assert 'document' in result
                    assert 'metadata' in result
                    assert result['distance'] is not None
                    
                    # Check relevance
                    doc_content = result['document'].lower()
                    assert any(keyword in doc_content for keyword in 
                              ['quest', 'vr', 'plugin', 'error', 'openxr', 'metaxr'])
            
        except Exception as e:
            if "API key" in str(e):
                pytest.skip("Gemini API key not configured properly")
            else:
                raise


class TestEndToEndRealWorkflow:
    """Test complete end-to-end workflow with real data"""
    
    @pytest.fixture
    def sample_logs_dir(self):
        return project_root.parent / "sample_logs"
    
    def test_complete_error_analysis_workflow(self, sample_logs_dir):
        """Test complete workflow from error log to solution"""
        # Load real error log
        log_file = sample_logs_dir / "plugin_conflict.log"
        with open(log_file, 'r') as f:
            log_content = f.read()
        
        # Step 1: Analyze error with real analyzer
        analyzer = RealErrorAnalyzer()
        analysis_result = analyzer.analyze_error_log(log_content)
        
        # Step 2: Track cost (simulated)
        cost_tracker = CostTracker()
        cost_tracker.track_usage(
            model_name="Llama-4-Scout-17B-16E-Instruct-FP8",
            prompt_tokens=len(log_content.split()) * 1.3,  # Rough token estimate
            completion_tokens=200,
            operation="error_analysis"
        )
        
        # Step 3: Get auto-fix commands
        auto_fix = analyzer.get_auto_fix_commands(
            analysis_result["error_type"], 
            log_content
        )
        
        # Step 4: Verify complete workflow results
        assert analysis_result["error_type"] == "plugin_conflict"
        assert analysis_result["confidence"] > 0.9
        assert len(analysis_result["solutions"]) > 0
        
        assert auto_fix is not None
        assert auto_fix["error_type"] == "plugin_conflict"
        assert len(auto_fix["commands"]) >= 2
        
        # Step 5: Verify cost tracking worked
        stats = cost_tracker.get_usage_statistics(days=1)
        assert stats["total_requests"] == 1
        assert stats["total_cost"] > 0
        
        # Step 6: Generate comprehensive response
        response = {
            "error_analysis": analysis_result,
            "auto_fix": auto_fix,
            "cost_info": {
                "tokens_used": stats["total_tokens"],
                "estimated_cost": stats["total_cost"]
            },
            "status": "success"
        }
        
        # Verify response completeness
        assert response["status"] == "success"
        assert response["error_analysis"]["error_type"] == "plugin_conflict"
        assert len(response["auto_fix"]["commands"]) >= 2
        assert response["cost_info"]["tokens_used"] > 0
    
    def test_unknown_error_handling(self):
        """Test handling of unknown/unrecognized errors"""
        # Create a fake error log that doesn't match known patterns
        unknown_log = """
        LogCustom: Some unknown error occurred
        LogWeird: This is not a recognized pattern
        LogTest: Random error message
        """
        
        analyzer = RealErrorAnalyzer()
        result = analyzer.analyze_error_log(unknown_log)
        
        # Should classify as unknown but still provide analysis
        assert result["error_type"] in ["unknown", "packaging", "rendering", "memory", "android", "vr"]
        assert result["confidence"] < 0.7  # Lower confidence for unknown errors
        assert "analysis_method" in result
        
        # Should provide recommendation for manual analysis
        if result["error_type"] == "unknown":
            assert "recommendation" in result
            assert "manual analysis" in result["recommendation"].lower()

    def teardown_method(self):
        """Clean up test files"""
        test_files = ["./test_cost_tracking.json"]
        for file_path in test_files:
            if os.path.exists(file_path):
                os.remove(file_path) 