#!/usr/bin/env python3
"""
Corrected Llama API Fine-Tuning Script
Uses the proper API endpoints and format for fine-tuning.
"""

import os
import json
import time
import requests
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CorrectedLlamaFineTuning:
    """Corrected fine-tuning client for Llama API."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.llama.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def test_api_connection(self) -> bool:
        """Test if the API connection works."""
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json={
                    "model": "Llama-3.3-8B-Instruct",
                    "messages": [
                        {"role": "user", "content": "Hello"}
                    ],
                    "max_tokens": 10
                }
            )
            response.raise_for_status()
            logger.info("✅ API connection successful")
            return True
        except Exception as e:
            logger.error(f"❌ API connection failed: {e}")
            return False
    
    def check_available_models(self) -> Dict[str, Any]:
        """Check available models for fine-tuning."""
        try:
            # Try to get model information
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json={
                    "model": "Llama-3.3-8B-Instruct",
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1
                }
            )
            
            if response.status_code == 200:
                logger.info("✅ Llama-3.3-8B-Instruct is available")
                return {"available": True, "model": "Llama-3.3-8B-Instruct"}
            else:
                logger.warning(f"⚠️ Model test returned status: {response.status_code}")
                return {"available": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error checking models: {e}")
            return {"available": False, "error": str(e)}
    
    def create_fine_tuning_job_direct(self, dataset_path: str) -> Dict[str, Any]:
        """
        Create fine-tuning job directly with dataset content.
        This approach embeds the training data directly in the request.
        """
        logger.info(f"Creating fine-tuning job with dataset: {dataset_path}")
        
        try:
            # Read the dataset
            with open(dataset_path, 'r', encoding='utf-8') as f:
                dataset_content = f.read()
            
            # Create the fine-tuning job with embedded data
            payload = {
                "model": "Llama-3.3-8B-Instruct",
                "training_data": dataset_content,
                "hyperparameters": {
                    "n_epochs": 3,
                    "batch_size": 4,
                    "learning_rate_multiplier": 1.0
                },
                "suffix": f"quest-dev-copilot-{int(time.time())}"
            }
            
            logger.info("Sending fine-tuning request...")
            response = requests.post(
                f"{self.base_url}/fine_tuning/jobs",
                headers=self.headers,
                json=payload
            )
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Fine-tuning job created successfully")
                return {"success": True, "job": result}
            else:
                logger.error(f"❌ Failed to create job: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error creating fine-tuning job: {e}")
            return {"success": False, "error": str(e)}
    
    def list_fine_tuning_jobs(self) -> Dict[str, Any]:
        """List fine-tuning jobs."""
        try:
            response = requests.get(
                f"{self.base_url}/fine_tuning/jobs",
                headers=self.headers
            )
            
            if response.status_code == 200:
                jobs = response.json()
                logger.info(f"Found {len(jobs.get('data', []))} fine-tuning jobs")
                return {"success": True, "jobs": jobs}
            else:
                logger.error(f"❌ Failed to list jobs: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error listing jobs: {e}")
            return {"success": False, "error": str(e)}
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get status of a fine-tuning job."""
        try:
            response = requests.get(
                f"{self.base_url}/fine_tuning/jobs/{job_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                job_data = response.json()
                logger.info(f"Job {job_id} status: {job_data.get('status')}")
                return {"success": True, "job": job_data}
            else:
                logger.error(f"❌ Failed to get job status: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error getting job status: {e}")
            return {"success": False, "error": str(e)}
    
    def test_fine_tuned_model(self, model_id: str) -> Dict[str, Any]:
        """Test a fine-tuned model."""
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
                        "content": "Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048"
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.1
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Model test successful")
                return {"success": True, "response": result}
            else:
                logger.error(f"❌ Model test failed: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error testing model: {e}")
            return {"success": False, "error": str(e)}

def main():
    """Main function to run the corrected fine-tuning pipeline."""
    print("🚀 Corrected Llama API Fine-Tuning Pipeline")
    print("=" * 50)
    
    # Get API key
    api_key = os.getenv("LLAMA_API_KEY")
    if not api_key:
        print("❌ LLAMA_API_KEY environment variable not set")
        return
    
    # Initialize client
    client = CorrectedLlamaFineTuning(api_key)
    
    # Step 1: Test API connection
    print("\n📡 Step 1: Testing API Connection")
    print("-" * 30)
    if not client.test_api_connection():
        print("❌ API connection failed. Please check your API key.")
        return
    
    # Step 2: Check available models
    print("\n🤖 Step 2: Checking Available Models")
    print("-" * 30)
    model_check = client.check_available_models()
    if not model_check["available"]:
        print(f"❌ Model check failed: {model_check.get('error')}")
        return
    
    # Step 3: Check if dataset exists
    dataset_path = "fine_tuned_models/comprehensive_training_data.jsonl"
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        print("Please run the dataset preparation script first:")
        print("python scripts/simple_fine_tuning.py")
        return
    
    print(f"✅ Dataset found: {dataset_path}")
    
    # Step 4: List existing jobs
    print("\n📋 Step 3: Checking Existing Jobs")
    print("-" * 30)
    jobs_result = client.list_fine_tuning_jobs()
    if jobs_result["success"]:
        jobs = jobs_result["jobs"].get("data", [])
        print(f"Found {len(jobs)} existing jobs:")
        for job in jobs[:3]:  # Show first 3
            print(f"  - {job.get('id')}: {job.get('status')}")
    
    # Step 5: Create fine-tuning job
    print("\n🔧 Step 4: Creating Fine-Tuning Job")
    print("-" * 30)
    job_result = client.create_fine_tuning_job_direct(dataset_path)
    
    if job_result["success"]:
        job = job_result["job"]
        job_id = job.get("id")
        print(f"✅ Fine-tuning job created: {job_id}")
        
        # Save job information
        job_info = {
            "job_id": job_id,
            "status": job.get("status"),
            "created_at": job.get("created_at"),
            "model": job.get("model"),
            "suffix": job.get("suffix")
        }
        
        with open("fine_tuning_job_info.json", "w") as f:
            json.dump(job_info, f, indent=2)
        
        print("✅ Job information saved to: fine_tuning_job_info.json")
        
        # Step 6: Monitor job status
        print("\n📊 Step 5: Monitoring Job Status")
        print("-" * 30)
        print("Job will take 2-4 hours to complete.")
        print("You can monitor progress with:")
        print(f"python scripts/corrected_fine_tuning.py --monitor {job_id}")
        
    else:
        print(f"❌ Failed to create job: {job_result['error']}")
        print("\n🔍 Troubleshooting:")
        print("1. Check if fine-tuning is available in your API plan")
        print("2. Verify the dataset format is correct")
        print("3. Check API documentation for latest requirements")

if __name__ == "__main__":
    main() 