import { BotMetrics, BotBehaviorAnalysis, EngagementPattern } from '@/types';

export class BotBehaviorAnalyzer {
  /**
   * Analyze bot behavior patterns
   */
  static analyzeBotBehavior(
    botMetrics: BotMetrics,
    engagementPatterns: EngagementPattern[]
  ): BotBehaviorAnalysis {
    const patterns = this.extractPatterns(botMetrics, engagementPatterns);
    const anomalies = this.detectAnomalies(botMetrics, patterns);
    const recommendations = this.generateRecommendations(botMetrics, anomalies);

    return {
      botId: botMetrics.botId,
      patterns,
      anomalies,
      recommendations
    };
  }

  /**
   * Extract behavior patterns from metrics
   */
  private static extractPatterns(
    botMetrics: BotMetrics,
    engagementPatterns: EngagementPattern[]
  ) {
    // Extract activity hours from engagement patterns
    const activityHours = this.extractActivityHours(engagementPatterns);
    
    // Analyze interaction types
    const interactionTypes = this.analyzeInteractionTypes(botMetrics);
    
    // Extract response patterns
    const responsePatterns = this.extractResponsePatterns(botMetrics);
    
    // Calculate engagement trends
    const engagementTrends = this.calculateEngagementTrends(engagementPatterns);

    return {
      activityHours,
      interactionTypes,
      responsePatterns,
      engagementTrends
    };
  }

