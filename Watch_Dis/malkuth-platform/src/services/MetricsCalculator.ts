import { ContentMetrics, BotMetrics, EngagementPattern, AnalyticsMetric } from '@/types';

export class MetricsCalculator {
  /**
   * Calculate engagement rate for content
   */
  static calculateEngagementRate(metrics: ContentMetrics): number {
    const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
    return metrics.views > 0 ? (totalEngagement / metrics.views) * 100 : 0;
  }

  /**
   * Calculate authenticity score based on engagement patterns
   */
  static calculateAuthenticityScore(metrics: ContentMetrics): number {
    // Base score starts at 100
    let score = 100;
    
    // Reduce score for suspicious patterns
    const likesToViewsRatio = metrics.views > 0 ? metrics.likes / metrics.views : 0;
    const commentsToLikesRatio = metrics.likes > 0 ? metrics.comments / metrics.likes : 0;
    
    // Penalize unusually high engagement rates (potential bot activity)
    if (likesToViewsRatio > 0.8) score -= 30;
    if (likesToViewsRatio > 0.5) score -= 15;
    
    // Penalize low comment-to-like ratios (bots typically don't comment)
    if (commentsToLikesRatio < 0.02 && metrics.likes > 50) score -= 20;
    if (commentsToLikesRatio < 0.05 && metrics.likes > 100) score -= 10;
    
    // Bonus for natural engagement patterns
    if (commentsToLikesRatio >= 0.1 && commentsToLikesRatio <= 0.3) score += 10;
    if (likesToViewsRatio >= 0.05 && likesToViewsRatio <= 0.15) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate performance score combining multiple factors
   */
  static calculatePerformanceScore(metrics: ContentMetrics): number {
    const engagementRate = this.calculateEngagementRate(metrics);
    const authenticityScore = this.calculateAuthenticityScore(metrics);
    const viralityScore = this.calculateViralityScore(metrics);
    
    // Weighted average
    return (engagementRate * 0.4 + authenticityScore * 0.3 + viralityScore * 0.3);
  }

  /**
   * Calculate virality score based on share patterns
   */
  static calculateViralityScore(metrics: ContentMetrics): number {
    const shareRate = metrics.views > 0 ? (metrics.shares / metrics.views) * 100 : 0;
    const likeToShareRatio = metrics.shares > 0 ? metrics.likes / metrics.shares : 0;
    
    let score = shareRate * 10; // Base score from share rate
    
    // Adjust for natural sharing patterns
    if (likeToShareRatio >= 5 && likeToShareRatio <= 20) score += 20;
    if (shareRate > 5) score += 30; // High share rate bonus
    
    return Math.min(100, score);
  }

  /**
   * Calculate bot quality score
   */
  static calculateBotQualityScore(metrics: BotMetrics): number {
    let score = 50; // Base score
    
    // Response time score (lower is better)
    if (metrics.averageResponseTime < 1000) score += 20;
    else if (metrics.averageResponseTime < 3000) score += 10;
    else if (metrics.averageResponseTime > 10000) score -= 20;
    
    // Error rate score (lower is better)
    if (metrics.errorRate < 0.01) score += 20;
    else if (metrics.errorRate < 0.05) score += 10;
    else if (metrics.errorRate > 0.1) score -= 30;
    
    // Engagement quality score
    score += metrics.engagementQuality * 0.3;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate trend from historical data
   */
  static calculateTrend(current: number, previous: number): {
    change: number;
    changeType: 'increase' | 'decrease' | 'neutral';
    percentage: number;
  } {
    const change = current - previous;
    const percentage = previous > 0 ? (change / previous) * 100 : 0;
    
    let changeType: 'increase' | 'decrease' | 'neutral' = 'neutral';
    if (Math.abs(percentage) > 1) {
      changeType = change > 0 ? 'increase' : 'decrease';
    }
    
    return { change, changeType, percentage };
  }

  /**
   * Calculate engagement patterns for heatmap
   */
  static calculateEngagementHeatmap(patterns: EngagementPattern[]): number[][] {
    const heatmap: number[][] = Array(24).fill(0).map(() => Array(7).fill(0));
    
    patterns.forEach(pattern => {
      if (pattern.hour >= 0 && pattern.hour < 24 && pattern.day >= 0 && pattern.day < 7) {
        heatmap[pattern.hour][pattern.day] = pattern.interactions;
      }
    });
    
    return heatmap;
  }

  /**
   * Calculate moving average for smoothing data
   */
  static calculateMovingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const end = i + 1;
      const window = data.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    
    return result;
  }

  /**
   * Calculate correlation between two metrics
   */
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate percentile rank
   */
  static calculatePercentileRank(value: number, dataset: number[]): number {
    if (dataset.length === 0) return 0;
    
    const sorted = [...dataset].sort((a, b) => a - b);
    const rank = sorted.filter(x => x <= value).length;
    
    return (rank / sorted.length) * 100;
  }

  /**
   * Calculate standard deviation
   */
  static calculateStandardDeviation(data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Detect anomalies using z-score
   */
  static detectAnomalies(data: number[], threshold: number = 3): number[] {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = this.calculateStandardDeviation(data);
    
    return data.map((value, index) => {
      const zScore = stdDev === 0 ? 0 : Math.abs(value - mean) / stdDev;
      return zScore > threshold ? index : -1;
    }).filter(index => index !== -1);
  }

  /**
   * Calculate growth rate
   */
  static calculateGrowthRate(initialValue: number, finalValue: number, periods: number): number {
    if (initialValue === 0 || periods === 0) return 0;
    return Math.pow(finalValue / initialValue, 1 / periods) - 1;
  }

  /**
   * Calculate conversion rate
   */
  static calculateConversionRate(conversions: number, total: number): number {
    return total > 0 ? (conversions / total) * 100 : 0;
  }

  /**
   * Calculate retention rate
   */
  static calculateRetentionRate(retained: number, total: number): number {
    return total > 0 ? (retained / total) * 100 : 0;
  }

  /**
   * Calculate churn rate
   */
  static calculateChurnRate(churned: number, total: number): number {
    return total > 0 ? (churned / total) * 100 : 0;
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   */
  static calculateCAGR(beginningValue: number, endingValue: number, periods: number): number {
    if (beginningValue === 0 || periods === 0) return 0;
    return Math.pow(endingValue / beginningValue, 1 / periods) - 1;
  }

  /**
   * Generate insights based on metrics
   */
  static generateInsights(metrics: AnalyticsMetric[]): string[] {
    const insights: string[] = [];
    
    // Analyze trends
    const positiveMetrics = metrics.filter(m => m.changeType === 'increase').length;
    const negativeMetrics = metrics.filter(m => m.changeType === 'decrease').length;
    
    if (positiveMetrics > negativeMetrics) {
      insights.push('Overall performance is trending upward with strong growth across key metrics');
    } else if (negativeMetrics > positiveMetrics) {
      insights.push('Several metrics are declining - review strategy and identify improvement areas');
    }
    
    // Analyze specific metrics
    const engagementMetric = metrics.find(m => m.name.toLowerCase().includes('engagement'));
    if (engagementMetric && engagementMetric.change > 20) {
      insights.push('Engagement rates are significantly higher - current content strategy is effective');
    }
    
    const authenticityMetric = metrics.find(m => m.name.toLowerCase().includes('authenticity'));
    if (authenticityMetric && authenticityMetric.value < 70) {
      insights.push('Authenticity scores are below optimal - monitor for potential bot activity');
    }
    
    return insights;
  }
}

export const metricsCalculator = MetricsCalculator;