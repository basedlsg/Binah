import asyncio
import json
import time
from dataclasses import dataclass, asdict
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional, Any
import structlog
from collections import defaultdict

# In a real application, this might write to a database, a dedicated metrics service, or a file.
# For this initial setup, we will use structured logging for tracking.

logger = structlog.get_logger(__name__)

@dataclass
class UsageRecord:
    """Record of a single API usage event"""
    timestamp: str
    model_name: str
    operation: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    request_id: Optional[str] = None
    error_type: Optional[str] = None

@dataclass
class ModelPricing:
    """Pricing information for a specific model"""
    input_cost_per_1k: float  # Cost per 1000 input tokens
    output_cost_per_1k: float  # Cost per 1000 output tokens
    model_name: str

class CostTracker:
    """
    Tracks and analyzes Llama API usage costs and statistics.
    Provides real-time cost monitoring and budget management.
    """
    
    def __init__(self, storage_path: str = "./data/cost_tracking.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Model pricing (estimated based on similar API services)
        self.model_pricing = {
            "Llama-4-Scout-17B-16E-Instruct-FP8": ModelPricing(
                input_cost_per_1k=0.002,
                output_cost_per_1k=0.004,
                model_name="Llama-4-Scout-17B-16E-Instruct-FP8"
            ),
            "Llama-4-Maverick-17B-128E-Instruct-FP8": ModelPricing(
                input_cost_per_1k=0.004,
                output_cost_per_1k=0.008,
                model_name="Llama-4-Maverick-17B-128E-Instruct-FP8"
            )
        }
        
        self.usage_records: List[UsageRecord] = []
        self.daily_budgets: Dict[str, float] = {}  # date -> budget limit
        self.load_data()
        
        logger.info("CostTracker initialized", storage_path=str(self.storage_path))

    def calculate_cost(self, model_name: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate the cost for a specific API call"""
        if model_name not in self.model_pricing:
            logger.warning("Unknown model for cost calculation", model=model_name)
            # Use default pricing for unknown models
            input_cost = 0.002 * (prompt_tokens / 1000)
            output_cost = 0.004 * (completion_tokens / 1000)
        else:
            pricing = self.model_pricing[model_name]
            input_cost = pricing.input_cost_per_1k * (prompt_tokens / 1000)
            output_cost = pricing.output_cost_per_1k * (completion_tokens / 1000)
        
        total_cost = input_cost + output_cost
        return round(total_cost, 6)  # Round to 6 decimal places for precision

    def track_usage(self, 
                   model_name: str,
                   prompt_tokens: int, 
                   completion_tokens: int,
                   operation: str = "generation",
                   request_id: Optional[str] = None,
                   error_type: Optional[str] = None) -> UsageRecord:
        """Track a single API usage event"""
        
        total_tokens = prompt_tokens + completion_tokens
        estimated_cost = self.calculate_cost(model_name, prompt_tokens, completion_tokens)
        
        record = UsageRecord(
            timestamp=datetime.now().isoformat(),
            model_name=model_name,
            operation=operation,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=estimated_cost,
            request_id=request_id,
            error_type=error_type
        )
        
        self.usage_records.append(record)
        self.save_data()
        
        logger.info("Usage tracked", 
                   model=model_name, 
                   tokens=total_tokens, 
                   cost=estimated_cost,
                   operation=operation)
        
        return record

    def get_usage_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive usage statistics for the specified period"""
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        recent_records = [
            r for r in self.usage_records 
            if datetime.fromisoformat(r.timestamp).timestamp() > cutoff_time
        ]
        
        if not recent_records:
            return {
                "period_days": days,
                "total_requests": 0,
                "total_cost": 0.0,
                "total_tokens": 0,
                "models_used": [],
                "daily_breakdown": {},
                "cost_by_model": {},
                "cost_by_operation": {}
            }
        
        # Calculate statistics
        total_cost = sum(r.estimated_cost_usd for r in recent_records)
        total_tokens = sum(r.total_tokens for r in recent_records)
        models_used = list(set(r.model_name for r in recent_records))
        
        # Daily breakdown
        daily_breakdown = defaultdict(lambda: {"requests": 0, "cost": 0.0, "tokens": 0})
        for record in recent_records:
            day = datetime.fromisoformat(record.timestamp).date().isoformat()
            daily_breakdown[day]["requests"] += 1
            daily_breakdown[day]["cost"] += record.estimated_cost_usd
            daily_breakdown[day]["tokens"] += record.total_tokens
        
        # Cost by model
        cost_by_model = defaultdict(float)
        for record in recent_records:
            cost_by_model[record.model_name] += record.estimated_cost_usd
        
        # Cost by operation
        cost_by_operation = defaultdict(float)
        for record in recent_records:
            cost_by_operation[record.operation] += record.estimated_cost_usd
        
        return {
            "period_days": days,
            "total_requests": len(recent_records),
            "total_cost": round(total_cost, 4),
            "total_tokens": total_tokens,
            "average_cost_per_request": round(total_cost / len(recent_records), 4),
            "average_tokens_per_request": round(total_tokens / len(recent_records), 2),
            "models_used": models_used,
            "daily_breakdown": dict(daily_breakdown),
            "cost_by_model": dict(cost_by_model),
            "cost_by_operation": dict(cost_by_operation)
        }

    def get_cost_by_model(self, days: int = 7) -> Dict[str, float]:
        """Get cost breakdown by model for the specified period"""
        stats = self.get_usage_statistics(days)
        return stats["cost_by_model"]

    def set_daily_budget(self, budget_usd: float, date_str: Optional[str] = None):
        """Set daily budget limit"""
        if date_str is None:
            date_str = date.today().isoformat()
        
        self.daily_budgets[date_str] = budget_usd
        self.save_data()
        
        logger.info("Daily budget set", date=date_str, budget=budget_usd)

    def check_budget_status(self, date_str: Optional[str] = None) -> Dict[str, Any]:
        """Check current budget status"""
        if date_str is None:
            date_str = date.today().isoformat()
        
        # Get today's usage
        today_records = [
            r for r in self.usage_records
            if datetime.fromisoformat(r.timestamp).date().isoformat() == date_str
        ]
        
        today_cost = sum(r.estimated_cost_usd for r in today_records)
        budget_limit = self.daily_budgets.get(date_str, 0.0)
        
        remaining_budget = budget_limit - today_cost
        budget_used_percent = (today_cost / budget_limit * 100) if budget_limit > 0 else 0
        
        return {
            "date": date_str,
            "budget_limit": budget_limit,
            "cost_today": round(today_cost, 4),
            "remaining_budget": round(remaining_budget, 4),
            "budget_used_percent": round(budget_used_percent, 2),
            "over_budget": today_cost > budget_limit if budget_limit > 0 else False,
            "requests_today": len(today_records)
        }

    def get_efficiency_metrics(self) -> Dict[str, Any]:
        """Calculate efficiency metrics for optimization"""
        if not self.usage_records:
            return {"error": "No usage data available"}
        
        recent_records = self.usage_records[-100:]  # Last 100 requests
        
        # Token efficiency (output/input ratio)
        token_ratios = []
        for record in recent_records:
            if record.prompt_tokens > 0:
                ratio = record.completion_tokens / record.prompt_tokens
                token_ratios.append(ratio)
        
        avg_token_ratio = sum(token_ratios) / len(token_ratios) if token_ratios else 0
        
        # Cost per useful token (completion tokens)
        completion_tokens = sum(r.completion_tokens for r in recent_records)
        total_cost = sum(r.estimated_cost_usd for r in recent_records)
        cost_per_completion_token = total_cost / completion_tokens if completion_tokens > 0 else 0
        
        # Model efficiency comparison
        model_efficiency = {}
        for model in set(r.model_name for r in recent_records):
            model_records = [r for r in recent_records if r.model_name == model]
            if model_records:
                model_cost = sum(r.estimated_cost_usd for r in model_records)
                model_completion_tokens = sum(r.completion_tokens for r in model_records)
                model_efficiency[model] = {
                    "cost_per_completion_token": model_cost / model_completion_tokens if model_completion_tokens > 0 else 0,
                    "average_completion_tokens": sum(r.completion_tokens for r in model_records) / len(model_records),
                    "total_requests": len(model_records)
                }
        
        return {
            "average_token_efficiency": round(avg_token_ratio, 3),
            "cost_per_completion_token": round(cost_per_completion_token, 6),
            "model_efficiency": model_efficiency,
            "total_requests_analyzed": len(recent_records)
        }

    def save_data(self):
        """Save usage data to persistent storage"""
        try:
            data = {
                "usage_records": [asdict(record) for record in self.usage_records],
                "daily_budgets": self.daily_budgets,
                "last_updated": datetime.now().isoformat()
            }
            
            with open(self.storage_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error("Failed to save cost tracking data", error=str(e))

    def load_data(self):
        """Load usage data from persistent storage"""
        try:
            if self.storage_path.exists():
                with open(self.storage_path, 'r') as f:
                    data = json.load(f)
                
                # Load usage records
                self.usage_records = [
                    UsageRecord(**record) for record in data.get("usage_records", [])
                ]
                
                # Load daily budgets
                self.daily_budgets = data.get("daily_budgets", {})
                
                logger.info("Cost tracking data loaded", 
                           records_count=len(self.usage_records),
                           budgets_count=len(self.daily_budgets))
        except Exception as e:
            logger.warning("Failed to load cost tracking data, starting fresh", error=str(e))
            self.usage_records = []
            self.daily_budgets = {}

    def export_usage_report(self, days: int = 30) -> str:
        """Export detailed usage report as formatted string"""
        stats = self.get_usage_statistics(days)
        efficiency = self.get_efficiency_metrics()
        budget_status = self.check_budget_status()
        
        report = f"""
# Llama API Usage Report ({days} days)

## Summary
- Total Requests: {stats['total_requests']}
- Total Cost: ${stats['total_cost']:.4f}
- Total Tokens: {stats['total_tokens']:,}
- Average Cost/Request: ${stats['average_cost_per_request']:.4f}
- Average Tokens/Request: {stats['average_tokens_per_request']:.1f}

## Budget Status (Today)
- Budget Limit: ${budget_status['budget_limit']:.2f}
- Cost Today: ${budget_status['cost_today']:.4f}
- Remaining: ${budget_status['remaining_budget']:.4f}
- Usage: {budget_status['budget_used_percent']:.1f}%
- Over Budget: {"Yes" if budget_status['over_budget'] else "No"}

## Cost by Model
"""
        for model, cost in stats['cost_by_model'].items():
            report += f"- {model}: ${cost:.4f}\n"
        
        report += f"""
## Cost by Operation
"""
        for operation, cost in stats['cost_by_operation'].items():
            report += f"- {operation}: ${cost:.4f}\n"
        
        report += f"""
## Efficiency Metrics
- Token Efficiency Ratio: {efficiency['average_token_efficiency']:.3f}
- Cost per Completion Token: ${efficiency['cost_per_completion_token']:.6f}
"""
        
        return report


# Global instance for easy access
_global_cost_tracker: Optional[CostTracker] = None

def get_cost_tracker() -> CostTracker:
    """Get the global cost tracker instance"""
    global _global_cost_tracker
    if _global_cost_tracker is None:
        _global_cost_tracker = CostTracker()
    return _global_cost_tracker

async def track_llama_usage(model_name: str, 
                           prompt_tokens: int, 
                           completion_tokens: int, 
                           total_tokens: int,
                           operation: str = "generation",
                           request_id: Optional[str] = None) -> UsageRecord:
    """
    Async wrapper for tracking Llama API usage.
    This is the main function called by the Llama client.
    """
    tracker = get_cost_tracker()
    return tracker.track_usage(
        model_name=model_name,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        operation=operation,
        request_id=request_id
    )

# For backwards compatibility
def track_usage(*args, **kwargs):
    """Sync version of track_llama_usage"""
    tracker = get_cost_tracker()
    return tracker.track_usage(*args, **kwargs) 