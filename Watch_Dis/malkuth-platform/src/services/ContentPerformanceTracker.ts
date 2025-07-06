import { ContentMetrics, ContentPerformanceAnalysis, AnalyticsMetric } from '@/types';

export class ContentPerformanceTracker {
  /**
   * Analyze content performance comprehensively
   */
  static analyzeContentPerformance(
    contentMetrics: ContentMetrics,
    historicalData?: ContentMetrics[]
  ): ContentPerformanceAnalysis {
    const performanceMetrics = this.calculatePerformanceMetrics(contentMetrics);
    const audienceInsights = this.analyzeAudienceInsights(contentMetrics, historicalData);
    const optimization = this.generateOptimizationSuggestions(contentMetrics, performanceMetrics);

    return {
      contentId: contentMetrics.contentId,
      performanceMetrics,
      audienceInsights,
      optimization
    };
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private static calculatePerformanceMetrics(metrics: ContentMetrics) {
    const reach = this.calculateReach(metrics);
    const engagement = this.calculateEngagement(metrics);
    const virality = this.calculateVirality(metrics);
    const authenticity = this.calculateAuthenticity(metrics);

    return {
      reach,
      engagement,
      virality,
      authenticity
    };
  }

  /**
   * Calculate reach score (0-100)
   */
  private static calculateReach(metrics: ContentMetrics): number {
    // Normalize views to a 0-100 scale
    // This would be based on your platform's typical view ranges
    const maxExpectedViews = 100000; // Adjust based on your platform
    return Math.min(100, (metrics.views / maxExpectedViews) * 100);
  }

  /**
   * Calculate engagement score (0-100)
   */
  private static calculateEngagement(metrics: ContentMetrics): number {
    const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
    const engagementRate = metrics.views > 0 ? (totalEngagement / metrics.views) * 100 : 0;
    
    // Normalize to 0-100 scale (assuming 10% is excellent engagement)
    return Math.min(100, engagementRate * 10);
  }

  /**
   * Calculate virality score (0-100)
   */
  private static calculateVirality(metrics: ContentMetrics): number {
    const shareRate = metrics.views > 0 ? (metrics.shares / metrics.views) * 100 : 0;
    const viralityCoefficient = metrics.shares > 0 ? metrics.views / metrics.shares : 0;
    
    // Combine share rate and virality coefficient
    const baseScore = shareRate * 20; // Share rate contributes 20x
    const viralityBonus = viralityCoefficient > 50 ? 30 : 0; // Bonus for high virality
    
    return Math.min(100, baseScore + viralityBonus);
  }

  /**
   * Calculate authenticity score (0-100)
   */
  private static calculateAuthenticity(metrics: ContentMetrics): number {
    let score = 100;
    
    // Check for suspicious patterns
    const likesToViewsRatio = metrics.views > 0 ? metrics.likes / metrics.views : 0;
    const commentsToLikesRatio = metrics.likes > 0 ? metrics.comments / metrics.likes : 0;
    
    // Penalize unusually high like rates
    if (likesToViewsRatio > 0.8) score -= 40;
    else if (likesToViewsRatio > 0.5) score -= 20;
    
    // Penalize low comment engagement
    if (commentsToLikesRatio < 0.01 && metrics.likes > 100) score -= 30;
    else if (commentsToLikesRatio < 0.05 && metrics.likes > 50) score -= 15;
    
    // Reward natural engagement patterns
    if (commentsToLikesRatio >= 0.05 && commentsToLikesRatio <= 0.3) score += 10;
    
    return Math.max(0, score);
  }

  /**
   * Analyze audience insights
   */
  private static analyzeAudienceInsights(
    metrics: ContentMetrics,
    historicalData?: ContentMetrics[]
  ) {
    // In a real implementation, this would analyze actual audience data
    // For now, we'll generate insights based on engagement patterns
    
    const demographics = this.estimateDemographics(metrics);
    const preferences = this.analyzePreferences(metrics, historicalData);
    const engagementTimes = this.analyzeEngagementTimes(metrics);

    return {
      demographics,
      preferences,
      engagementTimes
    };
  }

  /**
   * Estimate audience demographics from engagement patterns
   */
  private static estimateDemographics(metrics: ContentMetrics): Record<string, number> {
    // This is a simplified estimation - in reality, you'd have actual demographic data
    const engagementRate = metrics.views > 0 ? (metrics.likes + metrics.comments) / metrics.views : 0;
    
    return {
      'age_18_24': engagementRate > 0.15 ? 40 : 25,
      'age_25_34': engagementRate > 0.1 ? 35 : 30,
      'age_35_44': engagementRate > 0.05 ? 20 : 25,
      'age_45_plus': engagementRate > 0.02 ? 5 : 20
    };
  }

  /**
   * Analyze audience preferences
   */
  private static analyzePreferences(
    metrics: ContentMetrics,
    historicalData?: ContentMetrics[]
  ): string[] {
    const preferences: string[] = [];
    
    // Analyze current content engagement
    const engagementRate = metrics.views > 0 ? (metrics.likes + metrics.comments) / metrics.views : 0;
    const shareRate = metrics.views > 0 ? metrics.shares / metrics.views : 0;
    
    if (engagementRate > 0.1) {
      preferences.push('high_engagement_content');
    }
    
    if (shareRate > 0.02) {
      preferences.push('shareable_content');
    }
    
    if (metrics.comments > metrics.likes * 0.1) {
      preferences.push('discussion_worthy_content');
    }
    
    // Analyze historical patterns if available
    if (historicalData && historicalData.length > 0) {
      const avgEngagement = historicalData.reduce((sum, m) => 
        sum + (m.views > 0 ? (m.likes + m.comments) / m.views : 0), 0
      ) / historicalData.length;
      
      if (engagementRate > avgEngagement * 1.2) {
        preferences.push('above_average_appeal');
      }
    }
    
    return preferences;
  }

  /**
   * Analyze optimal engagement times
   */
  private static analyzeEngagementTimes(metrics: ContentMetrics): number[] {
    // This would analyze when the content received most engagement
    // For now, we'll return typical peak hours
    const peakHours = [9, 12, 15, 18, 21]; // 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
    
    // Adjust based on content performance
    const engagementRate = metrics.views > 0 ? (metrics.likes + metrics.comments) / metrics.views : 0;
    
    if (engagementRate > 0.15) {
      // High engagement content might work well at more times
      return [8, 9, 11, 12, 14, 15, 17, 18, 20, 21];
    }
    
    return peakHours;
  }

  /**
   * Generate optimization suggestions
   */
  private static generateOptimizationSuggestions(
    metrics: ContentMetrics,
    performanceMetrics: any
  ) {
    const suggestedTags = this.suggestTags(metrics, performanceMetrics);
    const bestPostTimes = this.suggestBestPostTimes(metrics);
    const contentRecommendations = this.generateContentRecommendations(metrics, performanceMetrics);

    return {
      suggestedTags,
      bestPostTimes,
      contentRecommendations
    };
  }

  /**
   * Suggest relevant tags for content
   */
  private static suggestTags(metrics: ContentMetrics, performanceMetrics: any): string[] {
    const tags: string[] = [];
    
    // Performance-based tags
    if (performanceMetrics.engagement > 70) {
      tags.push('trending', 'popular');
    }
    
    if (performanceMetrics.virality > 60) {
      tags.push('viral', 'shareable');
    }
    
    if (performanceMetrics.authenticity > 80) {
      tags.push('authentic', 'genuine');
    }
    
    // Content type tags
    if (metrics.contentType === 'post') {
      tags.push('content', 'social');
    }
    
    // Engagement pattern tags
    const commentRate = metrics.likes > 0 ? metrics.comments / metrics.likes : 0;
    if (commentRate > 0.2) {
      tags.push('discussion', 'engaging');
    }
    
    return tags;
  }

  /**
   * Suggest best posting times
   */
  private static suggestBestPostTimes(metrics: ContentMetrics): number[] {
    // Analyze current content performance to suggest optimal times
    const engagementRate = metrics.views > 0 ? (metrics.likes + metrics.comments) / metrics.views : 0;
    
    if (engagementRate > 0.15) {
      // High performing content - suggest peak times
      return [9, 12, 15, 18, 21];
    } else if (engagementRate > 0.05) {
      // Moderate performance - suggest wider range
      return [8, 10, 13, 16, 19];
    } else {
      // Low performance - suggest off-peak times for less competition
      return [7, 11, 14, 17, 22];
    }
  }

  /**
   * Generate content recommendations
   */
  private static generateContentRecommendations(
    metrics: ContentMetrics,
    performanceMetrics: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Based on reach
    if (performanceMetrics.reach < 30) {
      recommendations.push('Use trending hashtags to increase visibility');
      recommendations.push('Cross-promote on other platforms');
    }
    
    // Based on engagement
    if (performanceMetrics.engagement < 40) {
      recommendations.push('Add call-to-action elements to encourage interaction');
      recommendations.push('Create content that sparks conversation');
    }
    
    // Based on virality
    if (performanceMetrics.virality < 20) {
      recommendations.push('Include shareable elements like quotes or visuals');
      recommendations.push('Create content that evokes strong emotions');
    }
    
    // Based on authenticity
    if (performanceMetrics.authenticity < 60) {
      recommendations.push('Review engagement patterns for potential bot activity');
      recommendations.push('Focus on organic growth strategies');
    }
    
    // Content type specific recommendations
    if (metrics.contentType === 'post') {
      recommendations.push('Experiment with different post formats');
      recommendations.push('Include visual elements to increase engagement');
    }
    
    return recommendations;
  }

  /**
   * Track content performance over time
   */
  static trackPerformanceOverTime(
    contentId: string,
    metrics: ContentMetrics[]
  ): {
    trends: {
      views: number[];
      likes: number[];
      comments: number[];
      shares: number[];
    };
    growth: {
      viewsGrowth: number;
      likesGrowth: number;
      commentsGrowth: number;
      sharesGrowth: number;
    };
    predictions: {
      predictedViews: number;
      predictedLikes: number;
      predictedComments: number;
      predictedShares: number;
    };
  } {
    if (metrics.length < 2) {
      return {
        trends: { views: [], likes: [], comments: [], shares: [] },
        growth: { viewsGrowth: 0, likesGrowth: 0, commentsGrowth: 0, sharesGrowth: 0 },
        predictions: { predictedViews: 0, predictedLikes: 0, predictedComments: 0, predictedShares: 0 }
      };
    }

    const sortedMetrics = metrics.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const trends = {
      views: sortedMetrics.map(m => m.views),
      likes: sortedMetrics.map(m => m.likes),
      comments: sortedMetrics.map(m => m.comments),
      shares: sortedMetrics.map(m => m.shares)
    };

    const growth = this.calculateGrowthRates(sortedMetrics);
    const predictions = this.predictFuturePerformance(sortedMetrics);

    return { trends, growth, predictions };
  }

  /**
   * Calculate growth rates for metrics
   */
  private static calculateGrowthRates(metrics: ContentMetrics[]) {
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    return {
      viewsGrowth: this.calculateGrowthRate(first.views, last.views),
      likesGrowth: this.calculateGrowthRate(first.likes, last.likes),
      commentsGrowth: this.calculateGrowthRate(first.comments, last.comments),
      sharesGrowth: this.calculateGrowthRate(first.shares, last.shares)
    };
  }

  /**
   * Calculate growth rate between two values
   */
  private static calculateGrowthRate(initial: number, final: number): number {
    if (initial === 0) return final > 0 ? 100 : 0;
    return ((final - initial) / initial) * 100;
  }

  /**
   * Predict future performance using linear regression
   */
  private static predictFuturePerformance(metrics: ContentMetrics[]) {
    const predictedViews = this.predictValue(metrics.map(m => m.views));
    const predictedLikes = this.predictValue(metrics.map(m => m.likes));
    const predictedComments = this.predictValue(metrics.map(m => m.comments));
    const predictedShares = this.predictValue(metrics.map(m => m.shares));

    return {
      predictedViews,
      predictedLikes,
      predictedComments,
      predictedShares
    };
  }

  /**
   * Predict next value using simple linear regression
   */
  private static predictValue(values: number[]): number {
    if (values.length < 2) return values[0] || 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return Math.max(0, slope * n + intercept);
  }

  /**
   * Compare content performance against benchmarks
   */
  static benchmarkContent(
    metrics: ContentMetrics,
    benchmarks: {
      averageViews: number;
      averageLikes: number;
      averageComments: number;
      averageShares: number;
    }
  ): {
    viewsRank: number;
    likesRank: number;
    commentsRank: number;
    sharesRank: number;
    overallRank: number;
  } {
    const viewsRank = (metrics.views / benchmarks.averageViews) * 100;
    const likesRank = (metrics.likes / benchmarks.averageLikes) * 100;
    const commentsRank = (metrics.comments / benchmarks.averageComments) * 100;
    const sharesRank = (metrics.shares / benchmarks.averageShares) * 100;
    
    const overallRank = (viewsRank + likesRank + commentsRank + sharesRank) / 4;
    
    return {
      viewsRank: Math.min(200, viewsRank),
      likesRank: Math.min(200, likesRank),
      commentsRank: Math.min(200, commentsRank),
      sharesRank: Math.min(200, sharesRank),
      overallRank: Math.min(200, overallRank)
    };
  }
}

export const contentPerformanceTracker = ContentPerformanceTracker;