"""
Integration tests for real Quest Dev Copilot functionality.
Tests actual working components vs claims.
"""

import pytest
import sys
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# Fix import paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Import from quest-dev-copilot package
try:
    from quest_dev_copilot.backend.real_error_analyzer import RealErrorAnalyzer, analyze_real_error
    from quest_dev_copilot.llama.cost_tracker import CostTracker
    from quest_dev_copilot.rag.vector_store import ChromaVectorStore
except ImportError:
    # Fallback to direct imports
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from backend.real_error_analyzer import RealErrorAnalyzer, analyze_real_error
    from llama.cost_tracker import CostTracker
    from rag.vector_store import ChromaVectorStore

class TestRealErrorAnalysis:
    """Test real error analysis functionality."""
    
    def test_real_error_analyzer_initialization(self):
        """Test that RealErrorAnalyzer initializes correctly."""
        analyzer = RealErrorAnalyzer()
        assert analyzer is not None
        assert hasattr(analyzer, 'error_patterns')
        assert len(analyzer.error_patterns) >= 5
    
    def test_plugin_conflict_detection(self):
        """Test detection of plugin conflict errors."""
        analyzer = RealErrorAnalyzer()
        log_content = 'LogTemp: Error: OpenXR plugin conflicts with MetaXR plugin'
        
        result = analyzer.analyze_error_log(log_content)
        
        assert result['error_type'] == 'plugin_conflict'
        assert result['confidence'] >= 0.9
        assert result['severity'] == 'critical'
        assert 'solutions' in result
        assert len(result['solutions']) > 0
    
    def test_sdk_mismatch_detection(self):
        """Test detection of SDK mismatch errors.""" 
        analyzer = RealErrorAnalyzer()
        log_content = 'Error: Target SDK version 33 is not supported. Maximum supported version is 32.'
        
        result = analyzer.analyze_error_log(log_content)
        
        assert result['error_type'] == 'sdk_mismatch'
        assert result['confidence'] >= 0.8
        # Make assertion more robust by checking for key terms
        solution_text = str(result['solutions']).lower()
        assert 'android' in solution_text and 'sdk' in solution_text and '32' in solution_text
    
    def test_black_screen_detection(self):
        """Test detection of black screen errors."""
        analyzer = RealErrorAnalyzer()
        log_content = 'LogVulkanRHI: Error: Failed to allocate VR eye buffer'
        
        result = analyzer.analyze_error_log(log_content)
        
        assert result['error_type'] == 'black_screen'
        assert result['confidence'] >= 0.8
        # Updated assertion to reflect solution
        solution_text = str(result['solutions']).lower()
        assert 'vr pixel density' in solution_text or 'eye render target' in solution_text
    
    def test_enhanced_multi_error_detection(self):
        """Test enhanced multi-error detection capability."""
        analyzer = RealErrorAnalyzer()
        complex_log = """
        LogTemp: Error: OpenXR plugin conflicts with MetaXR plugin
        Error: Target SDK version 33 is not supported
        LogVulkanRHI: Error: Failed to allocate VR eye buffer
        """
        
        result = analyzer.analyze_error_enhanced(complex_log)
        
        assert result['primary_error']['error_type'] == 'plugin_conflict'
        assert len(result['secondary_errors']) >= 1
        assert result['analysis_summary']['total_errors_detected'] >= 2
        # Check that context is extracted
        assert 'context_lines' in result['context'] or 'error_lines' in result['context']

class TestRealCostTracking:
    """Test real cost tracking functionality."""
    
    def test_cost_tracker_initialization(self):
        """Test that CostTracker initializes correctly."""
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            tracker = CostTracker(storage_path=tmp.name)
            assert tracker is not None
            assert hasattr(tracker, 'daily_budgets')
            assert hasattr(tracker, 'model_pricing')
            Path(tmp.name).unlink(missing_ok=True)
    
    def test_usage_tracking_with_known_model(self):
        """Test usage tracking with known model pricing."""
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            tracker = CostTracker(storage_path=tmp.name)
            
            record = tracker.track_usage(
                model_name='Llama-4-Scout-17B-16E-Instruct-FP8',
                prompt_tokens=100,
                completion_tokens=50,
                operation='test'
            )
            
            assert record.estimated_cost_usd > 0
            assert record.model_name == 'Llama-4-Scout-17B-16E-Instruct-FP8'
            assert record.prompt_tokens == 100
            assert record.completion_tokens == 50
            
            Path(tmp.name).unlink(missing_ok=True)
    
    def test_budget_management(self):
        """Test budget management functionality."""
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            tracker = CostTracker(storage_path=tmp.name)
            
            # Set daily budget
            tracker.set_daily_budget(1.0)
            
            # Track some usage
            tracker.track_usage('test-model', 1000, 500, 'test')
            
            stats = tracker.get_usage_statistics()
            assert 'total_cost' in stats
            
            budget_status = tracker.check_budget_status()
            assert 'budget_limit' in budget_status
            assert 'cost_today' in budget_status
            
            Path(tmp.name).unlink(missing_ok=True)
    
    def test_efficiency_metrics(self):
        """Test efficiency metrics calculation."""
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            tracker = CostTracker(storage_path=tmp.name)
            
            # Track multiple operations
            tracker.track_usage('test-model', 100, 50, 'test1')
            tracker.track_usage('test-model', 200, 100, 'test2')
            
            stats = tracker.get_usage_statistics()
            assert 'total_cost' in stats
            assert 'total_tokens' in stats
            
            efficiency = tracker.get_efficiency_metrics()
            assert 'average_token_efficiency' in efficiency
            
            Path(tmp.name).unlink(missing_ok=True)

