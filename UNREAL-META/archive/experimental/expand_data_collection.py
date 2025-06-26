#!/usr/bin/env python3
"""
Comprehensive Data Expansion Script for Quest Dev Copilot
Addresses critical data gaps identified in the analysis.
"""

import asyncio
import sys
from pathlib import Path
import json
import structlog
from datetime import datetime

# Add quest-dev-copilot to path
project_root = Path(__file__).parent
quest_copilot_dir = project_root / "quest-dev-copilot"
sys.path.insert(0, str(quest_copilot_dir))

from scraper.forum_scraper import QuestForumScraper
from scraper.ingest_to_chroma import DataIngestionPipeline

logger = structlog.get_logger(__name__)

class ExpandedDataCollector:
    """
    Collects targeted data to address specific gaps in the current dataset
    """
    
    def __init__(self):
        self.target_error_types = [
            'black_screen',
            'shader_compile', 
            'plugin_conflict',
            'vr',
            'packaging_error'  # Get more of these
        ]
        
        # Enhanced search terms for better targeting
        self.enhanced_search_terms = {
            'black_screen': [
                'Quest black screen VR eye buffer',
                'Unreal Quest black screen Vulkan',
                'Quest three dots loading screen',
                'VR render target allocation failed',
                'Quest app black screen fix'
            ],
            'shader_compile': [
                'Unreal Quest shader compilation failed',
                'HLSL compilation error Quest',
                'Android Vulkan shader error',
                'Mobile shader compile Quest',
                'Unreal shader error Quest VR'
            ],
            'plugin_conflict': [
                'MetaXR OpenXR plugin conflict',
                'Multiple XR plugins Quest',
                'OculusXR MetaXR conflict Unreal',
                'Plugin failed to load Quest',
                'XR plugin initialization failed'
            ],
            'vr': [
                'Quest hand tracking error',
                'OpenXR session failed Quest',
                'Guardian boundary setup failed',
                'Quest Link connection failed',
                'VR headset not detected Unreal'
            ],
            'packaging_error': [
                'Quest APK packaging failed',
                'Android build failed Quest',
                'Gradle assembly error Quest',
                'Quest deployment failed Unreal',
                'APK signing error Quest'
            ]
        }
    
    async def collect_targeted_data(self, max_posts_per_type: int = 20) -> dict:
        """
        Collect targeted data for each error type
        """
        logger.info("Starting targeted data collection", max_posts_per_type=max_posts_per_type)
        
        results = {
            'total_posts': 0,
            'posts_by_type': {},
            'posts_with_solutions': 0,
            'sources': []
        }
        
        # Create custom scraper with enhanced search terms
        scraper = QuestForumScraper(output_dir="./expanded_data")
        
        # Update scraper with our enhanced search terms
        enhanced_forums = self._create_enhanced_forum_config()
        scraper.forums = enhanced_forums
        
        # Collect data
        try:
            all_posts = await scraper.scrape_all_forums(max_pages_total=max_posts_per_type * len(self.target_error_types))
            
            # Analyze collected data
            for post in all_posts:
                results['total_posts'] += 1
                error_type = post.error_type
                
                if error_type not in results['posts_by_type']:
                    results['posts_by_type'][error_type] = 0
                results['posts_by_type'][error_type] += 1
                
                if post.has_solution:
                    results['posts_with_solutions'] += 1
            
            # Save enhanced dataset
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"expanded_forum_posts_{timestamp}.json"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump([post.__dict__ for post in all_posts], f, indent=2, ensure_ascii=False)
            
            results['output_file'] = output_file
            logger.info("Targeted data collection completed", **results)
            
        except Exception as e:
            logger.error("Error during data collection", error=str(e))
            raise
        
        return results
    
    def _create_enhanced_forum_config(self) -> dict:
        """
        Create enhanced forum configuration with targeted search terms
        """
        enhanced_forums = {
            'epic': {
                'base_url': 'https://forums.unrealengine.com',
                'search_patterns': [],
                'selectors': {
                    'search_results': 'div.search-results article', 
                    'result_title': 'h3.search-result-title a', 
                    'result_excerpt': 'div.search-result-excerpt', 
                    'result_link': 'h3.search-result-title a', 
                    'post_content': 'div.post div.content', 
                    'post_date': 'time[datetime]', 
                    'solution_marker': 'div.accepted-answer', 
                    'code_blocks': 'pre code',
                }
            },
            'meta': {
                'base_url': 'https://communityforums.atmeta.com',
                'search_patterns': [],
                'selectors': {
                    'search_results': 'div.lia-thread-topic', 
                    'result_title': 'a.lia-link-navigation', 
                    'result_excerpt': 'div.lia-message-body-content', 
                    'result_link': 'a.lia-link-navigation', 
                    'post_content': 'div.lia-message-body-content', 
                    'post_date': 'span.lia-message-posted-on', 
                    'solution_marker': 'span.lia-accepted-solution-message', 
                    'code_blocks': 'pre, code',
                }
            },
            'reddit': {
                'base_url': 'https://www.reddit.com',
                'search_patterns': [],
                'selectors': {
                    'search_results': 'div[data-testid="post-container"]',
                    'result_title': 'h3[data-testid="post-title"]',
                    'result_excerpt': 'div[data-testid="post-content"]',
                    'result_link': 'a[data-testid="post-title"]',
                    'post_content': 'div[data-testid="comment"]',
                    'post_date': 'time',
                    'solution_marker': 'span[aria-label="Solved"]',
                    'code_blocks': 'pre, code',
                }
            }
        }
        
        # Generate search patterns for each forum and error type
        for error_type, search_terms in self.enhanced_search_terms.items():
            for search_term in search_terms:
                # Epic Games Forum
                epic_search = f'/search?q={search_term.replace(" ", "+")}'
                enhanced_forums['epic']['search_patterns'].append(epic_search)
                
                # Meta Forum
                meta_search = f'/t5/forums/searchpage/tab/message?filter=location&q={search_term.replace(" ", "+")}&location=category:developer'
                enhanced_forums['meta']['search_patterns'].append(meta_search)
                
                # Reddit (Quest development subreddits)
                reddit_search = f'/r/OculusQuest+unrealengine+Unity3D/search/?q={search_term.replace(" ", "+")}&restrict_sr=on'
                enhanced_forums['reddit']['search_patterns'].append(reddit_search)
        
        return enhanced_forums
    
    async def ingest_expanded_data(self, json_file: str):
        """
        Ingest the expanded data into ChromaDB
        """
        logger.info("Starting ingestion of expanded data", file=json_file)
        
        # Use the same ChromaDB path as the main system
        chroma_path = str(project_root / "chroma_db_store")
        pipeline = DataIngestionPipeline(chroma_path=chroma_path)
        
        await pipeline.ingest_forum_posts(json_file, chunk_size=800, chunk_overlap=150)
        logger.info("Expanded data ingestion completed")

