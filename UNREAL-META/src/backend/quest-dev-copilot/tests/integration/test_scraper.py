# tests/integration/test_scraper.py
import pytest
import asyncio
import sys
from pathlib import Path

# Add project root to path to allow imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from quest_dev_copilot.scraper.forum_scraper import QuestForumScraper

@pytest.mark.asyncio
async def test_meta_forum_connection():
    """
    Tests if the scraper can connect to the Meta forums and get a valid response.
    This is a real network test.
    """
    scraper = QuestForumScraper()
    meta_config = scraper.forums.get('meta')
    
    assert meta_config, "Meta forum configuration not found"
    
    # Test one of the search patterns
    search_pattern = meta_config['search_patterns'][0]
    
    # In a real test suite, we might mock playwright, but for this verification,
    # we'll make a real call.
    try:
        posts = await scraper.scrape_all_forums(max_pages_total=1)
        # We don't need to assert on the content, just that it didn't crash
        # and hopefully found something.
        assert isinstance(posts, list)
        print(f"Scraped {len(posts)} posts from Meta forums.")
    except Exception as e:
        pytest.fail(f"Scraping Meta forums failed with a real network request: {e}") 