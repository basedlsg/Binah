import os
import asyncio
import aiohttp
import json
import structlog
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
# Assuming .env is in the project root, two levels up from this file (quest-dev-copilot/.env)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env') 
load_dotenv(dotenv_path=dotenv_path)

logger = structlog.get_logger(__name__)

LLAMA_API_KEY = os.getenv('LLAMA_API_KEY')
LLAMA_API_BASE_URL = os.getenv('LLAMA_API_BASE_URL', 'YOUR_LLAMA_API_BASE_URL_HERE') # e.g., https://api.llama-provider.com/v1

if not LLAMA_API_KEY:
    logger.warning("LLAMA_API_KEY not found in environment. LlamaAPIClient will not function.")
if LLAMA_API_BASE_URL == 'YOUR_LLAMA_API_BASE_URL_HERE':
    logger.warning("LLAMA_API_BASE_URL is not set. Please configure it in your .env file.")

# Properly import from .cost_tracker
from .cost_tracker import track_llama_usage
from .models import LlamaCompletionResponse # For potentially parsing response before tracking

# Placeholder for Llama API custom exceptions
class RateLimitError(Exception):
    "Custom exception for Llama API rate limiting."
    pass

class LlamaAPIError(Exception):
    "Custom exception for other Llama API errors."
    pass

class LlamaAPIClient:
    """
    Asynchronous client for interacting with the Llama API.
    Handles API calls, error handling, and retries.
    """
    def __init__(self, api_key: Optional[str] = LLAMA_API_KEY, base_url: str = LLAMA_API_BASE_URL, default_model: str = "Llama-4-Scout-17B-16E-Instruct-FP8"):
        if not api_key:
            raise ValueError("Llama API key is required.")
        if not base_url or base_url == 'YOUR_LLAMA_API_BASE_URL_HERE':
             raise ValueError("Llama API base URL is required.")
             
        self.api_key = api_key
        self.base_url = base_url
        self.default_model = default_model
        self._session: Optional[aiohttp.ClientSession] = None
        logger.info("LlamaAPIClient initialized", base_url=self.base_url, default_model=self.default_model)

    async def _get_session(self) -> aiohttp.ClientSession:
        """Initializes and returns an aiohttp.ClientSession."""
        if self._session is None or self._session.closed:
            # Common headers for Llama API. Adjust if needed based on actual API docs.
            headers = {
                "Authorization": f"Bearer {self.api_key}", # Common authentication method
                "Content-Type": "application/json"
            }
            self._session = aiohttp.ClientSession(headers=headers)
            logger.info("aiohttp.ClientSession created for LlamaAPIClient")
        return self._session

    async def close_session(self):
        """Closes the aiohttp.ClientSession."""
        if self._session and not self._session.closed:
            await self._session.close()
            logger.info("aiohttp.ClientSession closed for LlamaAPIClient")
            self._session = None

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.2,
        # Add other Llama API specific parameters as needed (e.g., top_p, stop_sequences)
        max_retries: int = 3
    ) -> Optional[Dict[str, Any]]: # Returning the full JSON response for flexibility
        """
        Makes a call to the Llama API to generate text based on a prompt.
        Implements retry logic with exponential backoff for rate limits and other errors.

        Args:
            prompt: The input prompt for the Llama model.
            model: The specific Llama model to use (e.g., 'Llama-4-Scout-17B-16E-Instruct-FP8'). Defaults to client's default_model.
            max_tokens: Maximum number of tokens to generate.
            temperature: Sampling temperature.
            max_retries: Maximum number of retries for the API call.

        Returns:
            A dictionary containing the Llama API response (e.g., generated text, token usage), or None on failure.
        """
        if not LLAMA_API_KEY:
            logger.error("Llama API key not set. Cannot make API call.")
            return None
        if self.base_url == 'YOUR_LLAMA_API_BASE_URL_HERE':
            logger.error("Llama API base URL not configured. Cannot make API call.")
            return None

        current_model = model if model else self.default_model
        # This is a common endpoint structure for LLMs, adjust if Llama API is different
        # e.g. /completions, /chat/completions, /generate
        endpoint = f"{self.base_url}/generate" # Example endpoint
        
        # Common payload structure. This will vary greatly based on the actual Llama API.
        payload = {
            "model": current_model,
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
            # "stream": False, # if streaming is an option
        }

        session = await self._get_session()
        last_exception = None

        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting Llama API call (attempt {attempt + 1}/{max_retries})", model=current_model, endpoint=endpoint)
                async with session.post(endpoint, json=payload) as response:
                    response_data = await response.json()

                    if response.status == 429: # Too Many Requests - Rate Limit
                        logger.warning(f"Rate limit hit for Llama API (attempt {attempt+1})", response_status=response.status, response_data=response_data)
                        raise RateLimitError(f"Llama API rate limit hit: {response_data}")
                    
                    response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
                    
                    # Attempt to parse into Pydantic model to structure access to usage fields
                    # This also validates the response structure to some extent.
                    try:
                        # We expect response_data to be a dict here
                        parsed_response = LlamaCompletionResponse.model_validate(response_data)
                        parsed_response.raw_response = response_data # Store raw for full access if needed
                        
                        prompt_tokens = 0
                        completion_tokens = 0
                        total_tokens_from_api = 0

                        if parsed_response.usage:
                            prompt_tokens = parsed_response.usage.prompt_tokens or 0
                            completion_tokens = parsed_response.usage.completion_tokens or 0
                            total_tokens_from_api = parsed_response.usage.total_tokens
                        else:
                            # Fallback if usage block is not as expected or missing
                            # This is a guess; actual Llama API might not provide this breakdown
                            # or might have it in a different part of the response.
                            total_tokens_from_api = response_data.get('usage', {}).get('total_tokens', 0)
                            # If only total_tokens is available, we can't split accurately for cost_tracker
                            # unless we make assumptions (e.g., completion_tokens = total_tokens - prompt_tokens_estimated_by_client)
                            # For now, if no breakdown, prompt and completion tokens will be 0 for cost tracker
                            logger.warning("Llama API response missing detailed token usage. Cost tracking might be less accurate.", api_response_usage=response_data.get('usage'))
                        
                        # Call the actual cost tracker
                        await track_llama_usage(
                            model_name=current_model,
                            prompt_tokens=prompt_tokens,
                            completion_tokens=completion_tokens,
                            total_tokens=total_tokens_from_api,
                            operation="general_generation" # Or be more specific if possible
                        )
                        logger.info("Llama API call successful and usage tracked", model=current_model, total_tokens=total_tokens_from_api)
                        return parsed_response # Return the parsed Pydantic model
                    except Exception as pydantic_error: # Catch pydantic.ValidationError or other issues
                        logger.error("Failed to parse Llama API response or track usage", error=str(pydantic_error), raw_response=response_data, exc_info=True)
                        # Return raw response if parsing failed but call was otherwise successful (status 2xx)
                        return response_data

            except RateLimitError as e:
                last_exception = e
                if attempt < max_retries - 1:
                    sleep_time = 2 ** attempt
                    logger.info(f"Rate limit active. Retrying in {sleep_time} seconds...")
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error(f"Max retries reached for Llama API due to rate limiting.", model=current_model, error=str(e))
                    break # Max retries exceeded
            except aiohttp.ClientResponseError as e: # Handles 4xx/5xx errors not caught by RateLimitError
                last_exception = e
                logger.error(f"Llama API HTTP error (attempt {attempt+1})", model=current_model, status_code=e.status, message=e.message, error=str(e), exc_info=True)
                # For some client errors (e.g. 400 Bad Request), retrying might not help.
                # Could add more specific error handling here.
                if attempt < max_retries - 1 and e.status not in [400, 401, 403]: # Don't retry on auth/bad request errors
                    sleep_time = 2 ** attempt
                    logger.info(f"Retrying Llama API call in {sleep_time} seconds due to HTTP error {e.status}...")
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error(f"Max retries reached or non-retryable HTTP error for Llama API.", model=current_model, error=str(e))
                    break
            except Exception as e:
                last_exception = e
                logger.error(f"Generic error during Llama API call (attempt {attempt+1})", model=current_model, error=str(e), exc_info=True)
                if attempt < max_retries - 1:
                    sleep_time = 2 ** attempt
                    logger.info(f"Retrying Llama API call in {sleep_time} seconds due to generic error...")
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error(f"Max retries reached for Llama API due to generic error.", model=current_model, error=str(e))
                    break
        
        # If loop finishes without returning, an error occurred and max_retries were exhausted.
        # Optionally, raise last_exception here if you want the caller to handle it explicitly.
        # raise LlamaAPIError(f"Failed to call Llama API after {max_retries} attempts: {last_exception}") from last_exception
        return None

    async def __aenter__(self):
        await self._get_session() # Ensure session is created when entering context
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close_session() # Ensure session is closed when exiting context

