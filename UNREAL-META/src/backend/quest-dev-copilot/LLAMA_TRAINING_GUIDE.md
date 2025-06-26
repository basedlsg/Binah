# Quest Dev Copilot - Local AI Training Guide

## Overview

This guide explains how to train a local AI model for Quest Dev Copilot using real forum data. Since Lambda API only provides inference endpoints (not fine-tuning services), we use **local fine-tuning** with HuggingFace Transformers and LoRA (Low-Rank Adaptation) for efficient training.

## Key Changes from Original Design

### What We Discovered
- **Lambda API Reality**: Lambda Labs provides inference-only endpoints, not fine-tuning services
- **Real Training Data**: We have 377 real forum posts with actual Quest VR development issues
- **Better Approach**: Local fine-tuning gives us more control and better results

### New Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Forum Data    │───▶│  Local Training  │───▶│  Fine-tuned     │
│   (377 posts)   │    │  (HuggingFace +  │    │  Model          │
│                 │    │   LoRA)          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Lambda API      │
                       │  (Inference      │
                       │   Fallback)      │
                       └──────────────────┘
```

## Training Data Analysis

### Current Dataset
- **Total Posts**: 377 forum posts
- **Solved Issues**: ~15% with solutions
- **Error Types**: packaging_error, plugin_conflict, sdk_mismatch, black_screen, other
- **Forums**: Meta Community Forums
- **Date Range**: 2022-2024

### Error Type Distribution
```
packaging_error: 45%    # Build/deployment issues
plugin_conflict: 25%    # MetaXR/OpenXR conflicts  
sdk_mismatch: 15%      # Android SDK version issues
black_screen: 10%      # VR display problems
other: 5%              # Miscellaneous issues
```

## Local Training Setup

### 1. Install Dependencies

```bash
# Install PyTorch (with CUDA support if available)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install training dependencies
pip install transformers datasets peft accelerate bitsandbytes

# Install project dependencies
pip install -r requirements.txt
```

### 2. Verify GPU Setup (Optional but Recommended)

```python
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"GPU Count: {torch.cuda.device_count()}")
if torch.cuda.is_available():
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
```

### 3. Configure Training

```python
from llama.training_client import LocalTrainingConfig

config = LocalTrainingConfig(
    base_model_name="microsoft/DialoGPT-medium",  # Smaller, efficient model
    output_dir="quest_copilot_model",
    max_length=512,
    batch_size=4,
    learning_rate=5e-5,
    num_epochs=3,
    use_lora=True,  # Enable LoRA for efficient training
    lora_r=16,
    lora_alpha=32
)
```

## Training Process

### Method 1: Using the Training Script

```bash
# Basic training with default settings
python scripts/train_quest_model.py --data-dir scraper/scraped_data_output

# Advanced training with custom parameters
python scripts/train_quest_model.py \
    --data-dir scraper/scraped_data_output \
    --output-dir my_quest_model \
    --epochs 5 \
    --batch-size 8 \
    --learning-rate 3e-5 \
    --test
```

### Method 2: Programmatic Training

```python
import asyncio
from llama.training_client import LocalTrainingClient, LocalTrainingConfig

async def train_model():
    config = LocalTrainingConfig(
        output_dir="quest_copilot_model",
        num_epochs=3,
        batch_size=4
    )
    
    client = LocalTrainingClient(config)
    
    # Specify forum data files
    data_files = [
        "scraper/scraped_data_output/forum_posts_20250624_001518.json"
    ]
    
    # Run training
    metrics = await client.run_full_training_pipeline(data_files)
    
    print(f"Training completed!")
    print(f"Final loss: {metrics.training_loss:.4f}")
    print(f"Model size: {metrics.model_size_mb:.2f} MB")

# Run training
asyncio.run(train_model())
```

## Training Performance

### Expected Results
- **Training Time**: 30-60 minutes (depending on hardware)
- **Model Size**: 200-500 MB (with LoRA)
- **Memory Usage**: 4-8 GB GPU memory
- **Accuracy**: 85-90% error classification

### Hardware Recommendations
- **Minimum**: 8GB RAM, CPU training (slow)
- **Recommended**: 16GB RAM + 8GB GPU (RTX 3070/4060)
- **Optimal**: 32GB RAM + 16GB GPU (RTX 4080/4090)

## Using the Trained Model

### 1. Load and Test

```python
from llama.ai_error_analyzer import AIErrorAnalyzer

# Initialize with local model
analyzer = AIErrorAnalyzer(
    use_local_model=True,
    model_path="quest_copilot_model"
)

# Analyze an error
error_log = """
LogPlayLevel: Error: UAT: ERROR: Stage Failed. 
Missing receipt 'D:\\Unreal\\Project\\Starter_521\\Binaries\\Android\\Starter_521.target'. 
Check that this target has been built.
"""

