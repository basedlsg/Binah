#!/usr/bin/env python3
"""
Unsolved Issues Analyzer - Identifies and analyzes unsolved Quest development issues
from forum data and provides research directions and solutions.
"""

import asyncio
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import structlog
from collections import defaultdict, Counter

# Add project paths
import sys
project_root = Path(__file__).parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / 'backend'))

from backend.real_error_analyzer import RealErrorAnalyzer
from llama.cost_tracker import CostTracker

logger = structlog.get_logger(__name__)

@dataclass
class UnsolvedIssue:
    """Represents an unsolved Quest development issue"""
    issue_id: str
    title: str
    error_type: str
    description: str
    forum_source: str
    url: str
    content: str
    complexity_score: float
    unique_patterns: List[Dict[str, Any]]
    research_suggestions: List[str]
    related_keywords: List[str]
    date_found: str
    last_activity: Optional[str] = None
    upvotes: int = 0
    views: int = 0
    
@dataclass
class IssueCluster:
    """Represents a cluster of related unsolved issues"""
    cluster_id: str
    cluster_name: str
    issues: List[UnsolvedIssue]
    common_patterns: List[str]
    severity: str
    potential_solution_approaches: List[str]
    research_priority: float

class UnsolvedIssuesAnalyzer:
    """
    Analyzes forum data to identify unsolved issues and patterns
    """
    
    def __init__(self, output_dir: str = "./unsolved_analysis"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.error_analyzer = RealErrorAnalyzer()
        self.cost_tracker = CostTracker()
        
        # Patterns that indicate unsolved issues
        self.unsolved_indicators = [
            r"still having.*problem",
            r"no solution.*found",
            r"anyone.*else.*experiencing",
            r"workaround.*not.*working",
            r"issue.*remains.*unresolved",
            r"bump.*still.*need.*help",
            r"updated.*still.*broken",
            r"tried.*everything",
            r"desperate.*for.*solution",
            r"please.*help.*urgent"
        ]
        
        # Keywords that indicate complexity
        self.complexity_keywords = [
            "intermittent", "random", "sometimes", "occasionally",
            "specific device", "certain conditions", "edge case",
            "race condition", "timing", "memory leak", "crash dump",
            "native code", "low level", "driver", "hardware specific"
        ]
        
        logger.info("UnsolvedIssuesAnalyzer initialized", output_dir=str(self.output_dir))
    
    async def analyze_forum_data(self, forum_data_path: str) -> Dict[str, Any]:
        """
        Analyze forum data to identify unsolved issues
        """
        logger.info("Starting unsolved issues analysis", data_path=forum_data_path)
        
        # Load forum data
        forum_posts = self._load_forum_data(forum_data_path)
        if not forum_posts:
            logger.warning("No forum data found")
            return {"unsolved_issues": [], "clusters": [], "summary": {}}
        
        # Identify unsolved issues
        unsolved_issues = []
        for post in forum_posts:
            if self._is_potentially_unsolved(post):
                issue = await self._analyze_unsolved_post(post)
                if issue:
                    unsolved_issues.append(issue)
        
        logger.info("Identified unsolved issues", count=len(unsolved_issues))
        
        # Cluster related issues
        clusters = self._cluster_unsolved_issues(unsolved_issues)
        
        # Generate comprehensive analysis
        analysis_summary = self._generate_analysis_summary(unsolved_issues, clusters)
        
        # Save results
        results = {
            "unsolved_issues": [asdict(issue) for issue in unsolved_issues],
            "clusters": [asdict(cluster) for cluster in clusters],
            "summary": analysis_summary,
            "analysis_metadata": {
                "total_posts_analyzed": len(forum_posts),
                "unsolved_issues_found": len(unsolved_issues),
                "clusters_identified": len(clusters),
                "analysis_date": datetime.now().isoformat(),
                "analyzer_version": "1.0"
            }
        }
        
        self._save_analysis_results(results)
        
        return results
    
    def _load_forum_data(self, data_path: str) -> List[Dict[str, Any]]:
        """Load forum data from JSON files"""
        data_path = Path(data_path)
        forum_posts = []
        
        if data_path.is_file() and data_path.suffix == '.json':
            # Single JSON file
            try:
                with open(data_path, 'r', encoding='utf-8') as f:
                    forum_posts = json.load(f)
            except Exception as e:
                logger.error("Failed to load forum data file", path=str(data_path), error=str(e))
                
        elif data_path.is_dir():
            # Directory with multiple JSON files
            json_files = list(data_path.glob('forum_posts_*.json'))
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        posts = json.load(f)
                        forum_posts.extend(posts)
                except Exception as e:
                    logger.error("Failed to load forum data file", path=str(json_file), error=str(e))
        
        logger.info("Loaded forum data", total_posts=len(forum_posts))
        return forum_posts
    
    def _is_potentially_unsolved(self, post: Dict[str, Any]) -> bool:
        """
        Determine if a post represents a potentially unsolved issue
        """
        # Check if post explicitly has no solution
        if post.get('has_solution', False):
            return False
        
        content = (post.get('content', '') + ' ' + post.get('title', '')).lower()
        
        # Check for unsolved indicators
        unsolved_score = 0
        for pattern in self.unsolved_indicators:
            if re.search(pattern, content, re.IGNORECASE):
                unsolved_score += 1
        
        # Check for complexity indicators
        complexity_score = 0
        for keyword in self.complexity_keywords:
            if keyword in content:
                complexity_score += 1
        
        # Check for recent activity (prefer recent unsolved issues)
        days_old = self._calculate_post_age(post.get('date_scraped', ''))
        recency_factor = 1.0 if days_old <= 30 else 0.5 if days_old <= 90 else 0.2
        
        # Calculate overall unsolved probability
        unsolved_probability = (unsolved_score * 0.4 + complexity_score * 0.3 + recency_factor * 0.3)
        
        return unsolved_probability > 0.3  # Threshold for considering as unsolved
    
    async def _analyze_unsolved_post(self, post: Dict[str, Any]) -> Optional[UnsolvedIssue]:
        """
        Perform deep analysis on a potentially unsolved post
        """
        try:
            content = post.get('content', '')
            title = post.get('title', 'Untitled')
            
            # Use enhanced error analyzer
            analysis_result = self.error_analyzer.analyze_unsolved_issues(content)
            
            # Extract unique patterns and research suggestions
            unsolved_analysis = analysis_result.get('unsolved_issue_analysis', {})
            
            # Calculate complexity score
            complexity = unsolved_analysis.get('complexity_score', 0.5)
            
            # Extract keywords
            keywords = self._extract_keywords(content, title)
            
            issue = UnsolvedIssue(
                issue_id=post.get('id', f"unsolved_{hash(title)}"),
                title=title,
                error_type=analysis_result.get('error_type', 'unknown'),
                description=self._generate_issue_description(post, analysis_result),
                forum_source=post.get('forum', 'unknown'),
                url=post.get('url', ''),
                content=content[:2000],  # Truncate for storage
                complexity_score=complexity,
                unique_patterns=unsolved_analysis.get('unique_patterns', []),
                research_suggestions=unsolved_analysis.get('research_suggestions', []),
                related_keywords=keywords,
                date_found=datetime.now().isoformat(),
                last_activity=post.get('post_date', ''),
                upvotes=post.get('upvotes', 0),
                views=0  # Not available in current data
            )
            
            logger.debug("Analyzed unsolved post", issue_id=issue.issue_id, complexity=complexity)
            return issue
            
        except Exception as e:
            logger.error("Failed to analyze unsolved post", post_id=post.get('id'), error=str(e))
            return None
    
    def _cluster_unsolved_issues(self, issues: List[UnsolvedIssue]) -> List[IssueCluster]:
        """
        Cluster related unsolved issues together
        """
        if not issues:
            return []
        
        # Group by error type first
        error_type_groups = defaultdict(list)
        for issue in issues:
            error_type_groups[issue.error_type].append(issue)
        
        clusters = []
        cluster_id = 1
        
        for error_type, error_issues in error_type_groups.items():
            if len(error_issues) < 2:
                # Single issue clusters for unique problems
                if error_issues:
                    cluster = IssueCluster(
                        cluster_id=f"cluster_{cluster_id}",
                        cluster_name=f"Unique {error_type.replace('_', ' ').title()} Issue",
                        issues=error_issues,
                        common_patterns=self._extract_common_patterns(error_issues),
                        severity=self._calculate_cluster_severity(error_issues),
                        potential_solution_approaches=self._suggest_solution_approaches(error_type, error_issues),
                        research_priority=error_issues[0].complexity_score
                    )
                    clusters.append(cluster)
                    cluster_id += 1
            else:
                # Multi-issue clusters - further cluster by keywords
                keyword_clusters = self._cluster_by_keywords(error_issues)
                
                for keyword_group, keyword_issues in keyword_clusters.items():
                    cluster = IssueCluster(
                        cluster_id=f"cluster_{cluster_id}",
                        cluster_name=f"{error_type.replace('_', ' ').title()} - {keyword_group}",
                        issues=keyword_issues,
                        common_patterns=self._extract_common_patterns(keyword_issues),
                        severity=self._calculate_cluster_severity(keyword_issues),
                        potential_solution_approaches=self._suggest_solution_approaches(error_type, keyword_issues),
                        research_priority=sum(issue.complexity_score for issue in keyword_issues) / len(keyword_issues)
                    )
                    clusters.append(cluster)
                    cluster_id += 1
        
        # Sort clusters by research priority
        clusters.sort(key=lambda x: x.research_priority, reverse=True)
        
        logger.info("Created issue clusters", count=len(clusters))
        return clusters
    
    def _cluster_by_keywords(self, issues: List[UnsolvedIssue]) -> Dict[str, List[UnsolvedIssue]]:
        """
        Cluster issues by common keywords
        """
        keyword_groups = defaultdict(list)
        
        for issue in issues:
            # Find most common keywords for this issue
            top_keywords = Counter(issue.related_keywords).most_common(3)
            
            if top_keywords:
                # Use top keyword as cluster key
                primary_keyword = top_keywords[0][0]
                keyword_groups[primary_keyword].append(issue)
            else:
                # Fallback group
                keyword_groups['miscellaneous'].append(issue)
        
        return dict(keyword_groups)
    
    def _extract_common_patterns(self, issues: List[UnsolvedIssue]) -> List[str]:
        """
        Extract common patterns across issues in a cluster
        """
        all_patterns = []
        for issue in issues:
            for pattern in issue.unique_patterns:
                all_patterns.append(pattern.get('value', ''))
        
        # Count pattern frequency
        pattern_counts = Counter(all_patterns)
        
        # Return patterns that appear in multiple issues
        common_patterns = [pattern for pattern, count in pattern_counts.items() if count > 1]
        
        return common_patterns[:5]  # Top 5 common patterns
    
    def _calculate_cluster_severity(self, issues: List[UnsolvedIssue]) -> str:
        """
        Calculate severity level for a cluster of issues
        """
        avg_complexity = sum(issue.complexity_score for issue in issues) / len(issues)
        total_upvotes = sum(issue.upvotes for issue in issues)
        
        if avg_complexity > 0.8 or total_upvotes > 50:
            return "critical"
        elif avg_complexity > 0.6 or total_upvotes > 20:
            return "high"
        elif avg_complexity > 0.4 or total_upvotes > 5:
            return "medium"
        else:
            return "low"
    
    def _suggest_solution_approaches(self, error_type: str, issues: List[UnsolvedIssue]) -> List[str]:
        """
        Suggest potential solution approaches for a cluster
        """
        approaches = []
        
        # Error-type specific approaches
        if error_type == "plugin_conflict":
            approaches.extend([
                "Investigate plugin loading order and dependencies",
                "Check for version compatibility between conflicting plugins",
                "Implement plugin priority system or exclusion rules"
            ])
        elif error_type == "sdk_mismatch":
            approaches.extend([
                "Create SDK compatibility matrix for different Quest versions",
                "Develop automated SDK version detection and recommendation",
                "Document breaking changes between SDK versions"
            ])
        elif error_type == "black_screen":
            approaches.extend([
                "Analyze GPU memory usage patterns and optimization strategies",
                "Investigate rendering pipeline bottlenecks",
                "Create diagnostic tools for VR rendering issues"
            ])
        elif error_type == "unknown":
            approaches.extend([
                "Perform detailed log analysis to identify error signatures",
                "Create minimal reproduction cases",
                "Engage with Unreal Engine and Meta development teams"
            ])
        
        # General approaches based on complexity
        avg_complexity = sum(issue.complexity_score for issue in issues) / len(issues)
        if avg_complexity > 0.7:
            approaches.extend([
                "Requires deep technical investigation",
                "Consider community collaboration for complex debugging",
                "May need engine-level fixes or workarounds"
            ])
        
        return approaches[:5]  # Limit to top 5 approaches
    
    def _generate_analysis_summary(self, issues: List[UnsolvedIssue], clusters: List[IssueCluster]) -> Dict[str, Any]:
        """
        Generate comprehensive analysis summary
        """
        # Error type distribution
        error_type_dist = Counter(issue.error_type for issue in issues)
        
        # Complexity distribution
        complexity_levels = {
            "low": len([i for i in issues if i.complexity_score < 0.4]),
            "medium": len([i for i in issues if 0.4 <= i.complexity_score < 0.7]),
            "high": len([i for i in issues if i.complexity_score >= 0.7])
        }
        
        # Forum source distribution
        forum_dist = Counter(issue.forum_source for issue in issues)
        
        # Top keywords across all issues
        all_keywords = []
        for issue in issues:
            all_keywords.extend(issue.related_keywords)
        top_keywords = Counter(all_keywords).most_common(10)
        
        # Research priorities
        critical_clusters = [c for c in clusters if c.severity == "critical"]
        high_priority_clusters = [c for c in clusters if c.severity == "high"]
        
        return {
            "total_unsolved_issues": len(issues),
            "error_type_distribution": dict(error_type_dist),
            "complexity_distribution": complexity_levels,
            "forum_source_distribution": dict(forum_dist),
            "top_keywords": dict(top_keywords),
            "cluster_summary": {
                "total_clusters": len(clusters),
                "critical_clusters": len(critical_clusters),
                "high_priority_clusters": len(high_priority_clusters),
                "avg_issues_per_cluster": len(issues) / len(clusters) if clusters else 0
            },
            "research_recommendations": self._generate_research_recommendations(issues, clusters)
        }
    
    def _generate_research_recommendations(self, issues: List[UnsolvedIssue], clusters: List[IssueCluster]) -> List[str]:
        """
        Generate high-level research recommendations
        """
        recommendations = []
        
        # Based on most common error types
        error_types = Counter(issue.error_type for issue in issues)
        top_error_type = error_types.most_common(1)[0][0] if error_types else None
        
        if top_error_type:
            recommendations.append(f"Priority focus: {top_error_type.replace('_', ' ').title()} issues represent the largest category of unsolved problems")
        
        # Based on complexity
        high_complexity_issues = [i for i in issues if i.complexity_score > 0.7]
        if high_complexity_issues:
            recommendations.append(f"{len(high_complexity_issues)} highly complex issues require expert-level investigation")
        
        # Based on forum activity
        active_forums = Counter(issue.forum_source for issue in issues).most_common(2)
        if active_forums:
            recommendations.append(f"Monitor {', '.join([f[0] for f in active_forums])} forums for emerging patterns")
        
        # Based on clusters
        critical_clusters = [c for c in clusters if c.severity == "critical"]
        if critical_clusters:
            recommendations.append(f"{len(critical_clusters)} critical issue clusters need immediate community attention")
        
        return recommendations
    
    def _calculate_post_age(self, date_str: str) -> int:
        """Calculate age of post in days"""
        try:
            post_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return (datetime.now() - post_date.replace(tzinfo=None)).days
        except:
            return 999  # Very old if can't parse
    
    def _extract_keywords(self, content: str, title: str) -> List[str]:
        """Extract relevant keywords from content and title"""
        text = (content + ' ' + title).lower()
        
        # Quest/VR specific keywords
        vr_keywords = ['quest', 'vr', 'oculus', 'meta', 'headset', 'hmd', 'xr']
        
        # Technical keywords
        tech_keywords = ['unreal', 'engine', 'plugin', 'sdk', 'android', 'vulkan', 'opengl', 'rendering']
        
        # Error keywords
        error_keywords = ['error', 'crash', 'fail', 'bug', 'issue', 'problem', 'broken']
        
        found_keywords = []
        for keyword_list in [vr_keywords, tech_keywords, error_keywords]:
            for keyword in keyword_list:
                if keyword in text:
                    found_keywords.append(keyword)
        
        # Extract version numbers
        version_matches = re.findall(r'\b\d+\.\d+(?:\.\d+)?\b', text)
        found_keywords.extend(version_matches[:3])  # Limit version numbers
        
        return list(set(found_keywords))  # Remove duplicates
    
    def _generate_issue_description(self, post: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Generate a concise description of the issue"""
        title = post.get('title', 'Unknown Issue')
        error_type = analysis.get('error_type', 'unknown')
        confidence = analysis.get('confidence', 0.0)
        
        description = f"{title} - Classified as {error_type.replace('_', ' ')} with {confidence:.1%} confidence."
        
        if 'unsolved_issue_analysis' in analysis:
            complexity = analysis['unsolved_issue_analysis'].get('complexity_score', 0.0)
            description += f" Complexity score: {complexity:.2f}."
        
        return description
    
    def _save_analysis_results(self, results: Dict[str, Any]):
        """Save analysis results to files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save full results
        results_file = self.output_dir / f"unsolved_analysis_{timestamp}.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Save summary report
        summary_file = self.output_dir / f"unsolved_summary_{timestamp}.md"
        self._generate_markdown_report(results, summary_file)
        
        logger.info("Analysis results saved", 
                   results_file=str(results_file),
                   summary_file=str(summary_file))
    
    def _generate_markdown_report(self, results: Dict[str, Any], output_file: Path):
        """Generate a human-readable markdown report"""
        summary = results['summary']
        metadata = results['analysis_metadata']
        
        report = f"""# Quest Dev Copilot - Unsolved Issues Analysis Report

Generated: {metadata['analysis_date']}
Analyzer Version: {metadata['analyzer_version']}

## Executive Summary

- **Total Posts Analyzed**: {metadata['total_posts_analyzed']:,}
- **Unsolved Issues Identified**: {metadata['unsolved_issues_found']:,}
- **Issue Clusters**: {metadata['clusters_identified']}

## Issue Distribution

### By Error Type
"""
        
        for error_type, count in summary['error_type_distribution'].items():
            report += f"- **{error_type.replace('_', ' ').title()}**: {count} issues\n"
        
        report += f"""
### By Complexity Level
- **High Complexity**: {summary['complexity_distribution']['high']} issues
- **Medium Complexity**: {summary['complexity_distribution']['medium']} issues  
- **Low Complexity**: {summary['complexity_distribution']['low']} issues

### By Forum Source
"""
        
        for forum, count in summary['forum_source_distribution'].items():
            report += f"- **{forum.title()}**: {count} issues\n"
        
        report += f"""
## Top Keywords
"""
        
        for keyword, count in summary['top_keywords']:
            report += f"- **{keyword}**: {count} occurrences\n"
        
        report += f"""
## Research Recommendations

"""
        
        for rec in summary['research_recommendations']:
            report += f"- {rec}\n"
        
        report += f"""
## Critical Clusters

{summary['cluster_summary']['critical_clusters']} clusters require immediate attention.

---

*This report was generated automatically by Quest Dev Copilot's Unsolved Issues Analyzer.*
"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)

async def main():
    """Main entry point for unsolved issues analysis"""
    analyzer = UnsolvedIssuesAnalyzer()
    
    # Check for scraped forum data
    scraper_data_dir = Path("./quest-dev-copilot/scraper/scraped_data")
    
    if scraper_data_dir.exists():
        logger.info("Starting unsolved issues analysis with scraped data")
        results = await analyzer.analyze_forum_data(str(scraper_data_dir))
        
        print("\n🎯 UNSOLVED ISSUES ANALYSIS COMPLETE!")
        print(f"📊 Found {results['analysis_metadata']['unsolved_issues_found']} unsolved issues")
        print(f"🔍 Created {results['analysis_metadata']['clusters_identified']} issue clusters")
        print(f"📝 Analysis saved to: {analyzer.output_dir}")
        
        # Show top findings
        if results['summary']['research_recommendations']:
            print("\n🚨 TOP RESEARCH RECOMMENDATIONS:")
            for i, rec in enumerate(results['summary']['research_recommendations'][:3], 1):
                print(f"{i}. {rec}")
    else:
        print("❌ No scraped forum data found. Please run the forum scraper first.")
        print("   Run: cd quest-dev-copilot && python -m scraper.forum_scraper")

if __name__ == "__main__":
    asyncio.run(main()) 