  /**
   * Extract peak activity hours
   */
  private static extractActivityHours(patterns: EngagementPattern[]): number[] {
    const hourlyActivity: { [hour: number]: number } = {};
    
    patterns.forEach(pattern => {
      if (!hourlyActivity[pattern.hour]) {
        hourlyActivity[pattern.hour] = 0;
      }
      hourlyActivity[pattern.hour] += pattern.botActivity;
    });

    // Find top 6 most active hours
    return Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Analyze interaction types distribution
   */
  private static analyzeInteractionTypes(metrics: BotMetrics): Record<string, number> {
    // In a real implementation, this would analyze actual interaction data
    // For now, we'll simulate based on bot metrics
    const totalInteractions = metrics.totalInteractions;
    
    return {
      'likes': Math.floor(totalInteractions * 0.5),
      'comments': Math.floor(totalInteractions * 0.3),
      'shares': Math.floor(totalInteractions * 0.15),
      'direct_messages': Math.floor(totalInteractions * 0.05)
    };
  }

  /**
   * Extract response patterns
   */
  private static extractResponsePatterns(metrics: BotMetrics): string[] {
    const patterns: string[] = [];
    
    // Analyze response time patterns
    if (metrics.averageResponseTime < 500) {
      patterns.push('ultra_fast_responses');
    } else if (metrics.averageResponseTime < 2000) {
      patterns.push('fast_responses');
    } else if (metrics.averageResponseTime > 10000) {
      patterns.push('slow_responses');
    }
    
    // Analyze engagement quality patterns
    if (metrics.engagementQuality > 80) {
      patterns.push('high_quality_engagement');
    } else if (metrics.engagementQuality < 40) {
      patterns.push('low_quality_engagement');
    }
    
    // Analyze error patterns
    if (metrics.errorRate > 0.1) {
      patterns.push('high_error_rate');
    } else if (metrics.errorRate < 0.01) {
      patterns.push('reliable_performance');
    }
    
    return patterns;
  }

  /**
   * Calculate engagement trends over time
   */
  private static calculateEngagementTrends(patterns: EngagementPattern[]): number[] {
    if (patterns.length === 0) return [];
    
    // Sort patterns by time and calculate rolling average
    const sortedPatterns = patterns.sort((a, b) => 
      new Date(a.timeSlot).getTime() - new Date(b.timeSlot).getTime()
    );
    
    const trends: number[] = [];
    const windowSize = 5;
    
    for (let i = 0; i < sortedPatterns.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = sortedPatterns.slice(start, i + 1);
      const average = window.reduce((sum, p) => sum + p.botActivity, 0) / window.length;
      trends.push(average);
    }
    
    return trends;
  }

  /**
   * Detect behavioral anomalies
   */
  private static detectAnomalies(
    metrics: BotMetrics,
    patterns: any
  ): BotBehaviorAnalysis['anomalies'] {
    const anomalies: BotBehaviorAnalysis['anomalies'] = [];
    
    // Check for unusual response times
    if (metrics.averageResponseTime > 30000) {
      anomalies.push({
        timestamp: new Date(),
        type: 'slow_response',
        severity: 'high',
        description: 'Average response time exceeds 30 seconds'
      });
    }
    
    // Check for high error rates
    if (metrics.errorRate > 0.2) {
      anomalies.push({
        timestamp: new Date(),
        type: 'high_error_rate',
        severity: 'high',
        description: 'Error rate exceeds 20%'
      });
    }
    
    // Check for unusual activity patterns
    if (patterns.activityHours.length < 3) {
      anomalies.push({
        timestamp: new Date(),
        type: 'limited_activity',
        severity: 'medium',
        description: 'Bot shows activity in fewer than 3 hours per day'
      });
    }
    
    // Check for low engagement quality
    if (metrics.engagementQuality < 30) {
      anomalies.push({
        timestamp: new Date(),
        type: 'poor_engagement',
        severity: 'medium',
        description: 'Engagement quality below acceptable threshold'
      });
    }
    
    // Check for inactive bots
    if (!metrics.isActive && metrics.totalInteractions === 0) {
      anomalies.push({
        timestamp: new Date(),
        type: 'inactive_bot',
        severity: 'low',
        description: 'Bot appears to be inactive with no recent interactions'
      });
    }
    
    return anomalies;
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    metrics: BotMetrics,
    anomalies: BotBehaviorAnalysis['anomalies']
  ): string[] {
    const recommendations: string[] = [];
    
    // Response time recommendations
    if (metrics.averageResponseTime > 5000) {
      recommendations.push('Optimize bot response algorithms to reduce latency');
    }
    
    // Error rate recommendations
    if (metrics.errorRate > 0.05) {
      recommendations.push('Review error logs and improve error handling mechanisms');
    }
    
    // Engagement quality recommendations
    if (metrics.engagementQuality < 50) {
      recommendations.push('Enhance bot personality and conversation flows');
      recommendations.push('Implement more contextual responses');
    }
    
    // Activity pattern recommendations
    if (anomalies.some(a => a.type === 'limited_activity')) {
      recommendations.push('Expand bot activity hours to increase engagement opportunities');
    }
    
    // General performance recommendations
    if (metrics.totalInteractions < 100) {
      recommendations.push('Increase bot visibility and engagement triggers');
    }
    
    // Specific anomaly-based recommendations
    anomalies.forEach(anomaly => {
      switch (anomaly.type) {
        case 'slow_response':
          recommendations.push('Implement caching mechanisms to improve response times');
          break;
        case 'high_error_rate':
          recommendations.push('Add comprehensive error logging and monitoring');
          break;
        case 'poor_engagement':
          recommendations.push('A/B test different response styles and personalities');
          break;
        case 'inactive_bot':
          recommendations.push('Investigate bot deployment and activation status');
          break;
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Compare bot performance against benchmarks
   */
  static benchmarkBot(botMetrics: BotMetrics): {
    responseTimeRank: number;
    engagementRank: number;
    reliabilityRank: number;
    overallRank: number;
  } {
    // Industry benchmarks (these would come from actual data)
    const benchmarks = {
      responseTime: 2000, // 2 seconds
      engagementQuality: 70,
      errorRate: 0.03
    };
    
    const responseTimeRank = this.calculateRank(
      metrics.averageResponseTime,
      benchmarks.responseTime,
      'lower_is_better'
    );
    
    const engagementRank = this.calculateRank(
      botMetrics.engagementQuality,
      benchmarks.engagementQuality,
      'higher_is_better'
    );
    
    const reliabilityRank = this.calculateRank(
      botMetrics.errorRate,
      benchmarks.errorRate,
      'lower_is_better'
    );
    
    const overallRank = Math.round(
      (responseTimeRank + engagementRank + reliabilityRank) / 3
    );
    
    return {
      responseTimeRank,
      engagementRank,
      reliabilityRank,
      overallRank
    };
  }

  /**
   * Calculate performance rank against benchmark
   */
  private static calculateRank(
    value: number,
    benchmark: number,
    direction: 'higher_is_better' | 'lower_is_better'
  ): number {
    if (direction === 'higher_is_better') {
      return Math.min(100, Math.max(0, (value / benchmark) * 100));
    } else {
      return Math.min(100, Math.max(0, (benchmark / value) * 100));
    }
  }

  /**
   * Predict bot behavior trends
   */
  static predictBehaviorTrends(
    historicalMetrics: BotMetrics[],
    patterns: EngagementPattern[]
  ): {
    predictedEngagement: number;
    predictedResponseTime: number;
    predictedErrorRate: number;
    confidence: number;
  } {
    if (historicalMetrics.length < 3) {
      return {
        predictedEngagement: 0,
        predictedResponseTime: 0,
        predictedErrorRate: 0,
        confidence: 0
      };
    }
    
    // Simple linear regression for prediction
    const engagementTrend = this.calculateLinearTrend(
      historicalMetrics.map(m => m.engagementQuality)
    );
    
    const responseTimeTrend = this.calculateLinearTrend(
      historicalMetrics.map(m => m.averageResponseTime)
    );
    
    const errorRateTrend = this.calculateLinearTrend(
      historicalMetrics.map(m => m.errorRate)
    );
    
    const confidence = Math.min(100, historicalMetrics.length * 10);
    
    return {
      predictedEngagement: engagementTrend,
      predictedResponseTime: responseTimeTrend,
      predictedErrorRate: errorRateTrend,
      confidence
    };
  }

  /**
   * Calculate linear trend for predictions
   */
  private static calculateLinearTrend(values: number[]): number {
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
    
    // Predict next value
    return slope * n + intercept;
  }

  /**
   * Generate bot health score
   */
  static calculateBotHealthScore(metrics: BotMetrics): number {
    let score = 100;
    
    // Response time factor (30% of score)
    if (metrics.averageResponseTime > 10000) score -= 30;
    else if (metrics.averageResponseTime > 5000) score -= 15;
    else if (metrics.averageResponseTime < 1000) score += 5;
    
    // Error rate factor (25% of score)
    if (metrics.errorRate > 0.1) score -= 25;
    else if (metrics.errorRate > 0.05) score -= 15;
    else if (metrics.errorRate < 0.01) score += 5;
    
    // Engagement quality factor (25% of score)
    score += (metrics.engagementQuality - 50) * 0.5;
    
    // Activity factor (20% of score)
    if (!metrics.isActive) score -= 20;
    else if (metrics.totalInteractions < 10) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

export const botBehaviorAnalyzer = BotBehaviorAnalyzer;