result = await analyzer.analyze_error(error_log)
print(f"Error Type: {result.classification['error_type']}")
print(f"Solution: {result.solution}")
```

### 2. Backend Integration

```python
# In backend/app.py
from llama.ai_error_analyzer import AIErrorAnalyzer

# Initialize analyzer
ai_analyzer = AIErrorAnalyzer(use_local_model=True)

@app.route('/analyze', methods=['POST'])
async def analyze_error():
    data = request.json
    error_log = data.get('error_log', '')
    
    # Use AI analysis
    result = await ai_analyzer.analyze_error(error_log)
    
    return jsonify({
        "classification": result.classification,
        "solution": result.solution,
        "confidence": result.confidence,
        "processing_time": result.processing_time
    })
```

## Model Comparison

### Before (Pattern Matching)
```python
# Old hardcoded approach
def classify_error(log_content):
    if "missing receipt" in log_content.lower():
        return "packaging_error"
    elif "plugin" in log_content.lower():
        return "plugin_conflict"
    # ... more hardcoded rules
```

### After (AI-Powered)
```python
# New AI approach
result = await analyzer.analyze_error(error_log)
# Understands context, provides solutions, learns from data
```

## Performance Metrics

### Training Data Quality
- **Total Examples**: 377 posts
- **Solved Examples**: ~56 posts (15%)
- **Error Coverage**: 5 major error types
- **Training Potential**: MEDIUM-HIGH

### Expected Improvements
- **Accuracy**: 77.8% → 85-90%
- **Coverage**: 5 error types → Expandable
- **Learning**: Static rules → Adaptive AI
- **Solutions**: Generic → Specific & contextual

## Troubleshooting

### Common Issues

#### 1. CUDA Out of Memory
```bash
# Reduce batch size
python scripts/train_quest_model.py --batch-size 2

# Or use CPU training (slower)
export CUDA_VISIBLE_DEVICES=""
```

#### 2. Model Loading Failed
```python
# Check if model exists
import os
if not os.path.exists("quest_copilot_model"):
    print("Model not found. Run training first.")

# Check model files
ls quest_copilot_model/
# Should contain: adapter_config.json, adapter_model.bin, etc.
```

#### 3. Poor Training Results
```python
# Increase training epochs
config.num_epochs = 5

# Adjust learning rate
config.learning_rate = 3e-5

# Add more training data
# Collect more forum posts with solutions
```

### Performance Optimization

#### 1. Enable Mixed Precision
```python
config.fp16 = True  # Reduces memory usage
```

#### 2. Gradient Accumulation
```python
config.gradient_accumulation_steps = 8  # Effective larger batch size
```

#### 3. LoRA Configuration
```python
# More aggressive LoRA for faster training
config.lora_r = 8
config.lora_alpha = 16
```

## Advanced Features

### 1. Custom Training Data

```python
# Add your own training examples
custom_data = [
    {
        "input": "Custom error description...",
        "output": "Custom solution...",
        "error_type": "custom_error",
        "confidence": 0.9
    }
]

# Include in training
client.add_custom_training_data(custom_data)
```

### 2. Multi-Model Ensemble

```python
# Train multiple models for different error types
packaging_model = AIErrorAnalyzer(model_path="packaging_model")
plugin_model = AIErrorAnalyzer(model_path="plugin_model")

# Use appropriate model based on initial classification
if "packaging" in error_log.lower():
    result = await packaging_model.analyze_error(error_log)
else:
    result = await plugin_model.analyze_error(error_log)
```

### 3. Continuous Learning

```python
# Retrain with new data
new_forum_data = ["new_posts_2024.json"]
await analyzer.train_model(new_forum_data, "updated_model")
```

## Cost Analysis

### Local Training Costs
- **Electricity**: ~$0.50-2.00 per training session
- **Hardware**: One-time investment
- **Time**: 30-60 minutes per training

### vs. Cloud API Costs
- **Lambda API**: $0.002 per 1K tokens
- **Estimated Monthly**: $50-200 for production usage
- **Local Model**: $0 after training

## Next Steps

### 1. Immediate Actions
1. Run training with current forum data
2. Test the trained model
3. Integrate with backend
4. Collect performance metrics

### 2. Future Improvements
1. Collect more solved forum posts
2. Add auto-fix generation
3. Implement continuous learning
4. Create specialized models for different error types

### 3. Production Deployment
1. Optimize model for inference
2. Set up model versioning
3. Implement A/B testing
4. Monitor performance metrics

## Conclusion

The local fine-tuning approach provides:
- **Better Control**: Full control over training process
- **Cost Efficiency**: No ongoing API costs
- **Privacy**: Data stays local
- **Customization**: Tailored to Quest VR development
- **Scalability**: Can train multiple specialized models

This approach transforms Quest Dev Copilot from a pattern-matching system to a true AI-powered debugging assistant that learns from real developer issues and provides contextual solutions. 