async def collect_synthetic_data():
    """
    Generate synthetic error logs based on real patterns to fill gaps
    """
    synthetic_data = []
    
    # High-quality synthetic examples for missing error types
    synthetic_examples = {
        'black_screen': [
            {
                'title': 'Quest VR Eye Buffer Allocation Fix',
                'content': '''
                SOLUTION: Fixed Quest black screen by reducing VR pixel density.
                
                Error was: LogVulkanRHI: Error: Failed to allocate VR eye buffer of size 2048x2048
                
                Steps that worked:
                1. Open Project Settings → Rendering
                2. Set VR Pixel Density to 0.8 (down from 1.0)
                3. Disable Mobile HDR in rendering settings
                4. Set Mobile MSAA to "No MSAA"
                5. Clean and rebuild project
                
                This reduced GPU memory usage enough for Quest 2 to allocate the eye buffers properly.
                ''',
                'has_solution': True,
                'error_type': 'black_screen'
            }
        ],
        'shader_compile': [
            {
                'title': 'Android Vulkan Shader Compilation Fix',
                'content': '''
                SOLUTION: Fixed shader compilation errors for Quest Android build.
                
                Error: LogShaderCompilers: Error: Failed to compile shader for platform Android_VULKAN: Syntax error at line 45
                
                The issue was using desktop-only shader features in mobile shaders.
                
                Fix:
                1. Check your custom materials for desktop-only nodes
                2. Replace complex math nodes with mobile-friendly alternatives
                3. Avoid using Texture2DArray on mobile
                4. Use "Mobile/Unlit" or "Mobile/Lit" material templates
                5. Test shaders in Mobile Preview mode
                ''',
                'has_solution': True,
                'error_type': 'shader_compile'
            }
        ],
        'plugin_conflict': [
            {
                'title': 'MetaXR OpenXR Plugin Conflict Resolution',
                'content': '''
                SOLUTION: Resolved plugin conflict between MetaXR and OpenXR.
                
                Error: LogPluginManager: Error: Plugin 'MetaXR' failed to load because module 'OculusXRHMD' could not be found
                
                For Quest development, you MUST disable OpenXR plugin:
                1. Go to Edit → Plugins
                2. Search for "OpenXR" 
                3. Uncheck/Disable OpenXR plugin
                4. Keep MetaXR plugin enabled
                5. Restart Unreal Engine
                6. Clean and rebuild project
                
                Only MetaXR should be active for Quest development.
                ''',
                'has_solution': True,
                'error_type': 'plugin_conflict'
            }
        ]
    }
    
    # Convert to forum post format
    for error_type, examples in synthetic_examples.items():
        for example in examples:
            post_data = {
                'id': f'synthetic_{error_type}_{len(synthetic_data)}',
                'forum': 'synthetic',
                'title': example['title'],
                'url': f'https://synthetic.example.com/{error_type}',
                'content': example['content'],
                'excerpt': example['content'][:200],
                'error_type': error_type,
                'date_scraped': datetime.now().isoformat(),
                'post_date': datetime.now().isoformat(),
                'word_count': len(example['content'].split()),
                'has_solution': example['has_solution'],
                'solution_content': example['content'] if example['has_solution'] else None,
                'upvotes': 10
            }
            synthetic_data.append(post_data)
    
    # Save synthetic data
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    synthetic_file = f"synthetic_forum_posts_{timestamp}.json"
    
    with open(synthetic_file, 'w', encoding='utf-8') as f:
        json.dump(synthetic_data, f, indent=2, ensure_ascii=False)
    
    logger.info("Generated synthetic data", file=synthetic_file, posts=len(synthetic_data))
    return synthetic_file

