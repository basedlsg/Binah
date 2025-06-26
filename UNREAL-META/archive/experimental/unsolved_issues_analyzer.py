#!/usr/bin/env python3
"""
Unsolved Issues Analyzer - Identifies and analyzes unsolved Quest development issues
"""

import asyncio
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import sys
from collections import Counter

# Add project paths
project_root = Path(__file__).parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / 'backend'))

try:
    from backend.real_error_analyzer import RealErrorAnalyzer
    from llama.cost_tracker import CostTracker
except ImportError as e:
    print(f"Import error: {e}")
    print("Running in standalone mode...")

@dataclass
class UnsolvedIssue:
    """Represents an unsolved Quest development issue"""
    issue_id: str
    title: str
    error_type: str
    description: str
    forum_source: str
    url: str
    complexity_score: float
    keywords: List[str]
    date_found: str

class UnsolvedIssuesAnalyzer:
    """Analyzes forum data to identify unsolved issues"""
    
    def __init__(self, output_dir: str = "./unsolved_analysis"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        try:
            self.error_analyzer = RealErrorAnalyzer()
        except:
            self.error_analyzer = None
        
        # Patterns indicating unsolved issues
        self.unsolved_indicators = [
            r"still having.*problem",
            r"no solution.*found", 
            r"anyone.*else.*experiencing",
            r"workaround.*not.*working",
            r"tried.*everything",
            r"please.*help.*urgent"
        ]
        
    async def analyze_forum_data(self, forum_data_path: str) -> Dict[str, Any]:
        """Analyze forum data to identify unsolved issues"""
        print(f"🔍 Analyzing forum data from: {forum_data_path}")
        
        # Load forum data
        forum_posts = self._load_forum_data(forum_data_path)
        if not forum_posts:
            return {"unsolved_issues": [], "summary": {"total_unsolved_issues": 0}}
        
        print(f"📊 Loaded {len(forum_posts)} forum posts")
        
        # Identify unsolved issues
        unsolved_issues = []
        for post in forum_posts:
            if self._is_potentially_unsolved(post):
                issue = await self._analyze_unsolved_post(post)
                if issue:
                    unsolved_issues.append(issue)
        
        print(f"🎯 Identified {len(unsolved_issues)} unsolved issues")
        
        # Generate analysis
        results = {
            "unsolved_issues": [asdict(issue) for issue in unsolved_issues],
            "summary": self._generate_summary(unsolved_issues, len(forum_posts)),
            "analysis_metadata": {
                "total_posts_analyzed": len(forum_posts),
                "unsolved_issues_found": len(unsolved_issues),
                "analysis_date": datetime.now().isoformat()
            }
        }
        
        # Save results
        self._save_results(results)
        
        return results
    
    def _load_forum_data(self, data_path: str) -> List[Dict[str, Any]]:
        """Load forum data from JSON files"""
        data_path = Path(data_path)
        forum_posts = []
        
        if data_path.is_file() and data_path.suffix == '.json':
            try:
                with open(data_path, 'r', encoding='utf-8') as f:
                    forum_posts = json.load(f)
            except Exception as e:
                print(f"Error loading {data_path}: {e}")
                
        elif data_path.is_dir():
            json_files = list(data_path.glob('forum_posts_*.json'))
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        posts = json.load(f)
                        forum_posts.extend(posts)
                except Exception as e:
                    print(f"Error loading {json_file}: {e}")
        
        return forum_posts
    
    def _is_potentially_unsolved(self, post: Dict[str, Any]) -> bool:
        """Determine if a post represents an unsolved issue"""
        if post.get('has_solution', False):
            return False
        
        content = (post.get('content', '') + ' ' + post.get('title', '')).lower()
        
        # Check for unsolved indicators
        unsolved_score = 0
        for pattern in self.unsolved_indicators:
            if re.search(pattern, content, re.IGNORECASE):
                unsolved_score += 1
        
        return unsolved_score > 0
    
    async def _analyze_unsolved_post(self, post: Dict[str, Any]) -> Optional[UnsolvedIssue]:
        """Analyze a potentially unsolved post"""
        try:
            content = post.get('content', '')
            title = post.get('title', 'Untitled')
            
            # Basic error type classification
            error_type = 'unknown'
            if 'plugin' in content.lower() or 'openxr' in content.lower() or 'metaxr' in content.lower():
                error_type = 'plugin_conflict'
            elif 'sdk' in content.lower() and ('32' in content or '33' in content):
                error_type = 'sdk_mismatch'
            elif 'black screen' in content.lower() or 'render' in content.lower():
                error_type = 'black_screen'
            elif 'packaging' in content.lower() or 'build' in content.lower():
                error_type = 'packaging_error'
            
            # Calculate complexity score
            complexity = self._calculate_complexity(content)
            
            # Extract keywords
            keywords = self._extract_keywords(content, title)
            
            issue = UnsolvedIssue(
                issue_id=post.get('id', f"unsolved_{hash(title)}"),
                title=title,
                error_type=error_type,
                description=f"{title} - {error_type.replace('_', ' ').title()}",
                forum_source=post.get('forum', 'unknown'),
                url=post.get('url', ''),
                complexity_score=complexity,
                keywords=keywords,
                date_found=datetime.now().isoformat()
            )
            
            return issue
            
        except Exception as e:
            print(f"Error analyzing post: {e}")
            return None
    
    def _calculate_complexity(self, content: str) -> float:
        """Calculate complexity score for an issue"""
        complexity_keywords = [
            'intermittent', 'random', 'sometimes', 'occasionally',
            'specific device', 'edge case', 'memory leak', 'crash dump'
        ]
        
        content_lower = content.lower()
        complexity_score = 0.0
        
        for keyword in complexity_keywords:
            if keyword in content_lower:
                complexity_score += 0.1
        
        # Error count factor
        error_count = content_lower.count('error')
        complexity_score += min(error_count * 0.05, 0.3)
        
        return min(complexity_score, 1.0)
    
    def _extract_keywords(self, content: str, title: str) -> List[str]:
        """Extract relevant keywords"""
        text = (content + ' ' + title).lower()
        
        keywords = []
        key_terms = ['quest', 'vr', 'unreal', 'engine', 'plugin', 'sdk', 'android', 'error', 'crash']
        
        for term in key_terms:
            if term in text:
                keywords.append(term)
        
        # Extract version numbers
        versions = re.findall(r'\b\d+\.\d+\b', text)
        keywords.extend(versions[:3])
        
        return list(set(keywords))
    
    def _generate_summary(self, issues: List[UnsolvedIssue], total_posts: int) -> Dict[str, Any]:
        """Generate analysis summary"""
        error_types = Counter(issue.error_type for issue in issues)
        forums = Counter(issue.forum_source for issue in issues)
        
        avg_complexity = sum(issue.complexity_score for issue in issues) / len(issues) if issues else 0
        
        return {
            "total_unsolved_issues": len(issues),
            "total_posts_analyzed": total_posts,
            "unsolved_percentage": (len(issues) / total_posts * 100) if total_posts > 0 else 0,
            "error_type_distribution": dict(error_types),
            "forum_distribution": dict(forums),
            "average_complexity": avg_complexity,
            "high_complexity_issues": len([i for i in issues if i.complexity_score > 0.5])
        }
    
    def _save_results(self, results: Dict[str, Any]):
        """Save analysis results"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_file = self.output_dir / f"unsolved_analysis_{timestamp}.json"
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"📝 Results saved to: {results_file}")

async def main():
    """Main entry point"""
    analyzer = UnsolvedIssuesAnalyzer()
    
    # Check for scraped data
    scraper_data_dir = Path("./quest-dev-copilot/scraper/scraped_data")
    
    if scraper_data_dir.exists():
        results = await analyzer.analyze_forum_data(str(scraper_data_dir))
        
        print("\n🎯 UNSOLVED ISSUES ANALYSIS COMPLETE!")
        print(f"📊 Found {results['summary']['total_unsolved_issues']} unsolved issues")
        print(f"📈 Unsolved rate: {results['summary']['unsolved_percentage']:.1f}%")
        
        if results['summary']['error_type_distribution']:
            print("\n🔍 Error Type Distribution:")
            for error_type, count in results['summary']['error_type_distribution'].items():
                print(f"  - {error_type.replace('_', ' ').title()}: {count}")
                
    else:
        print("❌ No scraped forum data found.")
        print("   The forum scraper may still be running in the background.")

if __name__ == "__main__":
    asyncio.run(main()) 