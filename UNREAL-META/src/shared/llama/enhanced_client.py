"""
Enhanced Llama Client with Training Data Integration
Uses the comprehensive training data to improve responses without fine-tuning API.
"""

import os
import json
import random
from typing import Dict, List, Optional, Any
import requests
import logging

logger = logging.getLogger(__name__)

class EnhancedLlamaClient:
    """Enhanced Llama client that uses training data to improve responses."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the enhanced client."""
        self.api_key = api_key or os.getenv("LLAMA_API_KEY")
        if not self.api_key:
            raise ValueError("LLAMA_API_KEY environment variable or api_key parameter required")
        
        self.base_url = "https://api.llama.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Load training data for context enhancement
        self.training_data = self._load_training_data()
        self.examples = self._extract_examples()
        
        logger.info(f"Loaded {len(self.examples)} training examples")
    
    def _load_training_data(self) -> List[Dict[str, Any]]:
        """Load the comprehensive training data."""
        try:
            dataset_path = "fine_tuned_models/comprehensive_training_data.jsonl"
            if not os.path.exists(dataset_path):
                logger.warning(f"Training data not found: {dataset_path}")
                return []
            
            data = []
            with open(dataset_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        data.append(json.loads(line))
            
            logger.info(f"Loaded {len(data)} training examples")
            return data
            
        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            return []
    
    def _extract_examples(self) -> List[Dict[str, str]]:
        """Extract examples from training data."""
        examples = []
        for item in self.training_data:
            if 'messages' in item:
                # Extract the conversation
                messages = item['messages']
                if len(messages) >= 2:
                    # Find user and assistant messages
                    user_msg = None
                    assistant_msg = None
                    
                    for msg in messages:
                        if msg.get('role') == 'user':
                            user_msg = msg.get('content', '')
                        elif msg.get('role') == 'assistant':
                            assistant_msg = msg.get('content', '')
                    
                    if user_msg and assistant_msg:
                        examples.append({
                            'user': user_msg,
                            'assistant': assistant_msg
                        })
        
        return examples
    
    def _find_relevant_examples(self, user_input: str, max_examples: int = 3) -> List[str]:
        """Find relevant examples from training data based on user input."""
        if not self.examples:
            return []
        
        # Simple keyword matching for relevance
        user_lower = user_input.lower()
        relevant_examples = []
        
        for example in self.examples:
            user_example = example['user'].lower()
            assistant_example = example['assistant']
            
            # Check for keyword matches
            keywords = ['error', 'vulkan', 'quest', 'vr', 'unreal', 'engine', 'buffer', 'allocation']
            matches = sum(1 for keyword in keywords if keyword in user_example and keyword in user_lower)
            
            if matches >= 2:  # At least 2 keyword matches
                relevant_examples.append(f"User: {example['user']}\nAssistant: {example['assistant']}")
        
        # Return top examples
        return relevant_examples[:max_examples]
    
    def _build_enhanced_prompt(self, user_input: str) -> str:
        """Build an enhanced prompt using relevant training examples."""
        relevant_examples = self._find_relevant_examples(user_input)
        
        system_prompt = """You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging. You have extensive knowledge of common Quest VR errors and their solutions.

Your expertise includes:
- Vulkan graphics errors and memory allocation issues
- Quest VR performance optimization
- Unreal Engine plugin conflicts
- VR rendering pipeline problems
- Quest-specific development challenges

When analyzing errors, provide:
1. Clear error classification
2. Root cause analysis
3. Step-by-step fix instructions
4. Prevention strategies
5. Related documentation links

Here are some relevant examples of how to handle Quest VR errors:"""

        if relevant_examples:
            examples_text = "\n\n".join(relevant_examples)
            enhanced_prompt = f"{system_prompt}\n\n{examples_text}\n\nNow, please analyze this error:\n{user_input}"
        else:
            enhanced_prompt = f"{system_prompt}\n\nPlease analyze this error:\n{user_input}"
        
        return enhanced_prompt
    
    def generate_response(self, user_input: str, max_tokens: int = 1000, temperature: float = 0.1) -> Dict[str, Any]:
        """
        Generate an enhanced response using training data context.
        
        Args:
            user_input: User's error or question
            max_tokens: Maximum tokens in response
            temperature: Response creativity (0.0-1.0)
            
        Returns:
            Response dictionary with content and metadata
        """
        try:
            # Build enhanced prompt
            enhanced_prompt = self._build_enhanced_prompt(user_input)
            
            # Prepare the request
            payload = {
                "model": "Llama-3.3-8B-Instruct",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."
                    },
                    {
                        "role": "user",
                        "content": enhanced_prompt
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            # Make the API call
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Handle different response formats
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
            elif "content" in result:
                content = result["content"]
            else:
                content = str(result)
            
            # Extract metadata
            usage = result.get("usage", {})
            metadata = {
                "model": result.get("model"),
                "tokens_used": usage.get("total_tokens", 0),
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "examples_used": len(self._find_relevant_examples(user_input)),
                "training_data_size": len(self.examples)
            }
            
            return {
                "success": True,
                "content": content,
                "metadata": metadata
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "Sorry, I encountered an error while processing your request."
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "Sorry, I encountered an unexpected error."
            }
    
    def analyze_error(self, error_log: str) -> Dict[str, Any]:
        """
        Analyze an error log with enhanced context.
        
        Args:
            error_log: The error log to analyze
            
        Returns:
            Analysis results with classification and fixes
        """
        prompt = f"""Please analyze this Unreal Engine Quest VR error log and provide a comprehensive analysis:

Error Log:
{error_log}

Please provide:
1. Error Classification (type and severity)
2. Root Cause Analysis
3. Step-by-step Fix Instructions
4. Prevention Strategies
5. Related Documentation Links

Format your response as a structured analysis."""

        return self.generate_response(prompt, max_tokens=1500, temperature=0.1)
    
    def generate_fix(self, error_description: str) -> Dict[str, Any]:
        """
        Generate a fix for a specific error.
        
        Args:
            error_description: Description of the error
            
        Returns:
            Fix instructions and code
        """
        prompt = f"""Generate a fix for this Quest VR error:

Error: {error_description}

Please provide:
1. Immediate fix steps
2. Code changes if needed
3. Configuration updates
4. Testing instructions
5. Rollback plan if needed

Format as step-by-step instructions with code blocks where appropriate."""

        return self.generate_response(prompt, max_tokens=1200, temperature=0.1)
    
    def get_training_stats(self) -> Dict[str, Any]:
        """Get statistics about the loaded training data."""
        return {
            "total_examples": len(self.examples),
            "training_data_loaded": len(self.training_data) > 0,
            "example_types": self._categorize_examples()
        }
    
    def _categorize_examples(self) -> Dict[str, int]:
        """Categorize examples by type."""
        categories = {
            "vulkan_errors": 0,
            "memory_errors": 0,
            "plugin_errors": 0,
            "performance_issues": 0,
            "general_quest": 0
        }
        
        for example in self.examples:
            user_text = example['user'].lower()
            
            if 'vulkan' in user_text:
                categories["vulkan_errors"] += 1
            elif 'memory' in user_text or 'buffer' in user_text or 'allocation' in user_text:
                categories["memory_errors"] += 1
            elif 'plugin' in user_text:
                categories["plugin_errors"] += 1
            elif 'performance' in user_text or 'fps' in user_text:
                categories["performance_issues"] += 1
            else:
                categories["general_quest"] += 1
        
        return categories

def main():
    """Test the enhanced client."""
    try:
        client = EnhancedLlamaClient()
        
        # Test with a sample error
        test_error = "Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048"
        
        print("🧪 Testing Enhanced Llama Client")
        print("=" * 40)
        
        # Get training stats
        stats = client.get_training_stats()
        print(f"📊 Training Data Stats:")
        print(f"  - Total Examples: {stats['total_examples']}")
        print(f"  - Data Loaded: {stats['training_data_loaded']}")
        print(f"  - Categories: {stats['example_types']}")
        
        # Test error analysis
        print(f"\n🔍 Analyzing Error: {test_error}")
        result = client.analyze_error(test_error)
        
        if result["success"]:
            print("✅ Analysis successful!")
            print(f"📝 Content preview: {result['content'][:200]}...")
            print(f"📊 Metadata: {result['metadata']}")
        else:
            print(f"❌ Analysis failed: {result['error']}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main() 