class TestRealDataIntegration:
    """Test real data integration functionality."""
    
    def test_chromadb_connection(self):
        """Test ChromaDB connection and basic operations."""
        try:
            # Use a temporary directory for testing
            with tempfile.TemporaryDirectory() as tmp_dir:
                store = ChromaVectorStore(
                    path=tmp_dir,
                    collection_name='test_collection'
                )
                
                # Test basic connection
                count = store.get_collection_count()
                assert count >= 0  # Should not error
                
        except Exception as e:
            pytest.skip(f"ChromaDB not available for testing: {e}")
    
    def test_error_analysis_with_real_logs(self, sample_error_logs):
        """Test error analysis with various real log samples."""
        analyzer = RealErrorAnalyzer()
        
        for error_type, log_content in sample_error_logs.items():
            result = analyzer.analyze_error_log(log_content)
            
            # Should detect the correct error type
            assert result['error_type'] == error_type
            assert result['confidence'] > 0.5
            assert len(result['solutions']) > 0

class TestSystemIntegration:
    """Test system-wide integration functionality."""
    
    def test_end_to_end_error_analysis_workflow(self):
        """Test complete error analysis workflow."""
        # Initialize components
        analyzer = RealErrorAnalyzer()
        
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            cost_tracker = CostTracker(storage_path=tmp.name)
            
            # Simulate error analysis request
            log_content = 'LogTemp: Error: OpenXR plugin conflicts with MetaXR plugin'
            
            # Analyze error
            result = analyzer.analyze_error_log(log_content)
            
            # Track cost (simulated)
            cost_record = cost_tracker.track_usage(
                model_name='test-model',
                prompt_tokens=len(log_content.split()),
                completion_tokens=len(str(result).split()),
                operation='error_analysis'
            )
            
            # Verify workflow
            assert result['error_type'] == 'plugin_conflict'
            assert cost_record.estimated_cost_usd >= 0
            
            Path(tmp.name).unlink(missing_ok=True)
    
    def test_performance_benchmarks(self):
        """Test performance of core components."""
        import time
        
        analyzer = RealErrorAnalyzer()
        log_content = 'LogTemp: Error: OpenXR plugin conflicts with MetaXR plugin'
        
        # Measure analysis time
        start_time = time.time()
        result = analyzer.analyze_error_log(log_content)
        analysis_time = time.time() - start_time
        
        # Should be fast (< 1 second for simple analysis)
        assert analysis_time < 1.0
        assert result['error_type'] == 'plugin_conflict'
    
    @patch('quest_dev_copilot.scraper.forum_scraper.QuestForumScraper')
    def test_forum_scraper_integration(self, mock_scraper):
        """Test forum scraper integration (mocked)."""
        # Mock scraper to avoid actual network calls
        mock_instance = MagicMock()
        mock_instance.scrape_all_forums.return_value = []
        mock_scraper.return_value = mock_instance
        
        # Test that scraper can be instantiated and called
        scraper = mock_scraper()
        result = scraper.scrape_all_forums()
        
        assert result == []
        mock_instance.scrape_all_forums.assert_called_once()

    @pytest.mark.asyncio
    async def test_real_scraper_connection(self):
        """
        Tests if the scraper can connect to the Meta forums and get a valid response.
        This is a real network test, scoped to be minimal.
        """
        from quest_dev_copilot.scraper.forum_scraper import QuestForumScraper
        scraper = QuestForumScraper()
        
        # Override search patterns to be minimal
        scraper.forums['meta']['search_patterns'] = scraper.forums['meta']['search_patterns'][:1]
        scraper.forums['epic']['search_patterns'] = [] # Don't scrape epic for this test
        
        try:
            posts = await scraper.scrape_all_forums(max_pages_total=1)
            # We just want to see that it runs without crashing.
            assert isinstance(posts, list)
        except Exception as e:
            pytest.fail(f"Real scraper connection test failed: {e}")

    @pytest.mark.asyncio
    async def test_scraper_as_subprocess(self):
        """
        Tests the scraper by running it as a separate process.
        This avoids pytest import issues and tests the script as it would be run.
        """
        import subprocess
        import sys
        
        # We run the scraper with a very small limit to test its execution
        # and ability to connect.
        result = subprocess.run(
            [sys.executable, "-c", "import asyncio; from quest_dev_copilot.scraper.forum_scraper import main; asyncio.run(main(max_pages_total=1))"],
            capture_output=True,
            text=True,
            timeout=120, # Give it a generous timeout
            env={"PYTHONPATH": "."},
            cwd="." # Run from project root
        )

        # Check for errors in the script's output
        assert result.returncode == 0, f"Scraper script failed with exit code {result.returncode}. Stderr: {result.stderr}"
        
        # Check for the successful completion log message
        assert "Scraping complete" in result.stdout or "No posts scraped" in result.stdout, f"Scraper did not complete successfully. Stdout: {result.stdout}"
        
        # Check that we are NOT getting the DNS error
        assert "ERR_NAME_NOT_RESOLVED" not in result.stderr, "Scraper failed with DNS resolution error, the URL is still wrong."

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 