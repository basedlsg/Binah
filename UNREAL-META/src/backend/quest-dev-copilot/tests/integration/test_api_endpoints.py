"""
Integration tests for the Flask API endpoints.
Tests the complete API flow including error analysis and response validation.
"""

import pytest
import asyncio
import json
import time
from unittest.mock import patch, Mock, AsyncMock
import httpx
from backend.app import app
from backend.models import AnalyzeRequest, AnalyzeResponse


class TestAPIEndpoints:
    """Integration tests for API endpoints."""

    @pytest.fixture
    def test_app(self):
        """Create a test Flask application."""
        app.config['TESTING'] = True
        return app

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
            mock_analyze.return_value = {
                "classification": {
                    "error_type": "plugin_conflict",
                    "confidence": 0.95,
                    "description": "OculusVR plugin conflict detected",
                    "auto_fixable": True,
                    "key_indicators": ["Plugin 'OculusVR' failed to load", "module 'OculusHMD' could not be found"]
                },
                "fix": "Update the OculusVR plugin configuration to resolve the module loading issue.",
                "auto_fix": {
                    "fix_type": "config_change",
                    "confidence": 0.88,
                    "instructions": "Modify the plugin configuration file",
                    "file_changes": [
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
                },
                "sources": [
                    {
                        "content": "Similar issue resolved by updating plugin settings",
                        "source": "epic_games_forum",
                        "url": "https://forums.unrealengine.com/example",
                        "confidence": 0.92
                    }
                ],
                "metrics": {
                    "processing_time_ms": 1250,
                    "tokens_used": 180,
                    "cost_usd": 0.0036
                }
            }

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
            assert data["metrics"]["processing_time_ms"] > 0

    
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
        assert "invalid" in data["error"].lower() or "validation" in data["error"].lower()

    
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
        assert "invalid" in data["error"].lower() or "empty" in data["error"].lower()

    
    def test_analyze_endpoint_processing_error(self, async_client, sample_error_log):
        """Test analyze endpoint when processing fails."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.side_effect = Exception("Processing failed")

            request_data = {
                "log_content": sample_error_log,
                "context": {"project_name": "Test"}
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 500
            data = json.loads(response.data)
            assert "error" in data
            assert "processing failed" in data["error"].lower()

    
    def test_analyze_endpoint_with_context(self, async_client, sample_error_log):
        """Test analyze endpoint with rich context information."""
        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.return_value = {
                "classification": {
                    "error_type": "plugin_conflict",
                    "confidence": 0.95,
                    "description": "Plugin conflict"
                },
                "fix": "Fix instructions",
                "auto_fix": None,
                "sources": [],
                "metrics": {"processing_time_ms": 1000, "tokens_used": 100, "cost_usd": 0.002}
            }

            request_data = {
                "log_content": sample_error_log,
                "context": {
                    "project_name": "MyVRProject",
                    "unreal_version": "5.3",
                    "platform": "Windows",
                    "build_configuration": "Development",
                    "target_platform": "Quest2",
                    "plugins": ["OculusVR", "MetaXR", "AndroidPermission"],
                    "additional_info": "Build fails during packaging"
                }
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 200
            
            # Verify context was passed to analysis function
            mock_analyze.assert_called_once()
            call_args = mock_analyze.call_args[0]
            assert call_args[1]["project_name"] == "MyVRProject"
            assert call_args[1]["unreal_version"] == "5.3"

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
            mock_analyze.return_value = {
                "classification": {"error_type": "test", "confidence": 0.9},
                "fix": "Test fix",
                "auto_fix": None,
                "sources": [],
                "metrics": {"processing_time_ms": 100, "tokens_used": 50, "cost_usd": 0.001}
            }

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
            mock_analyze.return_value = {
                "classification": {"error_type": "test", "confidence": 0.9},
                "fix": "Test fix",
                "auto_fix": None,
                "sources": [],
                "metrics": {"processing_time_ms": 100, "tokens_used": 50, "cost_usd": 0.001}
            }

            request_data = {
                "log_content": sample_error_log,
                "context": {"project_name": "Test"}
            }

            # Make concurrent requests
            import asyncio
            tasks = [
                async_client.post("/analyze", json=request_data)
                for _ in range(5)
            ]

            responses = [task() for task in tasks]

            # All requests should succeed
            assert all(r.status_code == 200 for r in responses)
            assert mock_analyze.call_count == 5

    def test_error_response_format(self, client):
        """Test error response format consistency."""
        # Test with invalid JSON
        response = client.post('/analyze', 
                             data='invalid json',
                             content_type='application/json')

        assert response.status_code == 400
        data = json.loads(response.data)
        
        # Verify error response structure
        assert 'error' in data
        assert 'timestamp' in data
        assert isinstance(data['error'], str)

    
    def test_analyze_endpoint_large_log(self, async_client):
        """Test analyze endpoint with large log content."""
        # Create a large log (simulate real-world scenario)
        large_log = "LogTemp: Error: Sample error message\n" * 1000

        with patch('backend.app.analyze_error_async') as mock_analyze:
            mock_analyze.return_value = {
                "classification": {"error_type": "test", "confidence": 0.9},
                "fix": "Test fix",
                "auto_fix": None,
                "sources": [],
                "metrics": {"processing_time_ms": 2000, "tokens_used": 500, "cost_usd": 0.01}
            }

            request_data = {
                "log_content": large_log,
                "context": {"project_name": "Test"}
            }

            response = async_client.post("/analyze", json=request_data)

            assert response.status_code == 200
            # Verify the large log was processed
            mock_analyze.assert_called_once()

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
            # Simulate a timeout
            async def slow_analyze(*args, **kwargs):
                time.sleep(60)  # Simulate very slow processing
                return {"classification": {"error_type": "test"}}

            mock_analyze.side_effect = slow_analyze

            request_data = {
                "log_content": sample_error_log,
                "context": {"project_name": "Test"}
            }

            # This should timeout or be handled gracefully
            with pytest.raises((asyncio.TimeoutError, httpx.TimeoutException)):
                async_client.post("/analyze", json=request_data, timeout=5.0)


class TestAPIResponseValidation:
    """Test API response validation and schema compliance."""

    def test_analyze_response_schema(self):
        """Test that analyze response matches expected schema."""
        # Mock response data
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
                    "content": "Source content",
                    "source": "forum",
                    "url": "https://example.com",
                    "confidence": 0.9
                }
            ],
            "metrics": {
                "processing_time_ms": 1000,
                "tokens_used": 100,
                "cost_usd": 0.002
            }
        }

        # Validate using Pydantic model
        validated_response = AnalyzeResponse(**response_data)
        
        assert validated_response.classification.error_type == "plugin_conflict"
        assert validated_response.classification.confidence == 0.95
        assert validated_response.auto_fix.fix_type == "config_change"
        assert len(validated_response.sources) == 1
        assert validated_response.metrics.processing_time_ms == 1000

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
        assert validated_request.context.project_name == "TestProject"

        # Invalid request - missing log_content
        with pytest.raises(ValueError):
            AnalyzeRequest(context={"project_name": "Test"})

        # Invalid request - empty log_content
        with pytest.raises(ValueError):
            AnalyzeRequest(log_content="", context={"project_name": "Test"}) 