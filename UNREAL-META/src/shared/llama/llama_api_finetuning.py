"""
Llama API Fine-tuning Client for Quest Dev Copilot

This implementation uses the actual Meta Llama API for fine-tuning models,
following the official documentation at:
https://llama.developer.meta.com/docs/features/fine-tuning/

This replaces the incorrect local training approach with proper API-based fine-tuning.
"""

import os
import json
import logging
import asyncio
import aiohttp
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class LlamaFineTuningConfig:
    """Configuration for Llama API fine-tuning"""
    base_model: str = "Llama-3.3-8B-Instruct"  # Currently available base model
    job_name: str = "quest-copilot-finetune"
    epochs: int = 3
    batch_size: int = 4
    learning_rate_multiplier: float = 1.0  # Multiplier for base learning rate (3e-4)
    split_data: bool = True  # Auto-split data for evaluation
    
@dataclass
class FineTuningJob:
    """Represents a fine-tuning job"""
    job_id: str
    job_name: str
    status: str
    base_model: str
    dataset_name: str
    created_at: str
    model_name: Optional[str] = None
    progress: float = 0.0
    loss: Optional[float] = None

class LlamaAPIFineTuningClient:
    """Client for Meta's Llama API fine-tuning service"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv('LLAMA_API_KEY')
        self.base_url = base_url or os.getenv('LLAMA_API_BASE_URL', 'https://api.llama-api.com/v1')
        
        if not self.api_key:
            raise ValueError("LLAMA_API_KEY environment variable or api_key parameter required")
        
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
    
    async def prepare_dataset_from_forum_data(self, forum_data_path: str, output_path: str) -> str:
        """
        Convert forum data to Llama API fine-tuning format
        
        Format according to documentation:
        {"messages": [
            {"role": "system", "content": "You are a Quest VR debugging assistant..."},
            {"role": "user", "content": "Error description..."},
            {"role": "assistant", "content": "Solution..."}
        ]}
        """
        logger.info(f"Converting forum data from {forum_data_path} to Llama API format")
        
        with open(forum_data_path, 'r', encoding='utf-8') as f:
            forum_data = json.load(f)
        
        training_examples = []
        system_message = """You are a Quest VR debugging assistant specialized in Unreal Engine development. 
        Analyze error logs and provide detailed solutions with error classification, confidence scores, and actionable fixes."""
        
        for post in forum_data:
            if not post.get('title') or not post.get('content'):
                continue
                
            # Create user message with error context
            user_content = self._format_error_input(post)
            
            # Create assistant response
            assistant_content = self._format_solution_response(post)
            
            example = {
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_content},
                    {"role": "assistant", "content": assistant_content}
                ]
            }
            
            training_examples.append(example)
        
        # Save in JSONL format (one JSON object per line)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            for example in training_examples:
                f.write(json.dumps(example) + '\n')
        
        logger.info(f"Created {len(training_examples)} training examples in {output_path}")
        return output_path
    
    def _format_error_input(self, post: Dict[str, Any]) -> str:
        """Format forum post as user input"""
        error_logs = self._extract_error_logs(post.get('content', ''))
        
        parts = [
            f"Title: {post.get('title', 'Unknown Error')}",
            f"Platform: Quest VR / Unreal Engine",
            f"Description: {post.get('excerpt', post.get('content', ''))[:500]}..."
        ]
        
        if error_logs:
            parts.append(f"Error Logs:\n{error_logs}")
        
        parts.append("Please analyze this error and provide a solution with classification and confidence score.")
        
        return "\n\n".join(parts)
    
    def _format_solution_response(self, post: Dict[str, Any]) -> str:
        """Format solution as assistant response"""
        error_type = post.get('error_type', 'other')
        has_solution = post.get('has_solution', False)
        solution_content = post.get('solution_content', '')
        
        response = {
            "classification": {
                "error_type": error_type,
                "confidence": 0.95 if has_solution else 0.7,
                "auto_fixable": error_type in ['packaging_error', 'plugin_conflict'],
                "key_indicators": self._extract_key_indicators(post)
            },
            "solution": solution_content if has_solution else f"This appears to be a {error_type} issue. Check the official documentation and community forums for similar cases.",
            "auto_fix": self._generate_auto_fix(post) if has_solution else None,
            "sources": [post.get('url', '')],
            "metadata": {
                "forum": post.get('forum'),
                "upvotes": post.get('upvotes', 0),
                "solved": has_solution
            }
        }
        
        return json.dumps(response, indent=2)
    
    def _extract_error_logs(self, content: str) -> str:
        """Extract error logs from content"""
        lines = content.split('\n')
        error_lines = []
        
        for line in lines:
            if any(keyword in line.lower() for keyword in [
                'error:', 'warning:', 'exception:', 'failed:', 'crash', 'log'
            ]):
                error_lines.append(line.strip())
        
        return '\n'.join(error_lines[:10])  # Limit to first 10 error lines
    
    def _extract_key_indicators(self, post: Dict[str, Any]) -> List[str]:
        """Extract key indicators for error classification"""
        content = post.get('content', '').lower()
        title = post.get('title', '').lower()
        
        indicators = []
        
        # Error pattern matching
        patterns = {
            'black_screen': ['black screen', 'blank display', 'no render'],
            'packaging_error': ['packaging', 'build failed', 'cook failed', 'apk'],
            'plugin_conflict': ['plugin', 'conflict', 'missing module'],
            'sdk_mismatch': ['sdk', 'version', 'mismatch', 'compatibility']
        }
        
        for error_type, keywords in patterns.items():
            if any(keyword in content or keyword in title for keyword in keywords):
                indicators.extend(keywords[:2])  # Add first 2 matching keywords
        
        return indicators[:5]  # Limit to 5 indicators
    
    def _generate_auto_fix(self, post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generate auto-fix suggestions based on error type"""
        error_type = post.get('error_type', 'other')
        
        auto_fixes = {
            'packaging_error': {
                "type": "config_change",
                "description": "Update packaging settings",
                "steps": [
                    "Open Project Settings > Packaging",
                    "Verify Android SDK path is correct",
                    "Check minimum API level settings",
                    "Rebuild and package"
                ]
            },
            'plugin_conflict': {
                "type": "plugin_management",
                "description": "Resolve plugin conflicts",
                "steps": [
                    "Disable conflicting plugins",
                    "Regenerate project files",
                    "Clean and rebuild project",
                    "Re-enable plugins one by one"
                ]
            }
        }
        
        return auto_fixes.get(error_type)
    
    async def upload_dataset(self, dataset_path: str, dataset_name: str) -> str:
        """Upload dataset to Llama API"""
        logger.info(f"Uploading dataset {dataset_name} from {dataset_path}")
        
        async with aiohttp.ClientSession() as session:
            with open(dataset_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=dataset_name)
                data.add_field('name', dataset_name)
                
                async with session.post(
                    f"{self.base_url}/datasets",
                    headers={'Authorization': f'Bearer {self.api_key}'},
                    data=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        dataset_id = result.get('id', dataset_name)
                        logger.info(f"Dataset uploaded successfully: {dataset_id}")
                        return dataset_id
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to upload dataset: {response.status} - {error_text}")
    
    async def create_finetuning_job(
        self, 
        dataset_id: str, 
        config: LlamaFineTuningConfig
    ) -> FineTuningJob:
        """Create a fine-tuning job"""
        logger.info(f"Creating fine-tuning job: {config.job_name}")
        
        job_data = {
            "model": config.base_model,
            "training_file": dataset_id,
            "hyperparameters": {
                "n_epochs": config.epochs,
                "batch_size": config.batch_size,
                "learning_rate_multiplier": config.learning_rate_multiplier
            },
            "suffix": config.job_name,
            "split_data": config.split_data
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/fine_tuning/jobs",
                headers=self.headers,
                json=job_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    job = FineTuningJob(
                        job_id=result['id'],
                        job_name=config.job_name,
                        status=result['status'],
                        base_model=config.base_model,
                        dataset_name=dataset_id,
                        created_at=result['created_at']
                    )
                    logger.info(f"Fine-tuning job created: {job.job_id}")
                    return job
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to create fine-tuning job: {response.status} - {error_text}")
    
    async def get_job_status(self, job_id: str) -> FineTuningJob:
        """Get the status of a fine-tuning job"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/fine_tuning/jobs/{job_id}",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return FineTuningJob(
                        job_id=result['id'],
                        job_name=result.get('suffix', 'unknown'),
                        status=result['status'],
                        base_model=result['model'],
                        dataset_name=result['training_file'],
                        created_at=result['created_at'],
                        model_name=result.get('fine_tuned_model'),
                        progress=result.get('progress', 0.0)
                    )
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to get job status: {response.status} - {error_text}")
    
    async def list_jobs(self) -> List[FineTuningJob]:
        """List all fine-tuning jobs"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/fine_tuning/jobs",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    jobs = []
                    for job_data in result.get('data', []):
                        job = FineTuningJob(
                            job_id=job_data['id'],
                            job_name=job_data.get('suffix', 'unknown'),
                            status=job_data['status'],
                            base_model=job_data['model'],
                            dataset_name=job_data['training_file'],
                            created_at=job_data['created_at'],
                            model_name=job_data.get('fine_tuned_model')
                        )
                        jobs.append(job)
                    return jobs
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to list jobs: {response.status} - {error_text}")
    
    async def wait_for_completion(self, job_id: str, poll_interval: int = 30) -> FineTuningJob:
        """Wait for a fine-tuning job to complete"""
        logger.info(f"Waiting for job {job_id} to complete...")
        
        while True:
            job = await self.get_job_status(job_id)
            logger.info(f"Job {job_id} status: {job.status} (progress: {job.progress:.1%})")
            
            if job.status in ['succeeded', 'failed', 'cancelled']:
                return job
            
            await asyncio.sleep(poll_interval)
    
    async def test_finetuned_model(self, model_name: str, test_prompt: str) -> str:
        """Test a fine-tuned model with a prompt"""
        logger.info(f"Testing fine-tuned model: {model_name}")
        
        messages = [
            {"role": "system", "content": "You are a Quest VR debugging assistant."},
            {"role": "user", "content": test_prompt}
        ]
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json={
                    "model": model_name,
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result['choices'][0]['message']['content']
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to test model: {response.status} - {error_text}")

async def run_complete_finetuning_pipeline(
    forum_data_path: str,
    output_dir: str = "quest_copilot_finetuned",
    config: Optional[LlamaFineTuningConfig] = None
) -> FineTuningJob:
    """Run the complete fine-tuning pipeline using Llama API"""
    
    config = config or LlamaFineTuningConfig()
    client = LlamaAPIFineTuningClient()
    
    try:
        # Step 1: Prepare dataset in Llama API format
        dataset_path = f"{output_dir}/training_data.jsonl"
        await client.prepare_dataset_from_forum_data(forum_data_path, dataset_path)
        
        # Step 2: Upload dataset to Llama API
        dataset_name = f"quest_copilot_dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        dataset_id = await client.upload_dataset(dataset_path, dataset_name)
        
        # Step 3: Create fine-tuning job
        job = await client.create_finetuning_job(dataset_id, config)
        
        # Step 4: Wait for completion
        completed_job = await client.wait_for_completion(job.job_id)
        
        # Step 5: Test the fine-tuned model
        if completed_job.status == 'succeeded' and completed_job.model_name:
            test_prompt = """Title: Black Screen on Quest 2
Platform: Quest VR / Unreal Engine
Description: Getting black screen when launching my VR app on Quest 2. Works fine in editor.
Error Logs:
VRDisplayComponent: Failed to initialize display
Please analyze this error and provide a solution with classification and confidence score."""
            
            response = await client.test_finetuned_model(completed_job.model_name, test_prompt)
            logger.info(f"Test response from fine-tuned model:\n{response}")
        
        return completed_job
        
    except Exception as e:
        logger.error(f"Fine-tuning pipeline failed: {e}")
        raise

if __name__ == "__main__":
    # Example usage
    async def main():
        forum_data_path = "scraper/scraped_data_output/forum_posts_20250624_001518.json"
        
        config = LlamaFineTuningConfig(
            job_name="quest-copilot-v1",
            epochs=3,
            batch_size=4,
            learning_rate_multiplier=1.0
        )
        
        job = await run_complete_finetuning_pipeline(forum_data_path, config=config)
        print(f"Fine-tuning completed: {job.model_name}")
    
    asyncio.run(main()) 