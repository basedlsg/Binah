"""
Local Fine-tuning Client for Quest Dev Copilot using HuggingFace Transformers

This implementation uses local fine-tuning since Lambda API only provides inference endpoints,
not fine-tuning services. We'll use HuggingFace transformers with LoRA for efficient training.
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

import torch
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer,
    DataCollatorForLanguageModeling, EarlyStoppingCallback
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

try:
    from llama.cost_tracker import CostTracker
except ImportError:
    # Fallback for when running as script
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from llama.cost_tracker import CostTracker

logger = logging.getLogger(__name__)

@dataclass
class LocalTrainingConfig:
    """Configuration for local fine-tuning"""
    base_model_name: str = "microsoft/DialoGPT-medium"  # Smaller model for local training
    output_dir: str = "quest_copilot_model"
    max_length: int = 512
    batch_size: int = 4
    learning_rate: float = 5e-5
    num_epochs: int = 3
    warmup_steps: int = 100
    logging_steps: int = 10
    save_steps: int = 500
    eval_steps: int = 500
    gradient_accumulation_steps: int = 4
    fp16: bool = True
    use_lora: bool = True
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.1
    
@dataclass
class TrainingMetrics:
    """Training metrics and results"""
    training_loss: float
    eval_loss: float
    perplexity: float
    training_time: float
    model_size_mb: float
    examples_processed: int

class LocalTrainingClient:
    """Local fine-tuning client using HuggingFace transformers"""
    
    def __init__(self, config: Optional[LocalTrainingConfig] = None):
        self.config = config or LocalTrainingConfig()
        self.cost_tracker = CostTracker()
        self.tokenizer = None
        self.model = None
        self.trained_model = None
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
    
    def load_forum_data(self, data_path: str) -> List[Dict[str, Any]]:
        """Load and process forum data for training"""
        logger.info(f"Loading forum data from {data_path}")
        
        with open(data_path, 'r', encoding='utf-8') as f:
            forum_data = json.load(f)
        
        processed_data = []
        for post in forum_data:
            # Create training examples from forum posts
            if post.get('has_solution') and post.get('solution_content'):
                # For solved posts, create input-output pairs
                input_text = self._format_error_input(post)
                output_text = self._format_solution_output(post)
                
                processed_data.append({
                    'input': input_text,
                    'output': output_text,
                    'error_type': post.get('error_type', 'other'),
                    'confidence': 1.0  # High confidence for solved issues
                })
            else:
                # For unsolved posts, create classification examples
                input_text = self._format_error_input(post)
                output_text = self._format_classification_output(post)
                
                processed_data.append({
                    'input': input_text,
                    'output': output_text,
                    'error_type': post.get('error_type', 'other'),
                    'confidence': 0.7  # Lower confidence for unsolved
                })
        
        logger.info(f"Processed {len(processed_data)} training examples")
        return processed_data
    
    def _format_error_input(self, post: Dict[str, Any]) -> str:
        """Format forum post as training input"""
        error_logs = self._extract_error_logs(post.get('content', ''))
        
        input_parts = [
            "### Quest VR Error Analysis Request",
            f"Title: {post.get('title', 'Unknown Error')}",
            f"Forum: {post.get('forum', 'unknown')}",
            f"Description: {post.get('excerpt', post.get('content', ''))[:500]}..."
        ]
        
        if error_logs:
            input_parts.append(f"Error Logs:\n{error_logs}")
        
        return "\n\n".join(input_parts)
    
    def _format_solution_output(self, post: Dict[str, Any]) -> str:
        """Format solution as training output"""
        solution = post.get('solution_content', '')
        error_type = post.get('error_type', 'other')
        
        output = {
            "classification": {
                "error_type": error_type,
                "confidence": 0.95,
                "auto_fixable": error_type in ['packaging_error', 'plugin_conflict'],
                "key_indicators": self._extract_key_indicators(post)
            },
            "solution": solution,
            "auto_fix": None,  # Would be generated based on solution
            "sources": [post.get('url', '')],
            "metadata": {
                "forum": post.get('forum'),
                "upvotes": post.get('upvotes', 0),
                "solved": True
            }
        }
        
        return json.dumps(output, indent=2)
    
    def _format_classification_output(self, post: Dict[str, Any]) -> str:
        """Format classification as training output for unsolved posts"""
        error_type = post.get('error_type', 'other')
        
        output = {
            "classification": {
                "error_type": error_type,
                "confidence": 0.8,
                "auto_fixable": False,
                "key_indicators": self._extract_key_indicators(post)
            },
            "solution": "This appears to be an unsolved issue. Consider checking the latest documentation or community forums for updates.",
            "auto_fix": None,
            "sources": [post.get('url', '')],
            "metadata": {
                "forum": post.get('forum'),
                "upvotes": post.get('upvotes', 0),
                "solved": False
            }
        }
        
        return json.dumps(output, indent=2)
    
    def _extract_error_logs(self, content: str) -> str:
        """Extract error logs from forum post content"""
        lines = content.split('\n')
        error_lines = []
        
        for line in lines:
            if any(keyword in line.lower() for keyword in [
                'error:', 'warning:', 'log', 'exception:', 'failed:', 'crash'
            ]):
                error_lines.append(line.strip())
        
        return '\n'.join(error_lines[:10])  # Limit to first 10 error lines
    
    def _extract_key_indicators(self, post: Dict[str, Any]) -> List[str]:
        """Extract key indicators for error classification"""
        content = post.get('content', '').lower()
        title = post.get('title', '').lower()
        
        indicators = []
        
        # Common error patterns
        patterns = {
            'black_screen': ['black screen', 'blank display', 'no render'],
            'packaging_error': ['packaging', 'build failed', 'cook failed', 'apk'],
            'plugin_conflict': ['plugin', 'xr', 'openxr', 'metaxr', 'conflict'],
            'sdk_mismatch': ['sdk', 'android', 'api level', 'target sdk'],
            'memory_issue': ['memory', 'allocation', 'leak', 'out of memory']
        }
        
        for error_type, keywords in patterns.items():
            if any(keyword in content or keyword in title for keyword in keywords):
                indicators.extend(keywords)
        
        return list(set(indicators))[:5]  # Return unique indicators, max 5
    
    def prepare_training_data(self, processed_data: List[Dict[str, Any]]) -> Dataset:
        """Prepare data for HuggingFace training"""
        logger.info("Preparing training dataset")
        
        # Format data for causal language modeling
        texts = []
        for example in processed_data:
            # Create conversation format
            conversation = f"Human: {example['input']}\n\nAssistant: {example['output']}"
            texts.append(conversation)
        
        # Create HuggingFace dataset
        dataset = Dataset.from_dict({"text": texts})
        
        # Tokenize the dataset
        def tokenize_function(examples):
            return self.tokenizer(
                examples["text"],
                truncation=True,
                padding=True,
                max_length=self.config.max_length,
                return_tensors="pt"
            )
        
        tokenized_dataset = dataset.map(tokenize_function, batched=True)
        return tokenized_dataset
    
    def setup_model_and_tokenizer(self):
        """Initialize model and tokenizer"""
        logger.info(f"Loading model: {self.config.base_model_name}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.config.base_model_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model_name,
            torch_dtype=torch.float16 if self.config.fp16 else torch.float32,
            device_map="auto"
        )
        
        # Setup LoRA if enabled
        if self.config.use_lora:
            logger.info("Setting up LoRA configuration")
            lora_config = LoraConfig(
                task_type=TaskType.CAUSAL_LM,
                r=self.config.lora_r,
                lora_alpha=self.config.lora_alpha,
                lora_dropout=self.config.lora_dropout,
                target_modules=["c_attn", "c_proj"]  # For DialoGPT
            )
            self.model = get_peft_model(self.model, lora_config)
            self.model.print_trainable_parameters()
    
    def train_model(self, train_dataset: Dataset, eval_dataset: Optional[Dataset] = None) -> TrainingMetrics:
        """Train the model using HuggingFace Trainer"""
        logger.info("Starting model training")
        start_time = datetime.now()
        
        # Setup training arguments
        training_args = TrainingArguments(
            output_dir=self.config.output_dir,
            overwrite_output_dir=True,
            num_train_epochs=self.config.num_epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            warmup_steps=self.config.warmup_steps,
            logging_steps=self.config.logging_steps,
            save_steps=self.config.save_steps,
            eval_steps=self.config.eval_steps,
            evaluation_strategy="steps" if eval_dataset else "no",
            save_strategy="steps",
            load_best_model_at_end=True if eval_dataset else False,
            metric_for_best_model="eval_loss" if eval_dataset else None,
            fp16=self.config.fp16,
            report_to="none"  # Disable wandb for now
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,  # Causal LM, not masked LM
        )
        
        # Setup trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=3)] if eval_dataset else None
        )
        
        # Train the model
        train_result = trainer.train()
        
        # Save the trained model
        trainer.save_model()
        self.tokenizer.save_pretrained(self.config.output_dir)
        
        # Calculate metrics
        training_time = (datetime.now() - start_time).total_seconds()
        
        # Get model size
        model_path = Path(self.config.output_dir)
        model_size_mb = sum(f.stat().st_size for f in model_path.rglob('*') if f.is_file()) / (1024 * 1024)
        
        metrics = TrainingMetrics(
            training_loss=train_result.training_loss,
            eval_loss=trainer.evaluate()["eval_loss"] if eval_dataset else 0.0,
            perplexity=torch.exp(torch.tensor(train_result.training_loss)).item(),
            training_time=training_time,
            model_size_mb=model_size_mb,
            examples_processed=len(train_dataset)
        )
        
        logger.info(f"Training completed in {training_time:.2f} seconds")
        logger.info(f"Final training loss: {metrics.training_loss:.4f}")
        logger.info(f"Model size: {metrics.model_size_mb:.2f} MB")
        
        return metrics
    
    async def run_full_training_pipeline(self, forum_data_paths: List[str]) -> TrainingMetrics:
        """Run the complete training pipeline"""
        logger.info("Starting full training pipeline")
        
        # Load and combine all forum data
        all_data = []
        for data_path in forum_data_paths:
            data = self.load_forum_data(data_path)
            all_data.extend(data)
        
        logger.info(f"Total training examples: {len(all_data)}")
        
        # Split data for training and validation
        split_idx = int(0.8 * len(all_data))
        train_data = all_data[:split_idx]
        eval_data = all_data[split_idx:]
        
        # Setup model and tokenizer
        self.setup_model_and_tokenizer()
        
        # Prepare datasets
        train_dataset = self.prepare_training_data(train_data)
        eval_dataset = self.prepare_training_data(eval_data) if eval_data else None
        
        # Train the model
        metrics = self.train_model(train_dataset, eval_dataset)
        
        return metrics

# Convenience function for easy usage
async def train_quest_copilot_model(
    forum_data_paths: List[str],
    output_dir: str = "quest_copilot_model",
    config: Optional[LocalTrainingConfig] = None
) -> TrainingMetrics:
    """Train Quest Dev Copilot model with forum data"""
    
    if config is None:
        config = LocalTrainingConfig(output_dir=output_dir)
    
    client = LocalTrainingClient(config)
    return await client.run_full_training_pipeline(forum_data_paths) 