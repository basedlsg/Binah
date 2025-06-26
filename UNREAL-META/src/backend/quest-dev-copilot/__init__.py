"""
Quest Dev Copilot - AI-powered debugging assistant for Unreal Engine Quest VR development.

This package provides tools for analyzing Quest development errors, forum scraping,
and cost tracking for AI services.
"""

import sys
from pathlib import Path

# Add the parent directory to Python path for proper imports
_package_root = Path(__file__).parent.parent
if str(_package_root) not in sys.path:
    sys.path.insert(0, str(_package_root))

__version__ = "1.0.0"
__author__ = "Quest Dev Copilot Team"

# Main components - use try/except to handle import issues during testing
try:
    from .backend.real_error_analyzer import RealErrorAnalyzer
    from .llama.cost_tracker import CostTracker
    from .rag.vector_store import VectorStore
    from .scraper.forum_scraper import ForumScraper
except ImportError:
    # Fallback to absolute imports for testing
    try:
        from backend.real_error_analyzer import RealErrorAnalyzer
        from llama.cost_tracker import CostTracker
        from rag.vector_store import VectorStore
        from scraper.forum_scraper import ForumScraper
    except ImportError:
        # If all imports fail, set to None (for testing scenarios)
        RealErrorAnalyzer = None
        CostTracker = None
        VectorStore = None
        ForumScraper = None

__all__ = [
    'RealErrorAnalyzer',
    'CostTracker', 
    'VectorStore',
    'ForumScraper',
] 