async def main():
    """
    Main function to expand the dataset
    """
    # Configure logging
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    
    print("🚀 Quest Dev Copilot - Data Expansion")
    print("=" * 50)
    
    collector = ExpandedDataCollector()
    
    # Option 1: Collect more real data (may take time)
    print("\n1. Collecting targeted real data...")
    try:
        real_data_results = await collector.collect_targeted_data(max_posts_per_type=10)
        print(f"✅ Collected {real_data_results['total_posts']} real posts")
        
        if real_data_results.get('output_file'):
            print("2. Ingesting real data into ChromaDB...")
            await collector.ingest_expanded_data(real_data_results['output_file'])
            print("✅ Real data ingested successfully")
            
    except Exception as e:
        print(f"⚠️ Real data collection failed: {e}")
        print("Proceeding with synthetic data only...")
    
    # Option 2: Generate high-quality synthetic data (fast)
    print("\n3. Generating synthetic solution data...")
    synthetic_file = await collect_synthetic_data()
    print(f"✅ Generated synthetic solutions: {synthetic_file}")
    
    print("4. Ingesting synthetic data into ChromaDB...")
    await collector.ingest_expanded_data(synthetic_file)
    print("✅ Synthetic data ingested successfully")
    
    print("\n🎉 Data expansion completed!")
    print("Run the comprehensive test again to see improvements.")

if __name__ == "__main__":
    asyncio.run(main()) 