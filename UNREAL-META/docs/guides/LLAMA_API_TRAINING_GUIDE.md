# Quest Dev Copilot - Llama API Fine-tuning Guide

This guide shows you how to use the **actual Meta Llama API** for fine-tuning your Quest Dev Copilot model, following the [official Llama API documentation](https://llama.developer.meta.com/docs/features/fine-tuning/).

## Overview

This implementation replaces the previous local training approach with proper API-based fine-tuning using Meta's Llama API service. You'll be training a real Llama 3.3 8B Instruct model on your Quest VR forum data.

## What You'll Get

- **Real Llama Model**: Fine-tuned `Llama-3.3-8B-Instruct` model
- **API-Based Training**: No local GPU requirements
- **Professional Results**: Production-ready fine-tuned model
- **Easy Deployment**: Use your model directly via Llama API

## Prerequisites

1. **Llama API Access**: You need a Llama API key
2. **Forum Data**: Your scraped Quest VR forum data
3. **Python Environment**: Python 3.8+ with required packages

## Installation

Install required dependencies:

```bash
pip install aiohttp asyncio
```

## Setup

### 1. Set Your API Key

Set your Llama API key as an environment variable:

```bash
export LLAMA_API_KEY="your_llama_api_key_here"
```

Or add it to your `.env` file:

```bash
echo "LLAMA_API_KEY=your_llama_api_key_here" >> .env
```

### 2. Verify Your Data

Make sure you have forum data available:

```bash
ls scraper/scraped_data_output/forum_posts_*.json
```

## Fine-tuning Process

### Step 1: Start Fine-tuning

Run the training script:

```bash
python scripts/train_with_llama_api.py
```

### Step 2: Monitor Progress

The script will:
1. **Convert forum data** to Llama API format (JSONL)
2. **Upload dataset** to Llama API
3. **Create fine-tuning job** with your configuration
4. **Monitor progress** until completion
5. **Test the model** with sample prompts

### Step 3: Custom Configuration

You can customize the fine-tuning with arguments:

```bash
python scripts/train_with_llama_api.py \
  --job-name "quest-copilot-production" \
  --epochs 5 \
  --batch-size 8 \
  --learning-rate 1.5 \
  --data-file scraper/scraped_data_output/forum_posts_20250624_001518.json
```

## Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--job-name` | `quest-copilot-TIMESTAMP` | Name for your fine-tuning job |
| `--base-model` | `Llama-3.3-8B-Instruct` | Base model to fine-tune |
| `--epochs` | `3` | Number of training epochs |
| `--batch-size` | `4` | Training batch size |
| `--learning-rate` | `1.0` | Learning rate multiplier (base: 3e-4) |
| `--data-file` | Forum posts JSON | Path to your training data |

## Data Format

The script automatically converts your forum data to the required Llama API format:

```json
{
  "messages": [
    {
      "role": "system", 
      "content": "You are a Quest VR debugging assistant..."
    },
    {
      "role": "user", 
      "content": "Title: Black Screen Error\nPlatform: Quest VR..."
    },
    {
      "role": "assistant", 
      "content": "{\"classification\": {\"error_type\": \"black_screen\"...}}"
    }
  ]
}
```

## Expected Output

### Training Progress

```
🚀 Starting Quest Dev Copilot Llama API Fine-tuning
📋 Fine-tuning Configuration:
   Base Model: Llama-3.3-8B-Instruct
   Job Name: quest-copilot-20250105-143022
   Epochs: 3
   Batch Size: 4
   Learning Rate Multiplier: 1.0
   Auto-split Data: True

Converting forum data to Llama API format...
Created 377 training examples in quest_copilot_finetuned/training_data.jsonl

Uploading dataset quest_copilot_dataset_20250105_143022.jsonl...
Dataset uploaded successfully: dataset_abc123

Creating fine-tuning job: quest-copilot-20250105-143022...
Fine-tuning job created: ft-job-xyz789

Waiting for job ft-job-xyz789 to complete...
Job ft-job-xyz789 status: running (progress: 25.0%)
Job ft-job-xyz789 status: running (progress: 50.0%)
Job ft-job-xyz789 status: running (progress: 75.0%)
Job ft-job-xyz789 status: succeeded (progress: 100.0%)

✅ Fine-tuning Pipeline Completed!
   Job ID: ft-job-xyz789
   Status: succeeded
   Fine-tuned Model: quest-copilot-20250105-143022:ft-personal:2025-01-05-14-30-22
🎉 Your Quest Dev Copilot model is ready!
   You can now use model 'quest-copilot-20250105-143022:ft-personal:2025-01-05-14-30-22' with the Llama API
```

### Test Results

The script will automatically test your fine-tuned model:

```
🧪 Testing model: quest-copilot-20250105-143022:ft-personal:2025-01-05-14-30-22

Testing: Black Screen Error
Response:
{
  "classification": {
    "error_type": "black_screen",
    "confidence": 0.95,
    "auto_fixable": false,
    "key_indicators": ["black screen", "VRDisplayComponent", "initialize display"]
  },
  "solution": "This appears to be a VR display initialization issue. Check your Quest 2 connection and ensure the Oculus runtime is properly installed...",
  "auto_fix": null,
  "sources": ["https://developer.meta.com/forums/..."],
  "metadata": {
    "forum": "meta_developer",
    "solved": true
  }
}
```

## Using Your Fine-tuned Model

### Via API Calls

Once training is complete, use your model name in API calls:

```python
import aiohttp
import asyncio

async def test_model():
    headers = {
        'Authorization': f'Bearer {your_api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "model": "quest-copilot-20250105-143022:ft-personal:2025-01-05-14-30-22",
        "messages": [
            {"role": "system", "content": "You are a Quest VR debugging assistant."},
            {"role": "user", "content": "Help me debug this packaging error..."}
        ],
        "max_tokens": 1000
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.llama-api.com/v1/chat/completions",
            headers=headers,
            json=data
        ) as response:
            result = await response.json()
            print(result['choices'][0]['message']['content'])

asyncio.run(test_model())
```

### Integration with Backend

Update your `backend/app.py` to use the fine-tuned model:

```python
# In backend/app.py
FINE_TUNED_MODEL_NAME = "quest-copilot-20250105-143022:ft-personal:2025-01-05-14-30-22"

@app.route('/analyze', methods=['POST'])
def analyze_error():
    # Use your fine-tuned model instead of pattern matching
    response = llama_client.chat_completion(
        model=FINE_TUNED_MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a Quest VR debugging assistant."},
            {"role": "user", "content": request.json['error_description']}
        ]
    )
    return jsonify(response)
```

## Management Commands

### List Existing Jobs

```bash
python scripts/train_with_llama_api.py --action list
```

### Test Existing Model

```bash
python scripts/train_with_llama_api.py --action test --model-name "your-model-name"
```

## Cost Estimation

Fine-tuning costs depend on:
- **Dataset size**: Number of training examples
- **Model size**: Llama-3.3-8B-Instruct
- **Training epochs**: Default 3 epochs

Typical costs for Quest Dev Copilot:
- **377 forum posts**: ~$10-20 per training run
- **Training time**: 30-60 minutes
- **Inference**: Standard API pricing per token

## Troubleshooting

### Common Issues

1. **API Key Error**
   ```
   ❌ LLAMA_API_KEY environment variable not set
   ```
   Solution: Set your API key as described in setup

2. **Data File Not Found**
   ```
   ❌ Data file not found: scraper/scraped_data_output/forum_posts_*.json
   ```
   Solution: Run the forum scraper first or check the file path

3. **Upload Failed**
   ```
   ❌ Failed to upload dataset: 413 - Request Entity Too Large
   ```
   Solution: Reduce dataset size or split into smaller files

4. **Training Failed**
   ```
   ❌ Fine-tuning failed with status: failed
   ```
   Solution: Check job logs in the Llama API dashboard

### Getting Help

- Check the [Llama API documentation](https://llama.developer.meta.com/docs/features/fine-tuning/)
- Review training logs in `llama_api_training_*.log`
- Examine the generated JSONL file for data format issues

## Next Steps

1. **Test thoroughly**: Use various error types to validate performance
2. **Deploy to production**: Update your backend to use the fine-tuned model
3. **Monitor performance**: Track accuracy and user feedback
4. **Iterate**: Collect more data and retrain as needed

## Architecture Comparison

### Before (Pattern Matching)
```
User Error → Regex Patterns → Hardcoded Response
```

### After (AI Fine-tuning)
```
User Error → Fine-tuned Llama 3.3 → Intelligent Analysis & Solution
```

Your Quest Dev Copilot now has genuine AI capabilities powered by a properly fine-tuned Llama model! 