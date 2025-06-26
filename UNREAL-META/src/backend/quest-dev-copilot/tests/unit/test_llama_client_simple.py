"""
Simplified unit tests for the Llama API client module.
Tests the actual available methods and functionality.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from llama.client import LlamaAPIClient, RateLimitError, LlamaAPIError
from llama.models import LlamaCompletionResponse


class TestLlamaAPIClient:
    """Test suite for LlamaAPIClient."""

    @pytest.fixture
    def client(self):
        """Create a test client with mock configuration."""
        return LlamaAPIClient(
            api_key="test_key",
            base_url="https://api.test.com",
            default_model="test-model"
        )

    @pytest.fixture
    def mock_llama_response(self):
        """Mock Llama API response data."""
        return {
            "id": "cmpl-test123",
            "object": "text_completion",
            "created": 1677652288,
            "model": "test-model",
            "choices": [
                {
                    "text": "Generated response text",
                    "index": 0,
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": 50,
                "total_tokens": 150
            }
        }

    @pytest.mark.asyncio
    async def test_generate_success(self, client, mock_llama_response):
        """Test successful text generation."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = mock_llama_response
            mock_response.raise_for_status = Mock()
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await client.generate("Test prompt")

            assert result is not None
            assert hasattr(result, 'choices')
            assert result.model == "test-model"
            assert len(result.choices) == 1
            assert result.choices[0].text == "Generated response text"

    @pytest.mark.asyncio
    async def test_generate_with_parameters(self, client, mock_llama_response):
        """Test text generation with custom parameters."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = mock_llama_response
            mock_response.raise_for_status = Mock()
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await client.generate(
                prompt="Test prompt",
                max_tokens=500,
                temperature=0.7,
                model="custom-model"
            )

            # Verify the request was made with correct parameters
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            payload = call_args[1]['json']
            
            assert payload['prompt'] == "Test prompt"
            assert payload['max_tokens'] == 500
            assert payload['temperature'] == 0.7
            assert payload['model'] == "custom-model"

    @pytest.mark.asyncio
    async def test_generate_retry_on_rate_limit(self, client, mock_llama_response):
        """Test retry logic on rate limit errors."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            # First call returns rate limit, second succeeds
            mock_response_fail = AsyncMock()
            mock_response_fail.status = 429
            mock_response_fail.json.return_value = {"error": "Rate limit exceeded"}

            mock_response_success = AsyncMock()
            mock_response_success.status = 200
            mock_response_success.json.return_value = mock_llama_response
            mock_response_success.raise_for_status = Mock()

            mock_post.return_value.__aenter__.side_effect = [
                mock_response_fail,
                mock_response_success
            ]

            with patch('asyncio.sleep'):  # Speed up test
                result = await client.generate("Test prompt")

            assert result is not None
            assert mock_post.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_max_retries_exceeded(self, client):
        """Test behavior when max retries are exceeded."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 500
            mock_response.json.return_value = {"error": "Server error"}
            mock_response.raise_for_status = Mock(side_effect=Exception("Server error"))
            mock_post.return_value.__aenter__.return_value = mock_response

            with patch('asyncio.sleep'):  # Speed up test
                result = await client.generate("Test prompt", max_retries=2)

            # Should return None after max retries
            assert result is None
            assert mock_post.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_invalid_api_key(self):
        """Test behavior with invalid API key."""
        with pytest.raises(ValueError, match="Llama API key is required"):
            LlamaAPIClient(api_key="", base_url="https://api.test.com")

    @pytest.mark.asyncio
    async def test_generate_invalid_base_url(self):
        """Test behavior with invalid base URL."""
        with pytest.raises(ValueError, match="Llama API base URL is required"):
            LlamaAPIClient(api_key="test_key", base_url="")

    @pytest.mark.asyncio
    async def test_session_management(self, client):
        """Test session creation and cleanup."""
        # Session should be None initially
        assert client._session is None

        # Get session should create one
        session = await client._get_session()
        assert session is not None
        assert client._session is session

        # Getting session again should return the same one
        session2 = await client._get_session()
        assert session2 is session

        # Close session should clean up
        await client.close_session()
        assert client._session is None

    @pytest.mark.asyncio
    async def test_context_manager(self, client):
        """Test client as async context manager."""
        async with client as ctx_client:
            assert ctx_client is client
            # Session should be created
            session = await ctx_client._get_session()
            assert session is not None

        # Session should be closed after context exit
        assert client._session is None

    @pytest.mark.asyncio
    async def test_cost_tracking_integration(self, client, mock_llama_response):
        """Test that cost tracking is called on successful requests."""
        with patch('aiohttp.ClientSession.post') as mock_post, \
             patch('llama.client.track_llama_usage') as mock_track:
            
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = mock_llama_response
            mock_response.raise_for_status = Mock()
            mock_post.return_value.__aenter__.return_value = mock_response

            await client.generate("Test prompt")

            # Verify cost tracking was called
            mock_track.assert_called_once()
            call_args = mock_track.call_args[1]
            assert call_args['model_name'] == "test-model"
            assert call_args['prompt_tokens'] == 100
            assert call_args['completion_tokens'] == 50
            assert call_args['total_tokens'] == 150

    @pytest.mark.asyncio
    async def test_malformed_response_handling(self, client):
        """Test handling of malformed API responses."""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = {"invalid": "response"}
            mock_response.raise_for_status = Mock()
            mock_post.return_value.__aenter__.return_value = mock_response

            # Should return raw response if parsing fails
            result = await client.generate("Test prompt")
            
            assert result == {"invalid": "response"}

    def test_client_initialization(self):
        """Test client initialization with various parameters."""
        client = LlamaAPIClient(
            api_key="test_key",
            base_url="https://custom.api.com",
            default_model="custom-model"
        )

        assert client.api_key == "test_key"
        assert client.base_url == "https://custom.api.com"
        assert client.default_model == "custom-model" 