# Quick Start: Llama API Fine-Tuning

## 🚀 Get Started in 3 Steps

You're all set! Here's how to start fine-tuning your Quest Dev Copilot model using the actual Llama API endpoints.

### Step 1: Test Your API Key

```bash
# Test if your API key works
./test_api_key.sh
```

This will verify your `LLAMA_API_KEY` environment variable is working correctly.

### Step 2: Start Fine-Tuning

```bash
# Start the fine-tuning process
./start_fine_tuning.sh
```

This script will:
- ✅ Upload your dataset to Llama API
- ✅ Create a fine-tuning job
- ✅ Save job information to `fine_tuning_job_info.json`
- ✅ Provide monitoring commands

### Step 3: Monitor Progress

```bash
# Monitor job progress (created automatically)
./monitor_job.sh
```

Or manually check status:
```bash
# Get job ID from the saved file
JOB_ID=$(jq -r '.job_id' fine_tuning_job_info.json)

# Check status
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
     "https://api.llama.com/v1/fine_tuning/jobs/$JOB_ID"
```

## 📋 What You Get

### Files Created
- `fine_tuning_job_info.json` - Job details and IDs
- `monitor_job.sh` - Automated monitoring script
- `start_fine_tuning.sh` - Complete fine-tuning pipeline

### Dataset Used
- **File**: `fine_tuned_models/comprehensive_training_data.jsonl`
- **Size**: ~50KB with 100+ training examples
- **Content**: Real Unreal Engine Quest VR error logs with expert analysis

### Model Configuration
- **Base Model**: Llama-3.3-8B-Instruct
- **Epochs**: 3
- **Batch Size**: 4
- **Learning Rate**: 1.0x multiplier
- **Expected Time**: 2-4 hours

## 🔍 Monitoring Commands

### Check Job Status
```bash
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
     "https://api.llama.com/v1/fine_tuning/jobs/<JOB_ID>"
```

### List All Jobs
```bash
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
     "https://api.llama.com/v1/fine_tuning/jobs"
```

### Cancel Job (if needed)
```bash
curl -X POST -H "Authorization: Bearer $LLAMA_API_KEY" \
     "https://api.llama.com/v1/fine_tuning/jobs/<JOB_ID>/cancel"
```

## 🎯 After Completion

### 1. Get Fine-Tuned Model ID
When the job completes, you'll get a model ID like:
```
ft:llama-3.3-8b-instruct:org-123:quest-dev-copilot-production:1a2b3c4d
```

### 2. Test the Model
```bash
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "<FINE_TUNED_MODEL_ID>",
       "messages": [
         {"role": "system", "content": "You are Quest Dev Copilot, an expert AI assistant specialized in Unreal Engine Quest VR development and debugging."},
         {"role": "user", "content": "Error: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048"}
       ],
       "max_tokens": 1000,
       "temperature": 0.1
     }' \
     "https://api.llama.com/v1/chat/completions"
```

### 3. Integrate with Quest Dev Copilot
```bash
# Set environment variable
export FINE_TUNED_MODEL_ID="<your-model-id>"

# Update your application to use the fine-tuned model
```

## 📊 Expected Results

### Before Fine-Tuning
- Generic responses to Quest VR errors
- Limited context awareness
- Basic error classification

### After Fine-Tuning
- Specialized Quest VR error analysis
- Detailed fix recommendations
- Context-aware debugging guidance
- Improved accuracy for Unreal Engine issues

## 🛠️ Troubleshooting

### API Key Issues
```bash
# Verify API key is set
echo $LLAMA_API_KEY

# Test API connection
curl -H "Authorization: Bearer $LLAMA_API_KEY" \
     "https://api.llama.com/v1/models"
```

### Dataset Issues
```bash
# Check if dataset exists
ls -la fine_tuned_models/comprehensive_training_data.jsonl

# Validate JSONL format
head -5 fine_tuned_models/comprehensive_training_data.jsonl | jq .
```

### Job Status Issues
- **`validating_files`**: Normal, wait for validation
- **`queued`**: Job is waiting in queue
- **`running`**: Job is processing (2-4 hours)
- **`failed`**: Check error details in response
- **`succeeded`**: Model is ready!

## 💰 Cost Information

- **Fine-tuning**: ~$0.50-2.00 per hour
- **Inference**: ~$0.001-0.01 per 1K tokens
- **Total expected cost**: $1-8 for complete fine-tuning

## 📚 Additional Resources

- **Full Guide**: `LLAMA_API_FINE_TUNING_GUIDE.md`
- **Implementation Details**: `LLAMA_API_FINE_TUNING_IMPLEMENTATION.md`
- **API Documentation**: https://docs.llama.com/

## 🎉 Ready to Start?

```bash
# 1. Test your API key
./test_api_key.sh

# 2. Start fine-tuning
./start_fine_tuning.sh

# 3. Monitor progress
./monitor_job.sh
```

Your Quest Dev Copilot will be fine-tuned and ready for production use in 2-4 hours! 