# Example Usage:
async def example_llama_call():
    if not LLAMA_API_KEY or LLAMA_API_BASE_URL == 'YOUR_LLAMA_API_BASE_URL_HERE':
        print("Please set LLAMA_API_KEY and LLAMA_API_BASE_URL in your .env file (project root) to run this example.")
        print(f"Current .env path being checked: {os.path.abspath(dotenv_path)}")
        return

    client = LlamaAPIClient()
    try:
        prompt_text = "Explain the concept of Retrieval-Augmented Generation (RAG) in simple terms."
        response = await client.generate(
            prompt=prompt_text,
            model="Llama-4-Scout-17B-16E-Instruct-FP8", # Example model from guidelines
            max_tokens=150
        )

        if response:
            print("\nLlama API Response:")
            # Assuming the response has a structure like {"choices": [{"text": "..."}]} or similar
            # This is a common OpenAI-like structure; Llama API might differ.
            # If `response` is now a LlamaCompletionResponse object:
            if isinstance(response, LlamaCompletionResponse):
                generated_text = response.get_first_choice_text() or "No text found."
                print(f"Generated Text: {generated_text}")
                print(f"Model: {response.model}")
                if response.usage:
                    print(f"Tokens: {response.usage.total_tokens} (P:{response.usage.prompt_tokens}, C:{response.usage.completion_tokens})")
                # Print the raw dict if needed for full details
                # print(f"Full Parsed Response (dict): {response.model_dump_json(indent=2)}")
            else: # If it returned raw dict due to parsing error
                generated_text = response.get('choices', [{}])[0].get('text', 'No text found in raw response')
                print(f"Generated Text (from raw): {generated_text}")
                print(f"Full Raw Response: {json.dumps(response, indent=2)}")
        else:
            print("\nFailed to get a response from Llama API after multiple retries.")
    
    except ValueError as ve:
        print(f"Configuration Error: {ve}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        await client.close_session()

if __name__ == '__main__':
    # Ensure .env is loaded from project root (quest-dev-copilot/.env)
    # The dotenv_path logic at the top of the file tries to do this.
    asyncio.run(example_llama_call()) 