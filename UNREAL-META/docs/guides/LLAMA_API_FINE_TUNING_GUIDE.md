# Llama API Fine-Tuning Implementation Guide

## Overview

This guide provides step-by-step instructions for fine-tuning Llama models using the official Llama API endpoints. The Quest Dev Copilot project uses fine-tuned models to improve error analysis and fix generation for Unreal Engine Quest VR development.

## Prerequisites

1. **Llama API Key**: Get your API key from [Llama API](https://api.llama.com/)
2. **Dataset**: Prepared training data in JSONL format
3. **Base Model**: Llama-3.3-8B-Instruct (or other available models)

## API Endpoints

### Base URL
```
https://api.llama.com/v1
```

### Available Endpoints

1. **Upload Dataset**: `POST /files`
2. **Create Fine-tuning Job**: `POST /fine_tuning/jobs`
3. **List Jobs**: `GET /fine_tuning/jobs`
4. **Get Job Status**: `GET /fine_tuning/jobs/{job_id}`
5. **Cancel Job**: `POST /fine_tuning/jobs/{job_id}/cancel`
6. **Test Model**: `POST /chat/completions`

## Step-by-Step Implementation

### Step 1: Prepare Your Environment

```bash
# Set your API key
export LLAMA_API_KEY="your-api-key-here"

# Verify API key works
curl "https://api.llama.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -d '{
    "model": "Llama-3.3-8B-Instruct",
    "messages": [
      {"role": "user", "content": "Hello Llama! Can you give me a quick intro?"}
    ]
  }'
```

### Step 2: Upload Dataset

```bash
# Upload the training dataset
curl -X POST "https://api.llama.com/v1/files" \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file": "'$(base64 -w 0 fine_tuned_models/comprehensive_training_data.jsonl)'",
    "purpose": "fine-tune"
  }'
```

**Expected Response:**
```json
{
  "id": "file-abc123",
  "object": "file",
  "bytes": 12345,
  "created_at": 1234567890,
  "filename": "comprehensive_training_data.jsonl",
  "purpose": "fine-tune"
}
```

### Step 3: Create Fine-Tuning Job

```bash
# Create the fine-tuning job
curl -X POST "https://api.llama.com/v1/fine_tuning/jobs" \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Llama-3.3-8B-Instruct",
    "training_file": "file-abc123",
    "hyperparameters": {
      "n_epochs": 3,
      "batch_size": 4,
      "learning_rate_multiplier": 1.0
    },
    "suffix": "quest-dev-copilot-production"
  }'
```

**Expected Response:**
```json
{
  "id": "ft-xyz789",
  "object": "fine_tuning.job",
  "model": "Llama-3.3-8B-Instruct",
  "created_at": 1234567890,
  "finished_at": null,
  "fine_tuned_model": null,
  "organization_id": "org-123",
  "result_files": [],
  "status": "validating_files",
  "validation_file": null,
  "training_file": "file-abc123",
  "hyperparameters": {
    "n_epochs": 3,
    "batch_size": 4,
    "learning_rate_multiplier": 1.0
  },
  "trained_tokens": 0,
  "error": null
}
```

### Step 4: Monitor Job Status

```bash
# Check job status
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
  "https://api.llama.com/v1/fine_tuning/jobs/ft-xyz789"
```

**Job Status Values:**
- `validating_files`: Validating the uploaded dataset
- `queued`: Job is queued for processing
- `running`: Job is currently running
- `succeeded`: Job completed successfully
- `failed`: Job failed
- `cancelled`: Job was cancelled

### Step 5: List All Jobs

```bash
# List all fine-tuning jobs
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
  "https://api.llama.com/v1/fine_tuning/jobs"
```

### Step 6: Test Fine-Tuned Model

Once the job completes successfully, you'll get a fine-tuned model ID. Test it:

```bash
# Test the fine-tuned model
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ft:llama-3.3-8b-instruct:org-123:quest-dev-copilot-production:1a2b3c4d",
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
    "max_tokens": 1000,
    "temperature": 0.1
  }' \
  "https://api.llama.com/v1/chat/completions"
```

## Complete Automation Script

### Python Script

```python
#!/usr/bin/env python3
import os
import json
import requests
import time

class LlamaFineTuning:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.llama.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def upload_dataset(self, dataset_path):
        """Upload dataset to Llama API."""
        with open(dataset_path, 'r') as f:
            dataset_content = f.read()
        
        payload = {
            "file": dataset_content,
            "purpose": "fine-tune"
        }
        
        response = requests.post(
            f"{self.base_url}/files",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        
        return response.json()["id"]
    
    def create_job(self, dataset_id, model="Llama-3.3-8B-Instruct"):
        """Create fine-tuning job."""
        payload = {
            "model": model,
            "training_file": dataset_id,
            "hyperparameters": {
                "n_epochs": 3,
                "batch_size": 4,
                "learning_rate_multiplier": 1.0
            },
            "suffix": "quest-dev-copilot-production"
        }
        
        response = requests.post(
            f"{self.base_url}/fine_tuning/jobs",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        
        return response.json()["id"]
    
    def monitor_job(self, job_id):
        """Monitor job status until completion."""
        while True:
            response = requests.get(
                f"{self.base_url}/fine_tuning/jobs/{job_id}",
                headers=self.headers
            )
            response.raise_for_status()
            
            job_data = response.json()
            status = job_data["status"]
            
            print(f"Job {job_id}: {status}")
            
            if status in ["succeeded", "failed", "cancelled"]:
                return job_data
            
            time.sleep(60)  # Check every minute

def main():
    api_key = os.getenv("LLAMA_API_KEY")
    if not api_key:
        print("Set LLAMA_API_KEY environment variable")
        return
    
    client = LlamaFineTuning(api_key)
    
    # Upload dataset
    dataset_id = client.upload_dataset("fine_tuned_models/comprehensive_training_data.jsonl")
    print(f"Dataset uploaded: {dataset_id}")
    
    # Create job
    job_id = client.create_job(dataset_id)
    print(f"Job created: {job_id}")
    
    # Monitor job
    result = client.monitor_job(job_id)
    print(f"Job completed: {result}")

if __name__ == "__main__":
    main()
```

### Bash Script

```bash
#!/bin/bash

# Set your API key
export LLAMA_API_KEY="your-api-key-here"

# Upload dataset
echo "Uploading dataset..."
UPLOAD_RESPONSE=$(curl -s -X POST "https://api.llama.com/v1/files" \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"file\": \"$(base64 -w 0 fine_tuned_models/comprehensive_training_data.jsonl)\",
    \"purpose\": \"fine-tune\"
  }")

DATASET_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')
echo "Dataset ID: $DATASET_ID"

# Create job
echo "Creating fine-tuning job..."
JOB_RESPONSE=$(curl -s -X POST "https://api.llama.com/v1/fine_tuning/jobs" \
  -H "Authorization: Bearer $LLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"Llama-3.3-8B-Instruct\",
    \"training_file\": \"$DATASET_ID\",
    \"hyperparameters\": {
      \"n_epochs\": 3,
      \"batch_size\": 4,
      \"learning_rate_multiplier\": 1.0
    },
    \"suffix\": \"quest-dev-copilot-production\"
  }")

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.id')
echo "Job ID: $JOB_ID"

# Monitor job
echo "Monitoring job status..."
while true; do
  STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $LLAMA_API_KEY" \
    "https://api.llama.com/v1/fine_tuning/jobs/$JOB_ID")
  
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  echo "Status: $STATUS"
  
  if [[ "$STATUS" == "succeeded" || "$STATUS" == "failed" || "$STATUS" == "cancelled" ]]; then
    break
  fi
  
  sleep 60
done

echo "Job completed with status: $STATUS"
```

## Integration with Quest Dev Copilot

### Update Configuration

```python
# In llama/client.py
class LlamaClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("LLAMA_API_KEY")
        self.base_url = "https://api.llama.com/v1"
        self.fine_tuned_model = os.getenv("FINE_TUNED_MODEL_ID")
    
    def generate_response(self, prompt, use_fine_tuned=True):
        """Generate response using fine-tuned model if available."""
        model = self.fine_tuned_model if use_fine_tuned and self.fine_tuned_model else "Llama-3.3-8B-Instruct"
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.1
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=payload
        )
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
```

### Environment Variables

```bash
# Add to your .env file
LLAMA_API_KEY=your-api-key-here
FINE_TUNED_MODEL_ID=ft:llama-3.3-8b-instruct:org-123:quest-dev-copilot-production:1a2b3c4d
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   ```bash
   # Test your API key
   curl -H "Authorization: Bearer $LLAMA_API_KEY" \
     "https://api.llama.com/v1/models"
   ```

2. **Dataset Format Issues**
   - Ensure JSONL format with proper escaping
   - Check file size limits
   - Validate JSON structure

3. **Job Stuck in Validation**
   - Check dataset format
   - Verify file upload was successful
   - Review error messages in job status

4. **Model Not Available**
   - Check if base model is available
   - Verify API access level
   - Contact Llama API support

### Error Handling

```python
def safe_api_call(func, max_retries=3):
    """Retry API calls with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
```

## Cost Considerations

- **Fine-tuning**: ~$0.50-2.00 per hour depending on model size
- **Inference**: ~$0.001-0.01 per 1K tokens
- **Dataset Storage**: Minimal cost

## Best Practices

1. **Start Small**: Use smaller datasets for initial testing
2. **Monitor Costs**: Track usage and set budgets
3. **Validate Results**: Test fine-tuned models thoroughly
4. **Backup Models**: Keep track of successful model IDs
5. **Iterate**: Improve datasets based on results

## Next Steps

1. **Run the fine-tuning pipeline**
2. **Monitor job progress**
3. **Test the fine-tuned model**
4. **Integrate into Quest Dev Copilot**
5. **Evaluate performance improvements**
6. **Iterate and improve**

## Support

- **Llama API Documentation**: https://docs.llama.com/
- **API Status**: https://status.llama.com/
- **Community**: Discord/Forums for Llama API users

---

This guide provides everything needed to implement Llama API fine-tuning for the Quest Dev Copilot project. The fine-tuned models will significantly improve error analysis accuracy and fix generation quality for Unreal Engine Quest VR development scenarios. 