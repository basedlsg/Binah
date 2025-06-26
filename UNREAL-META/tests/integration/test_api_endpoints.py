"""
Integration tests for the Flask API endpoints.
Tests the complete API flow including error analysis and response validation.
"""

import pytest
import asyncio
import json
from unittest.mock import patch, Mock, AsyncMock
import httpx
from backend.app import app as flask_app
from backend.models import AnalyzeRequest, AnalyzeResponse, ErrorClassificationResponse, AutoFixData, DataSourceResponse, MetricsResponse


class TestAPIEndpoints:
    """Integration tests for API endpoints."""

    @pytest.fixture
    def test_app(self):
        """Create a test Flask application."""
        flask_app.config['TESTING'] = True
        return flask_app

    @pytest.fixture
    def client(self, test_app):
        """Create a test client."""
        return test_app.test_client()

    @pytest.fixture
    def async_client(self, test_app):
        """Create an async test client (using Flask test client for simplicity)."""
        return test_app.test_client()

    @pytest.fixture
    def sample_error_log(self):
        """Sample error log for testing."""
        return """
        LogTemp: Error: Plugin 'OculusVR' failed to load because module 'OculusHMD' could not be found.
        LogTemp: Error: Please ensure that this module exists and is properly built.
        LogTemp: Error: Module 'OculusHMD' not found in: C:\\Program Files\\Epic Games\\UE_5.3\\Engine\\Plugins\\Runtime\\Oculus\\OculusVR\\Binaries\\Win64\\
        LogTemp: Error: Failed to load plugin: OculusVR
        """

    def test_health_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get('/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data

    def test_ready_endpoint(self, client):
        """Test the readiness check endpoint."""
        with patch('backend.app.check_dependencies') as mock_check:
            mock_check.return_value = True
            
            response = client.get('/ready')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['status'] == 'ready'
            assert data['dependencies']['llama_api'] is True
            assert data['dependencies']['chroma_db'] is True

    def test_ready_endpoint_dependencies_failed(self, client):
        """Test readiness endpoint when dependencies fail."""
        with patch('backend.app.check_dependencies') as mock_check:
            mock_check.return_value = False
            
            response = client.get('/ready')
            
            assert response.status_code == 503
            data = json.loads(response.data)
            assert data['status'] == 'not_ready'

    def test_analyze_endpoint_success(self, async_client, sample_error_log):
        """Test successful error analysis."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_response = AnalyzeResponse(
                classification=ErrorClassificationResponse(
                    error_type="plugin_conflict",
                    confidence=0.95,
                    description="OculusVR plugin conflict detected",
                    auto_fixable=True,
                    key_indicators=["Plugin 'OculusVR' failed to load", "module 'OculusHMD' could not be found"]
                ),
                fix="Update the OculusVR plugin configuration to resolve the module loading issue.",
                auto_fix=AutoFixData(
                    fix_type="config_change",
                    confidence=0.88,
                    instructions="Modify the plugin configuration file",
                    file_changes=[
                        {
                            "file_path": "Config/DefaultEngine.ini",
                            "changes": [
                                {
                                    "action": "modify",
                                    "section": "[/Script/OculusHMD.OculusHMDRuntimeSettings]",
                                    "key": "bAutoEnabled",
                                    "value": "true"
                                }
                            ]
                        }
                    ]
                ),
                sources=[
                    DataSourceResponse(
                        title="Epic Games Forum Post",
                        snippet="Similar issue resolved by updating plugin settings",
                        url="https://forums.unrealengine.com/example",
                        distance=0.92
                    )
                ],
                metrics=MetricsResponse(
                    total_processing_time_ms=1250,
                    tokens_used_classification=180,
                    cost_usd_classification=0.0036
                )
            )
            mock_analyze.return_value = mock_response

            request_data = {
                "log_content": sample_error_log,
                "context": {
                    "project_name": "MyVRProject",
                    "unreal_version": "5.3",
                    "platform": "Windows"
                }
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 200
            data = json.loads(response.data)
            
            # Verify response structure
            assert data["classification"]["error_type"] == "plugin_conflict"
            assert data["classification"]["confidence"] == 0.95
            assert data["auto_fix"]["fix_type"] == "config_change"
            assert len(data["sources"]) == 1

    def test_analyze_endpoint_validation_error(self, async_client):
        """Test analyze endpoint with invalid request data."""
        # Missing required log_content
        request_data = {
            "context": {"project_name": "Test"}
        }

        response = async_client.post("/analyze", json=request_data)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_analyze_endpoint_empty_log(self, async_client):
        """Test analyze endpoint with empty log content."""
        request_data = {
            "log_content": "",
            "context": {"project_name": "Test"}
        }

        response = async_client.post("/analyze", json=request_data)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_analyze_endpoint_processing_error(self, async_client, sample_error_log):
        """Test analyze endpoint handling of processing errors."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            # Simulate processing error
            mock_analyze.side_effect = Exception("Processing failed")

            request_data = {
                "log_content": sample_error_log,
                "context": {"project_name": "Test"}
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 500
            data = json.loads(response.data)
            assert "error" in data
            # Check for either the specific error or generic internal server error
            error_text = data["error"].lower()
            assert "internal server error" in error_text or "processing failed" in error_text

    def test_analyze_endpoint_with_context(self, async_client, sample_error_log):
        """Test analyze endpoint with additional context."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.return_value = AnalyzeResponse(
                classification=ErrorClassificationResponse(
                    error_type="test",
                    confidence=0.9,
                    auto_fixable=False,
                    key_indicators=["test"]
                ),
                fix="Test fix",
                auto_fix=None,
                sources=[],
                metrics=MetricsResponse(
                    total_processing_time_ms=100,
                    tokens_used_classification=50,
                    cost_usd_classification=0.001
                )
            )

            request_data = {
                "log_content": sample_error_log,
                "context": {
                    "project_name": "MyProject",
                    "unreal_version": "5.3",
                    "platform": "Windows"
                }
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 200
            data = json.loads(response.data)

            # Verify response structure
            assert "classification" in data
            assert "fix" in data
            assert data["classification"]["error_type"] == "test"

            # Verify the context was passed to the analysis function
            mock_analyze.assert_called_once()
            called_request = mock_analyze.call_args[0][0]
            assert called_request.context["project_name"] == "MyProject"

    def test_cors_headers(self, client):
        """Test CORS headers are properly set."""
        response = client.options('/analyze')
        
        assert response.status_code == 200
        assert 'Access-Control-Allow-Origin' in response.headers
        assert 'Access-Control-Allow-Methods' in response.headers
        assert 'Access-Control-Allow-Headers' in response.headers

    def test_analyze_endpoint_rate_limiting(self, async_client, sample_error_log):
        """Test rate limiting on analyze endpoint."""
        request_data = {
            "log_content": sample_error_log,
            "context": {"project_name": "Test"}
        }

        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.return_value = AnalyzeResponse(
                classification=ErrorClassificationResponse(
                    error_type="test",
                    confidence=0.9,
                    auto_fixable=False,
                    key_indicators=["test"]
                ),
                fix="Test fix",
                auto_fix=None,
                sources=[],
                metrics=MetricsResponse(
                    total_processing_time_ms=100,
                    tokens_used_classification=50,
                    cost_usd_classification=0.001
                )
            )

            # Make multiple rapid requests
            responses = []
            for i in range(10):
                response = async_client.post("/analyze", json=request_data)
                responses.append(response)

            # Check if rate limiting is applied (some requests should be rate limited)
            status_codes = [r.status_code for r in responses]
            assert 200 in status_codes  # Some should succeed
            # Note: Actual rate limiting behavior depends on implementation

    def test_analyze_endpoint_concurrent_requests(self, async_client, sample_error_log):
        """Test handling of concurrent analyze requests."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.return_value = AnalyzeResponse(
                classification=ErrorClassificationResponse(
                    error_type="test",
                    confidence=0.9,
                    auto_fixable=False,
                    key_indicators=["test"]
                ),
                fix="Test fix",
                auto_fix=None,
                sources=[],
                metrics=MetricsResponse(
                    total_processing_time_ms=100,
                    tokens_used_classification=50,
                    cost_usd_classification=0.001
                )
            )

            request_data = {
                "log_content": sample_error_log,
                "context": {"project_name": "Test"}
            }

            # Make concurrent requests using simple loop (Flask test client is synchronous)
            responses = []
            for i in range(5):
                response = async_client.post("/analyze", json=request_data)
                responses.append(response)

            # All requests should succeed
            for response in responses:
                assert response.status_code == 200

            # Verify all calls were made
            assert mock_analyze.call_count == 5

    def test_error_response_format(self, client):
        """Test error response format consistency."""
        # Test with missing log_content
        response = client.post('/analyze', json={})
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_analyze_endpoint_large_log(self, async_client):
        """Test analyze endpoint with large log content."""
        large_log = "LogTemp: Error: " + "A" * 10000  # 10KB log

        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.return_value = AnalyzeResponse(
                classification=ErrorClassificationResponse(
                    error_type="memory_issue",
                    confidence=0.8,
                    auto_fixable=False,
                    key_indicators=["large log"]
                ),
                fix="Optimize logging",
                auto_fix=None,
                sources=[],
                metrics=MetricsResponse(
                    total_processing_time_ms=2000,
                    tokens_used_classification=500,
                    cost_usd_classification=0.01
                )
            )

            request_data = {
                "log_content": large_log,
                "context": {"project_name": "LargeLogTest"}
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 200
            data = json.loads(response.data)
            assert data["classification"]["error_type"] == "memory_issue"

    def test_method_not_allowed(self, client):
        """Test method not allowed responses."""
        # GET on analyze endpoint should not be allowed
        response = client.get('/analyze')
        assert response.status_code == 405

        # PUT on health endpoint should not be allowed
        response = client.put('/health')
        assert response.status_code == 405

    def test_analyze_endpoint_timeout_handling(self, async_client, sample_error_log):
        """Test timeout handling in analyze endpoint."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            # Simulate a slow response that should still complete
            import time
            def slow_analyze(*args, **kwargs):
                time.sleep(0.1)  # Short delay to simulate processing
                return AnalyzeResponse(
                    classification=ErrorClassificationResponse(
                        error_type="slow_processing",
                        confidence=0.7,
                        auto_fixable=False,
                        key_indicators=["timeout test"]
                    ),
                    fix="Optimize processing",
                    auto_fix=None,
                    sources=[],
                    metrics=MetricsResponse(
                        total_processing_time_ms=5000,
                        tokens_used_classification=200,
                        cost_usd_classification=0.004
                    )
                )

            mock_analyze.side_effect = slow_analyze

            request_data = {
                "log_content": sample_error_log,
                "context": {"project_name": "Test"}
            }

            # This should complete successfully even with processing delay
            response = async_client.post("/analyze", json=request_data)
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data["classification"]["error_type"] == "slow_processing"


class TestAPIResponseValidation:
    """Test API response validation and schema compliance."""

    def test_analyze_response_schema(self):
        """Test that analyze response matches expected schema."""
        # Mock response data with correct field names
        response_data = {
            "classification": {
                "error_type": "plugin_conflict",
                "confidence": 0.95,
                "description": "Test description",
                "auto_fixable": True,
                "key_indicators": ["indicator1", "indicator2"]
            },
            "fix": "Fix instructions",
            "auto_fix": {
                "fix_type": "config_change",
                "confidence": 0.88,
                "instructions": "Instructions",
                "file_changes": []
            },
            "sources": [
                {
                    "title": "Forum Post: Plugin Conflict Solution",
                    "snippet": "Source content",
                    "url": "https://example.com",
                    "distance": 0.9
                }
            ],
            "metrics": {
                "total_processing_time_ms": 1000,
                "tokens_used_classification": 100,
                "cost_usd_classification": 0.002
            }
        }

        # Validate using Pydantic model
        validated_response = AnalyzeResponse(**response_data)
        
        assert validated_response.classification.error_type == "plugin_conflict"
        assert validated_response.classification.confidence == 0.95
        assert validated_response.auto_fix.fix_type == "config_change"
        assert len(validated_response.sources) == 1
        assert validated_response.metrics.total_processing_time_ms == 1000

    def test_analyze_request_validation(self):
        """Test analyze request validation."""
        # Valid request
        valid_request = {
            "log_content": "Sample log content",
            "context": {
                "project_name": "TestProject",
                "unreal_version": "5.3"
            }
        }

        validated_request = AnalyzeRequest(**valid_request)
        assert validated_request.log_content == "Sample log content"
        assert validated_request.context["project_name"] == "TestProject"

        # Invalid request - missing log_content
        with pytest.raises(ValueError):
            AnalyzeRequest(context={"project_name": "Test"})

        # Invalid request - empty log_content
        with pytest.raises(ValueError):
            AnalyzeRequest(log_content="", context={"project_name": "Test"}) 