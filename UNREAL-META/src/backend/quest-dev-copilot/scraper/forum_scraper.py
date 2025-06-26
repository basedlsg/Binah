# scraper/forum_scraper.py
import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from bs4 import BeautifulSoup
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Optional, Any
import re
from pathlib import Path
import time
import structlog
from dataclasses import dataclass, asdict
import os
from urllib.parse import urljoin

# Initialize structured logging
logger = structlog.get_logger(__name__)

@dataclass
class ForumPost:
    """Structured representation of a forum post"""
    id: str
    forum: str
    title: str
    url: str
    content: str
    excerpt: str
    error_type: str
    date_scraped: str
    post_date: str
    word_count: int
    has_solution: bool = False
    solution_content: Optional[str] = None
    upvotes: int = 0
    
class QuestForumScraper:
    """Scrapes Unreal Engine and Meta Quest forums for error solutions"""
    
    def __init__(self, output_dir: str = "./scraped_data"):
        self.output_dir = Path(output_dir).resolve()
        self.output_dir.mkdir(exist_ok=True)
        logger.info("QuestForumScraper initialized", output_directory=str(self.output_dir))
        
        # Error patterns for classification
        self.error_patterns = {
            'plugin_conflict': [
                r'OpenXR.*initialization.*failed',
                r'MetaXR.*conflict',
                r'OculusXR.*conflict',
                r'Multiple XR plugins enabled',
                r'Only one XR plugin can be active',
                r'Disable.*(?:OpenXR|MetaXR|OculusXR)',
            ],
            'sdk_mismatch': [
                r'Target SDK.*version.*3[234]',
                r'Android.*SDK.*32.*(maximum|required)',
                r'SDK.*mismatch',
                r'Android.*API.*level.*(?:32|33|34)',
                r'Gradle.*minSdkVersion',
                r'uses-sdk:minSdkVersion.*cannot be smaller than version 32',
            ],
            'black_screen': [
                r'black.*screen.*Quest',
                r'three.*dots.*loading',
                r'blank.*screen.*headset',
                r'no.*render.*output',
                r'Vulkan.*initialization.*failed',
                r'Mobile HDR.*disabled',
            ],
            'packaging_error': [
                r'PackagingResults.*Error',
                r'Cook.*failed',
                r'UAT.*error.*code.*',
                r'AutomationTool.*exiting.*code',
                r'BUILD FAILED',
            ],
            'shader_compile': [
                r'Shader.*compilation.*failed',
                r'Material.*error',
                r'HLSL.*error',
                r'Error X3004: undeclared identifier'
            ]
        }
        
        # Updated forum configurations with correct URLs
        self.forums = {
            'epic': {
                'base_url': 'https://forums.unrealengine.com',
                'search_patterns': [
                    '/search?q=Quest+OpenXR+MetaXR+OculusXR+error',
                    '/search?q=Quest+SDK+32+33+Android+error',
                    '/search?q=Quest+black+screen+vulkan+error',
                    '/search?q=Unreal+Quest+packaging+failed',
                    '/search?q=Quest+shader+compile+error'
                ],
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
                'search_patterns': [
                    '/t5/forums/searchpage/tab/message?filter=location&q=Quest+Unreal+error&location=category:developer',
                    '/t5/forums/searchpage/tab/message?filter=location&q=OpenXR+MetaXR+conflict&location=category:developer',
                    '/t5/forums/searchpage/tab/message?filter=location&q=Android+SDK+Quest+Unreal&location=category:developer',
                    '/t5/forums/searchpage/tab/message?filter=location&q=Quest+black+screen+Unreal&location=category:developer',
                    '/t5/forums/searchpage/tab/message?filter=location&q=Quest+packaging+error&location=category:developer'
                ],
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
            }
        }
        
    async def scrape_all_forums(self, max_pages_total: int = 300) -> List[ForumPost]:
        """Main entry point to scrape all forums"""
        all_posts = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--no-sandbox',
                    '--disable-dev-shm-usage'
                ]
            )
            
            user_agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
            
            num_total_search_patterns = sum(len(fc['search_patterns']) for fc in self.forums.values())
            max_posts_per_pattern = max(1, max_pages_total // num_total_search_patterns if num_total_search_patterns > 0 else max_pages_total)
            logger.info("Scraping configuration", max_total_posts_overall=max_pages_total, max_posts_per_search_pattern=max_posts_per_pattern)

            for forum_name, forum_config in self.forums.items():
                logger.info("Starting to scrape forum", forum=forum_name)
                for i, search_pattern_path in enumerate(forum_config['search_patterns']):
                    ua = user_agents[i % len(user_agents)]
                    context = await browser.new_context(
                        user_agent=ua, 
                        viewport={'width': 1920, 'height': 1080}, 
                        locale='en-US'
                    )
                    await context.add_init_script("""Object.defineProperty(navigator, 'webdriver', { get: () => undefined });""")
                    logger.info("Browser context created", forum=forum_name, search_pattern=search_pattern_path, user_agent=ua)
                    try:
                        posts_from_pattern = await self._scrape_search_results(context, forum_name, forum_config, search_pattern_path, max_posts_per_pattern)
                        all_posts.extend(posts_from_pattern)
                        logger.info("Finished scraping search pattern", forum=forum_name, pattern=search_pattern_path, posts_found=len(posts_from_pattern), total_so_far=len(all_posts))
                    except Exception as e_search_results:
                         logger.error("Error in _scrape_search_results call", error=str(e_search_results), forum=forum_name, pattern=search_pattern_path, exc_info=True)
                    finally:
                        await context.close()
                    await asyncio.sleep(3 + (time.time() % 4))
            await browser.close()
            logger.info("Browser closed.")
        self._save_results(all_posts)
        return all_posts
    
    async def _scrape_search_results(self, context, forum_name: str, config: Dict, search_url_path: str, max_posts_to_collect: int) -> List[ForumPost]:
        posts: List[ForumPost] = []
        page = await context.new_page()
        try:
            full_url = config['base_url'] + search_url_path
            logger.info("Navigating to search page", url=full_url, forum=forum_name)
            
            # Enhanced error handling with multiple retry strategies
            success = False
            for attempt in range(3):
                try:
                    # Try different wait strategies
                    if attempt == 0:
                        await page.goto(full_url, wait_until='networkidle', timeout=30000)
                    elif attempt == 1:
                        await page.goto(full_url, wait_until='domcontentloaded', timeout=20000)
                    else:
                        await page.goto(full_url, wait_until='load', timeout=15000)
                    success = True
                    break
                except Exception as e_goto:
                    error_msg = str(e_goto)
                    if "ERR_NAME_NOT_RESOLVED" in error_msg:
                        logger.error("DNS resolution failed - invalid URL", url=full_url, error=error_msg)
                        return posts  # Skip this URL entirely
                    elif "timeout" in error_msg.lower():
                        logger.warning("Navigation timeout, retrying with different strategy", url=full_url, attempt=attempt+1, error=error_msg)
                        await asyncio.sleep(5 + attempt * 3)
                    else:
                        logger.warning("Navigation attempt failed, retrying...", url=full_url, attempt=attempt+1, error=error_msg)
                        await asyncio.sleep(2 + attempt * 2)
            
            if not success:
                logger.error("Failed to navigate to page after all retries", url=full_url)
                return posts
            
            # Try to find search results with multiple selectors
            try:
                await page.wait_for_selector(config['selectors']['search_results'], timeout=15000)
            except Exception as e_wait_selector:
                logger.warning("Primary selector not found, trying alternative approaches", 
                             url=full_url, 
                             selector=config['selectors']['search_results'], 
                             error=str(e_wait_selector))
                
                # Try alternative selectors based on forum type
                alternative_selectors = {
                    'epic': ['article', 'div.topic', 'div.search-result'],
                    'meta': ['div.message', 'div.post', 'div.lia-message']
                }
                
                found_alternative = False
                for alt_selector in alternative_selectors.get(forum_name, []):
                    try:
                        await page.wait_for_selector(alt_selector, timeout=5000)
                        logger.info("Found alternative selector", selector=alt_selector)
                        config['selectors']['search_results'] = alt_selector
                        found_alternative = True
                        break
                    except:
                        continue
                
                if not found_alternative:
                    logger.warning("No search results found with any selector", url=full_url)
                    return posts
            
            results_links = await self._extract_search_result_links(page, config)
            logger.info("Extracted search result links", count=len(results_links), forum=forum_name, search_url_path=search_url_path)
            
            visited_urls_for_pattern = set()
            for i, result_link_info in enumerate(results_links):
                if len(posts) >= max_posts_to_collect: 
                    logger.info("Reached max_posts_to_collect for pattern", collected=len(posts))
                    break
                    
                post_url = result_link_info.get('url')
                title = result_link_info.get('title', 'N/A')
                
                if not post_url or post_url in visited_urls_for_pattern: 
                    logger.debug("Skipping already visited/invalid URL", url=post_url)
                    continue
                    
                visited_urls_for_pattern.add(post_url)
                logger.info("Processing search result item", index=i, url=post_url, title=title[:50])
                try:
                    post_data = await self._extract_post_content(page, forum_name, post_url, config['selectors'])
                    if post_data: posts.append(post_data)
                except Exception as e_extract_post:
                    logger.error("Error extracting single post content", for_url=post_url, error=str(e_extract_post), exc_info=True)
                await asyncio.sleep(2 + (time.time() % 3))
        except Exception as e_main_scrape:
            logger.error("Main error in _scrape_search_results loop", error=str(e_main_scrape), forum=forum_name, search_url_path=search_url_path, exc_info=True)
        finally:
            if not page.is_closed(): await page.close()
        return posts
    
    async def _extract_search_result_links(self, page, config: Dict) -> List[Dict]:
        results = []
        content_html = await page.content()
        soup = BeautifulSoup(content_html, 'html.parser')
        result_elements = soup.select(config['selectors']['search_results'])
        if not result_elements: logger.warning("No elements found for search_results selector", selector=config['selectors']['search_results'], page_url=page.url)
        for element in result_elements:
            try:
                title_elem = element.select_one(config['selectors']['result_title'])
                excerpt_elem = element.select_one(config['selectors']['result_excerpt'])
                link_elem = element.select_one(config['selectors']['result_link']) 
                url_href = link_elem.get('href', '').strip() if link_elem else (title_elem.get('href', '').strip() if title_elem else None)
                if url_href:
                    url = urljoin(config['base_url'], url_href)
                    title_text = title_elem.get_text(strip=True) if title_elem else "No title found"
                    excerpt_text = excerpt_elem.get_text(strip=True) if excerpt_elem else ""
                    if url not in [r['url'] for r in results]: results.append({'title': title_text, 'url': url, 'excerpt': excerpt_text})
            except Exception as e_parse_link:
                logger.debug("Error parsing search result link/excerpt", error=str(e_parse_link), html_snippet=str(element)[:200])
        return results
    
    async def _extract_post_content(self, page: Any, forum_name: str, post_url: str, selectors: Dict[str, str]) -> Optional[ForumPost]:
        """Extract content from a single forum post page."""
        try:
            # Ensure the URL is absolute
            if not post_url.startswith('http'):
                base_url = page.url
                post_url = urljoin(base_url, post_url)
                
            logger.info("Extracting post content", url=post_url)
            await page.goto(post_url, wait_until='networkidle', timeout=60000)
            await page.wait_for_selector(selectors['post_content'], timeout=30000)
            content_html = await page.content()
            soup = BeautifulSoup(content_html, 'html.parser')
            post_title_from_page = soup.title.string.strip() if soup.title and soup.title.string else "Unknown Title"
            
            # Correctly select the excerpt using the selector string
            excerpt_elem = soup.select_one(selectors['result_excerpt'])
            post_excerpt = excerpt_elem.get_text(strip=True) if excerpt_elem else ""

            post_contents_data = []
            post_elements = soup.select(selectors['post_content'])
            if not post_elements:
                logger.warning("Post content selector found no elements. Using body as fallback.", url=post_url, selector=selectors['post_content'])
                body_text = soup.body.get_text(separator='\n', strip=True) if soup.body else ""
                if body_text: post_contents_data.append({'text': body_text[:8000], 'code': ''})
                else: logger.warning("No content extractable (even from body).", url=post_url); return None
            else:
                for post_elem in post_elements[:10]: 
                    post_text = post_elem.get_text(separator='\n', strip=True)
                    code_blocks_in_elem = post_elem.select(selectors['code_blocks'])
                    code_content = '\n\n---\n\n'.join([code.get_text(strip=True) for code in code_blocks_in_elem if code.get_text(strip=True)])
                    post_contents_data.append({'text': post_text, 'code': code_content})
            
            full_content_text = '\n\n==========\nNext Post in Thread\n==========\n\n'.join([p['text'] for p in post_contents_data if p['text'] and p['text'].strip()])
            all_code_blocks = '\n\n==========\nNext Code Block\n==========\n\n'.join([p['code'] for p in post_contents_data if p['code'] and p['code'].strip()])
            if not full_content_text.strip(): logger.warning("Extracted full_content_text is empty.", url=post_url); return None

            has_solution = bool(soup.select_one(selectors['solution_marker']))
            date_elem = soup.select_one(selectors['post_date'])
            post_date_str = date_elem.get('datetime', '') if date_elem and date_elem.has_attr('datetime') else (date_elem.get_text(strip=True) if date_elem else datetime.now().isoformat())
            error_type = self._classify_content(full_content_text)
            
            post_obj = ForumPost(
                id=hashlib.md5(post_url.encode()).hexdigest(), forum=forum_name, title=post_title_from_page, url=post_url,
                content=full_content_text, excerpt=post_excerpt, error_type=error_type,
                date_scraped=datetime.now().isoformat(), post_date=post_date_str, word_count=len(full_content_text.split()), 
                has_solution=has_solution, solution_content=all_code_blocks if all_code_blocks else None)
            logger.info("Successfully extracted post content", title=post_obj.title[:60], url=post_obj.url, error_type=post_obj.error_type)
            return post_obj
        except PlaywrightTimeoutError as e:
            logger.error("Timeout during post content extraction", for_url=post_url, error=str(e))
            return None
        except Exception as e:
            logger.error("Error during post content extraction details", for_url=post_url, error=str(e), exc_info=True)
            return None
    
    def _classify_content(self, content: str) -> str:
        content_lower = content.lower(); scores = {}
        for error_type, patterns in self.error_patterns.items(): scores[error_type] = sum(1 for p in patterns if re.search(p, content_lower, re.IGNORECASE))
        if scores and max(scores.values()) > 0: return max(scores, key=scores.get)
        return 'other'
    
    def _save_results(self, posts: List[ForumPost]):
        if not posts: logger.warning("No posts scraped, so nothing to save."); return
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S'); posts_dict = [asdict(post) for post in posts]
        json_path = self.output_dir / f"forum_posts_{timestamp}.json"
        try:
            with open(json_path, 'w', encoding='utf-8') as f: json.dump(posts_dict, f, indent=2, ensure_ascii=False)
            logger.info("Saved full scraped data to JSON file", path=str(json_path.resolve()), count=len(posts_dict))
        except IOError as e: logger.error("Failed to save full scraped data", path=str(json_path.resolve()), error=str(e), exc_info=True)
        summary = {'total_posts_collected': len(posts), 'posts_by_forum': {k: 0 for k in self.forums.keys()}, 'posts_by_error_type': {k: 0 for k in self.error_patterns.keys()}, 'posts_with_solutions': sum(1 for p in posts if p.has_solution), 'scrape_date_utc': datetime.utcnow().isoformat()}
        summary['posts_by_error_type']['other'] = 0
        for post in posts: summary['posts_by_forum'][post.forum] = summary['posts_by_forum'].get(post.forum, 0) + 1; summary['posts_by_error_type'][post.error_type] = summary['posts_by_error_type'].get(post.error_type, 0) + 1
        summary_path = self.output_dir / f"scrape_summary_{timestamp}.json"
        try:
            with open(summary_path, 'w', encoding='utf-8') as f: json.dump(summary, f, indent=2)
            logger.info("Saved scrape summary to JSON file", path=str(summary_path.resolve()))
        except IOError as e: logger.error("Failed to save scrape summary", path=str(summary_path.resolve()), error=str(e), exc_info=True)
        logger.info("Scraping process complete. Results saved.", total_posts=summary['total_posts_collected'], by_error_type=summary['posts_by_error_type'])
        self._generate_sample_logs(posts)
    
    def _generate_sample_logs(self, posts: List[ForumPost]):
        if not posts: logger.info("No posts to generate sample logs from."); return
        logs_dir = self.output_dir / "sample_logs"; logs_dir.mkdir(exist_ok=True); generated_log_count = 0
        by_type: Dict[str, List[ForumPost]] = {}; [by_type.setdefault(p.error_type, []).append(p) for p in posts]
        for error_type, type_posts in by_type.items():
            if type_posts and error_type in self.error_patterns.keys(): # Only generate for known error types
                type_posts.sort(key=lambda p: (p.has_solution, p.word_count), reverse=True); best_post = type_posts[0]
                log_content = self._create_realistic_log(error_type, best_post); log_path = logs_dir / f"{error_type}_sample.log"
                try:
                    with open(log_path, 'w', encoding='utf-8') as f: f.write(log_content)
                    logger.info("Generated sample log file", error_type=error_type, path=str(log_path.resolve())); generated_log_count +=1
                except IOError as e: logger.error("Failed to write sample log file", path=str(log_path.resolve()), error=str(e), exc_info=True)
        logger.info("Sample log generation complete.", count=generated_log_count)
    
    def _create_realistic_log(self, error_type: str, post: ForumPost) -> str:
        timestamp = datetime.now().strftime("%Y.%m.%d-%H.%M.%S")
        snippet = post.content[:1500] if post.content else "No content snippet."
        url_info = f"(Context from: {post.url})"
        log_templates = {
            'plugin_conflict': f"""LogInit: Build: ++UE5+Release-5.3-CL-0\nLogOutputDevice: Error: Multiple XR plugins are active. {url_info}\nRelevant context:\n{snippet}
""",
            'sdk_mismatch': f"""UATHelper: Packaging (Android): Error: Project Target SDK 33 is not supported. {url_info}\nRelevant context:\n{snippet}
""",
            'black_screen': f"""LogCore: Error: Rendering initialization failed. {url_info}\nRelevant context:\n{snippet}
""",
            'packaging_error': f"""UATHelper: Packaging (Android): CookResults: Error: Cook failed. {url_info}\nRelevant context:\n{snippet}
""",
            'shader_compile': f"""LogShaderCompilers: Error: Shader FMyPixelShader failed to compile. {url_info}\nRelevant context:\n{snippet}
"""}
        return log_templates.get(error_type, f"LogTemp: Uncategorized Error ({error_type}) {url_info}\n{snippet}")

async def main():
    # Ensure output_dir is relative to the script location if run from scraper/ directory
    output_dir = Path(__file__).resolve().parent / "scraped_data_output"
    scraper = QuestForumScraper(output_dir=output_dir)
    
    logger.info("Starting forum scrape process...", configured_output_dir=str(output_dir))
    # Make max_pages configurable via environment variable for flexibility
    max_pages_to_scrape = int(os.getenv("SCRAPER_MAX_PAGES", "300")) 
    logger.info("Targeting max pages to scrape overall", max_pages=max_pages_to_scrape)
    posts = await scraper.scrape_all_forums(max_pages_total=max_pages_to_scrape)
    logger.info("Forum scrape process completed.", total_posts_collected=len(posts))


if __name__ == "__main__":
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(colors=True) # Assuming terminal supports colors
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    asyncio.run(main()) 