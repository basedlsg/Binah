"""
Llama API Fine-Tuning Client
Uses the actual Llama API endpoints for dataset upload and fine-tuning job management.
"""

import os
import json
import time
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FineTuningConfig:
    """Configuration for fine-tuning jobs."""
    base_model: str = "Llama-3.3-8B-Instruct"
    epochs: int = 3
    batch_size: int = 4
    learning_rate_multiplier: float = 1.0
    job_name: str = "quest-dev-copilot-finetune"

@dataclass
class FineTuningJob:
    """Represents a fine-tuning job."""
    job_id: str
    status: str
    created_at: str
    model_name: Optional[str] = None
    progress: Optional[float] = None
    error_message: Optional[str] = None

class LlamaAPIFineTuningClient:
    """Client for managing Llama API fine-tuning operations using actual API endpoints."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the fine-tuning client."""
        self.api_key = api_key or os.getenv("LLAMA_API_KEY")
        if not self.api_key:
            raise ValueError("LLAMA_API_KEY environment variable or api_key parameter required")
        
        self.base_url = "https://api.llama.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def upload_dataset(self, dataset_path: str) -> str:
        """
        Upload dataset to Llama API using the fine-tuning endpoint.
        
        Args:
            dataset_path: Path to the dataset file
            
        Returns:
            Dataset ID
        """
        logger.info(f"Uploading dataset: {dataset_path}")
        
        try:
            # Read the dataset file
            with open(dataset_path, 'r', encoding='utf-8') as f:
                dataset_content = f.read()
            
            # Prepare the upload payload
            payload = {
                "file": dataset_content,
                "purpose": "fine-tune"
            }
            
            # Upload dataset
            response = requests.post(
                f"{self.base_url}/files",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            dataset_id = result.get("id")
            
            logger.info(f"Dataset uploaded successfully: {dataset_id}")
            return dataset_id
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload dataset: {e}")
            raise
    
    def create_fine_tuning_job(self, dataset_id: str, config: FineTuningConfig) -> FineTuningJob:
        """
        Create a fine-tuning job using the API.
        
        Args:
            dataset_id: ID of the uploaded dataset
            config: Fine-tuning configuration
            
        Returns:
            Fine-tuning job details
        """
        logger.info(f"Creating fine-tuning job with dataset: {dataset_id}")
        
        try:
            payload = {
                "model": config.base_model,
                "training_file": dataset_id,
                "hyperparameters": {
                    "n_epochs": config.epochs,
                    "batch_size": config.batch_size,
                    "learning_rate_multiplier": config.learning_rate_multiplier
                },
                "suffix": config.job_name
            }
            
            response = requests.post(
                f"{self.base_url}/fine_tuning/jobs",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            job_id = result.get("id")
            
            job = FineTuningJob(
                job_id=job_id,
                status=result.get("status", "created"),
                created_at=result.get("created_at", time.strftime("%Y-%m-%d %H:%M:%S")),
                model_name=result.get("fine_tuned_model")
            )
            
            logger.info(f"Fine-tuning job created: {job_id}")
            logger.info(f"Job configuration: {config}")
            
            return job
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create fine-tuning job: {e}")
            raise
    
    def get_job_status(self, job_id: str) -> FineTuningJob:
        """
        Get the status of a fine-tuning job.
        
        Args:
            job_id: ID of the fine-tuning job
            
        Returns:
            Current job status
        """
        logger.info(f"Checking status of job: {job_id}")
        
        try:
            response = requests.get(
                f"{self.base_url}/fine_tuning/jobs/{job_id}",
                headers=self.headers
            )
            response.raise_for_status()
            
            result = response.json()
            
            job = FineTuningJob(
                job_id=job_id,
                status=result.get("status", "unknown"),
                created_at=result.get("created_at", ""),
                model_name=result.get("fine_tuned_model"),
                progress=result.get("progress"),
                error_message=result.get("error", {}).get("message")
            )
            
            return job
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get job status: {e}")
            raise
    
    def list_fine_tuning_jobs(self) -> List[FineTuningJob]:
        """
        List all fine-tuning jobs.
        
        Returns:
            List of fine-tuning jobs
        """
        logger.info("Listing fine-tuning jobs")
        
        try:
            response = requests.get(
                f"{self.base_url}/fine_tuning/jobs",
                headers=self.headers
            )
            response.raise_for_status()
            
            result = response.json()
            jobs = []
            
            for job_data in result.get("data", []):
                job = FineTuningJob(
                    job_id=job_data.get("id"),
                    status=job_data.get("status"),
                    created_at=job_data.get("created_at"),
                    model_name=job_data.get("fine_tuned_model"),
                    progress=job_data.get("progress")
                )
                jobs.append(job)
            
            logger.info(f"Found {len(jobs)} fine-tuning jobs")
            return jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list jobs: {e}")
            return []
    
    def cancel_fine_tuning_job(self, job_id: str) -> bool:
        """
        Cancel a fine-tuning job.
        
        Args:
            job_id: ID of the fine-tuning job
            
        Returns:
            True if cancelled successfully
        """
        logger.info(f"Cancelling fine-tuning job: {job_id}")
        
        try:
            response = requests.post(
                f"{self.base_url}/fine_tuning/jobs/{job_id}/cancel",
                headers=self.headers
            )
            response.raise_for_status()
            
            logger.info(f"Fine-tuning job {job_id} cancelled successfully")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to cancel job: {e}")
            return False
    
    def test_fine_tuned_model(self, model_id: str, test_prompt: str) -> Dict[str, Any]:
        """
        Test a fine-tuned model with a sample prompt.
        
        Args:
            model_id: ID of the fine-tuned model
            test_prompt: Test prompt to send
            
        Returns:
            Model response
        """
        logger.info(f"Testing fine-tuned model: {model_id}")
        
        try:
            payload = {
                "model": model_id,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."
                    },
                    {
                        "role": "user",
                        "content": test_prompt
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.1
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info("Model test completed successfully")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to test model: {e}")
            return {"error": str(e)}
    
    def run_complete_fine_tuning_pipeline(self, 
                                        dataset_path: str,
                                        config: Optional[FineTuningConfig] = None) -> Dict[str, Any]:
        """
        Run the complete fine-tuning pipeline using API calls.
        
        Args:
            dataset_path: Path to the dataset file
            config: Fine-tuning configuration
            
        Returns:
            Pipeline results
        """
        logger.info("Starting complete fine-tuning pipeline via API")
        
        if config is None:
            config = FineTuningConfig()
        
        try:
            # Step 1: Upload dataset
            logger.info("Step 1: Uploading dataset")
            dataset_id = self.upload_dataset(dataset_path)
            
            # Step 2: Create fine-tuning job
            logger.info("Step 2: Creating fine-tuning job")
            job = self.create_fine_tuning_job(dataset_id, config)
            
            # Step 3: Monitor job status
            logger.info("Step 3: Monitoring job status")
            final_job = self.get_job_status(job.job_id)
            
            # Step 4: Test fine-tuned model (if available)
            logger.info("Step 4: Testing fine-tuned model")
            test_prompt = "Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048"
            test_result = None
            
            if final_job.model_name:
                test_result = self.test_fine_tuned_model(final_job.model_name, test_prompt)
            
            # Compile results
            results = {
                "pipeline_completed": True,
                "dataset_id": dataset_id,
                "job": final_job,
                "test_result": test_result,
                "next_steps": [
                    "1. Monitor job progress using get_job_status()",
                    "2. Wait for job completion (2-4 hours)",
                    "3. Use fine-tuned model in your application",
                    "4. Test with real error logs"
                ]
            }
            
            logger.info("Fine-tuning pipeline completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            raise

def main():
    """Main function to run the fine-tuning pipeline."""
    try:
        # Initialize client
        client = LlamaAPIFineTuningClient()
        
        # Run complete pipeline
        dataset_path = "fine_tuned_models/comprehensive_training_data.jsonl"
        config = FineTuningConfig(
            job_name="quest-dev-copilot-production",
            epochs=3,
            batch_size=4
        )
        
        results = client.run_complete_fine_tuning_pipeline(dataset_path, config)
        
        # Save results
        with open("api_fine_tuning_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print("API fine-tuning pipeline completed!")
        print(f"Results saved to: api_fine_tuning_results.json")
        print("\nNext steps:")
        for step in results["next_steps"]:
            print(f"  {step}")
            
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise

if __name__ == "__main__":
    main() 