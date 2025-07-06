import {
  EngagementCampaign,
  CampaignAnalytics,
  EngagementType,
  EngagementPhase,
  Content,
  BotPersona,
  Engagement
} from '../types';

export interface RealTimeMetrics {
  currentViews: number;
  currentLikes: number;
  currentComments: number;
  currentShares: number;
  engagementRate: number;
  authenticityScore: number;
  botActivity: number;
  humanActivity: number;
  timestamp: Date;
}

export interface EngagementTrend {
  timestamp: Date;
  type: EngagementType;
  count: number;
  velocity: number;
  authenticity: number;
}

export interface ContentPerformance {
  contentId: string;
  title: string;
  totalEngagements: number;
  engagementRate: number;
  virality: number;
  authenticityScore: number;
  phaseBreakdown: Record<EngagementPhase, number>;
  timeline: EngagementTrend[];
  topPerformingHours: number[];
  botContribution: number;
  humanContribution: number;
}

export interface BotActivityReport {
  botId: string;
  name: string;
  totalEngagements: number;
  authenticityScore: number;
  engagementTypes: Record<EngagementType, number>;
  activityHours: number[];
  contentCategories: Record<string, number>;
  successRate: number;
  flaggedActivities: string[];
}

export interface CampaignReport {
  campaignId: string;
  contentId: string;
  status: string;
  duration: number;
  targetMetrics: Record<EngagementType, number>;
  actualMetrics: Record<EngagementType, number>;
  completionRate: number;
  authenticityScore: number;
  efficiency: number;
  costEffectiveness: number;
  recommendations: string[];
}

export interface AnomalyDetection {
  type: 'velocity' | 'clustering' | 'pattern' | 'authenticity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedContent: string[];
  affectedBots: string[];
  detectedAt: Date;
  recommendedActions: string[];
}

export class EngagementAnalyticsService {
  private metrics: Map<string, RealTimeMetrics[]> = new Map();
  private contentPerformance: Map<string, ContentPerformance> = new Map();
  private botReports: Map<string, BotActivityReport> = new Map();
  private campaignReports: Map<string, CampaignReport> = new Map();
  private anomalies: AnomalyDetection[] = [];

  private readonly metricsRetentionHours = 168; // 7 days
  private readonly anomalyThresholds = {
    velocitySpike: 5.0, // 5x normal velocity
    clusteringIndex: 0.8, // 80% clustering
    authenticityDrop: 0.3, // Below 30% authenticity
    suspiciousPatterns: 0.7 // 70% pattern similarity
  };

  constructor() {
    this.startPeriodicAnalysis();
  }

  /**
   * Record engagement event for analytics
   */
  public recordEngagement(
    contentId: string,
    engagement: Engagement,
    isBot: boolean = true
  ): void {
    this.updateRealTimeMetrics(contentId, engagement, isBot);
    this.updateContentPerformance(contentId, engagement);
    
    if (isBot) {
      this.updateBotActivity(engagement.botId, engagement);
    }
    
    // Check for anomalies
    this.detectAnomalies(contentId, engagement);
  }

  /**
   * Get real-time metrics for content
   */
  public getRealTimeMetrics(contentId: string): RealTimeMetrics | null {
    const metrics = this.metrics.get(contentId);
    if (!metrics || metrics.length === 0) return null;
    
    return metrics[metrics.length - 1]; // Return latest metrics
  }

  /**
   * Get engagement trends for content
   */
  public getEngagementTrends(
    contentId: string,
    hours: number = 24
  ): EngagementTrend[] {
    const performance = this.contentPerformance.get(contentId);
    if (!performance) return [];
    
    const cutoff = Date.now() - (hours * 3600000);
    return performance.timeline.filter(trend => 
      trend.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get content performance analytics
   */
  public getContentPerformance(contentId: string): ContentPerformance | null {
    return this.contentPerformance.get(contentId) || null;
  }

  /**
   * Get bot activity report
   */
  public getBotActivityReport(botId: string): BotActivityReport | null {
    return this.botReports.get(botId) || null;
  }

  /**
   * Get campaign analytics
   */
  public getCampaignAnalytics(campaignId: string): CampaignReport | null {
    return this.campaignReports.get(campaignId) || null;
  }

  /**
   * Generate comprehensive campaign report
   */
  public generateCampaignReport(campaign: EngagementCampaign): CampaignReport {
    const report: CampaignReport = {
      campaignId: campaign.id,
      contentId: campaign.contentId,
      status: campaign.status,
      duration: campaign.endDate ? 
        campaign.endDate.getTime() - campaign.startDate.getTime() : 
        Date.now() - campaign.startDate.getTime(),
      targetMetrics: {
        view: campaign.targetMetrics.views,
        like: campaign.targetMetrics.likes,
        comment: campaign.targetMetrics.comments,
        share: campaign.targetMetrics.shares,
        follow: 0 // Not specified in target metrics
      },
      actualMetrics: {
        view: campaign.analytics.realTimeMetrics.currentViews,
        like: campaign.analytics.realTimeMetrics.currentLikes,
        comment: campaign.analytics.realTimeMetrics.currentComments,
        share: campaign.analytics.realTimeMetrics.currentShares,
        follow: 0
      },
      completionRate: this.calculateCompletionRate(campaign),
      authenticityScore: campaign.analytics.averageAuthenticityScore,
      efficiency: this.calculateEfficiency(campaign),
      costEffectiveness: this.calculateCostEffectiveness(campaign),
      recommendations: this.generateRecommendations(campaign)
    };

    this.campaignReports.set(campaign.id, report);
    return report;
  }

  /**
   * Get detected anomalies
   */
  public getAnomalies(severity?: AnomalyDetection['severity']): AnomalyDetection[] {
    if (severity) {
      return this.anomalies.filter(anomaly => anomaly.severity === severity);
    }
    return [...this.anomalies];
  }

  /**
   * Get engagement authenticity analysis
   */
  public analyzeEngagementAuthenticity(contentId: string): {
    score: number;
    factors: Array<{
      factor: string;
      score: number;
      weight: number;
      description: string;
    }>;
    recommendations: string[];
  } {
    const performance = this.contentPerformance.get(contentId);
    if (!performance) {
      return {
        score: 0,
        factors: [],
        recommendations: ['No engagement data available']
      };
    }

    const factors = [
      {
        factor: 'temporal_distribution',
        score: this.analyzeTemporalDistribution(performance),
        weight: 0.25,
        description: 'How naturally engagement is distributed over time'
      },
      {
        factor: 'velocity_patterns',
        score: this.analyzeVelocityPatterns(performance),
        weight: 0.25,
        description: 'How realistic engagement velocity appears'
      },
      {
        factor: 'clustering_index',
        score: this.analyzeClusteringIndex(performance),
        weight: 0.2,
        description: 'How evenly distributed engagements are'
      },
      {
        factor: 'bot_human_ratio',
        score: this.analyzeBotHumanRatio(performance),
        weight: 0.15,
        description: 'Balance between bot and human engagement'
      },
      {
        factor: 'engagement_patterns',
        score: this.analyzeEngagementPatterns(performance),
        weight: 0.15,
        description: 'Naturalness of engagement type patterns'
      }
    ];

    // Calculate weighted score
    const totalScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    const recommendations = this.generateAuthenticityRecommendations(factors);

    return {
      score: totalScore,
      factors,
      recommendations
    };
  }

  /**
   * Get top performing content
   */
  public getTopPerformingContent(limit: number = 10): ContentPerformance[] {
    return Array.from(this.contentPerformance.values())
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, limit);
  }

  /**
   * Get bot performance leaderboard
   */
  public getBotLeaderboard(limit: number = 10): BotActivityReport[] {
    return Array.from(this.botReports.values())
      .sort((a, b) => b.authenticityScore - a.authenticityScore)
      .slice(0, limit);
  }

  /**
   * Generate engagement heatmap
   */
  public generateEngagementHeatmap(
    contentId: string,
    timeframe: 'day' | 'week' | 'month' = 'day'
  ): Array<{
    hour: number;
    day?: number;
    intensity: number;
    engagements: number;
  }> {
    const performance = this.contentPerformance.get(contentId);
    if (!performance) return [];

    const heatmap: Array<{
      hour: number;
      day?: number;
      intensity: number;
      engagements: number;
    }> = [];

    // Group engagements by time periods
    const engagementsByTime = new Map<string, number>();
    
    for (const trend of performance.timeline) {
      const date = new Date(trend.timestamp);
      let key: string;
      
      if (timeframe === 'day') {
        key = date.getHours().toString();
      } else if (timeframe === 'week') {
        key = `${date.getDay()}-${date.getHours()}`;
      } else {
        key = `${date.getDate()}-${date.getHours()}`;
      }
      
      engagementsByTime.set(key, (engagementsByTime.get(key) || 0) + trend.count);
    }

    // Convert to heatmap format
    const maxEngagements = Math.max(...Array.from(engagementsByTime.values()));
    
    for (const [key, engagements] of engagementsByTime.entries()) {
      const parts = key.split('-');
      const hour = parseInt(parts[parts.length - 1]);
      const day = parts.length > 1 ? parseInt(parts[0]) : undefined;
      
      heatmap.push({
        hour,
        day,
        intensity: maxEngagements > 0 ? engagements / maxEngagements : 0,
        engagements
      });
    }

    return heatmap.sort((a, b) => {
      if (a.day !== undefined && b.day !== undefined) {
        return a.day - b.day || a.hour - b.hour;
      }
      return a.hour - b.hour;
    });
  }

  /**
   * Export analytics data
   */
  public exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      contentPerformance: Array.from(this.contentPerformance.values()),
      botReports: Array.from(this.botReports.values()),
      campaignReports: Array.from(this.campaignReports.values()),
      anomalies: this.anomalies,
      timestamp: new Date()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV format would require more complex formatting
      return this.convertToCSV(data);
    }
  }

  /**
   * Update real-time metrics
   */
  private updateRealTimeMetrics(
    contentId: string,
    engagement: Engagement,
    isBot: boolean
  ): void {
    let metrics = this.metrics.get(contentId) || [];
    
    const latest = metrics.length > 0 ? metrics[metrics.length - 1] : {
      currentViews: 0,
      currentLikes: 0,
      currentComments: 0,
      currentShares: 0,
      engagementRate: 0,
      authenticityScore: 0,
      botActivity: 0,
      humanActivity: 0,
      timestamp: new Date()
    };

    const updated: RealTimeMetrics = {
      ...latest,
      timestamp: new Date()
    };

    // Update counts based on engagement type
    switch (engagement.type) {
      case 'view':
        updated.currentViews++;
        break;
      case 'like':
        updated.currentLikes++;
        break;
      case 'comment':
        updated.currentComments++;
        break;
      case 'share':
        updated.currentShares++;
        break;
    }

    // Update activity counters
    if (isBot) {
      updated.botActivity++;
    } else {
      updated.humanActivity++;
    }

    // Calculate engagement rate
    const totalEngagements = updated.currentLikes + updated.currentComments + updated.currentShares;
    updated.engagementRate = updated.currentViews > 0 ? 
      totalEngagements / updated.currentViews : 0;

    // Update authenticity score
    updated.authenticityScore = this.calculateAuthenticityScore(updated);

    metrics.push(updated);
    
    // Cleanup old metrics
    const cutoff = Date.now() - (this.metricsRetentionHours * 3600000);
    metrics = metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    this.metrics.set(contentId, metrics);
  }

  /**
   * Update content performance
   */
  private updateContentPerformance(contentId: string, engagement: Engagement): void {
    let performance = this.contentPerformance.get(contentId);
    
    if (!performance) {
      performance = {
        contentId,
        title: 'Unknown Content',
        totalEngagements: 0,
        engagementRate: 0,
        virality: 0,
        authenticityScore: 0,
        phaseBreakdown: {
          discovery: 0,
          'viral-growth': 0,
          'sustained-interest': 0,
          archive: 0
        },
        timeline: [],
        topPerformingHours: [],
        botContribution: 0,
        humanContribution: 0
      };
    }

    performance.totalEngagements++;
    performance.phaseBreakdown[engagement.phase]++;
    
    // Add to timeline
    const trend: EngagementTrend = {
      timestamp: new Date(),
      type: engagement.type,
      count: 1,
      velocity: this.calculateVelocity(performance.timeline),
      authenticity: engagement.metadata.authenticityScore
    };
    
    performance.timeline.push(trend);
    
    // Update other metrics
    performance.engagementRate = this.calculateEngagementRate(performance);
    performance.virality = this.calculateVirality(performance);
    performance.authenticityScore = this.calculateAverageAuthenticity(performance);
    performance.topPerformingHours = this.getTopPerformingHours(performance);
    
    this.contentPerformance.set(contentId, performance);
  }

  /**
   * Update bot activity
   */
  private updateBotActivity(botId: string, engagement: Engagement): void {
    let report = this.botReports.get(botId);
    
    if (!report) {
      report = {
        botId,
        name: 'Unknown Bot',
        totalEngagements: 0,
        authenticityScore: 0,
        engagementTypes: {
          view: 0,
          like: 0,
          comment: 0,
          share: 0,
          follow: 0
        },
        activityHours: [],
        contentCategories: {},
        successRate: 0,
        flaggedActivities: []
      };
    }

    report.totalEngagements++;
    report.engagementTypes[engagement.type]++;
    
    // Update authenticity score
    const totalScore = report.authenticityScore * (report.totalEngagements - 1);
    report.authenticityScore = (totalScore + engagement.metadata.authenticityScore) / report.totalEngagements;
    
    // Update activity hours
    const hour = new Date().getHours();
    if (!report.activityHours.includes(hour)) {
      report.activityHours.push(hour);
    }
    
    // Update success rate
    const successfulEngagements = report.totalEngagements; // Assuming all recorded are successful
    report.successRate = successfulEngagements / report.totalEngagements;
    
    this.botReports.set(botId, report);
  }

  /**
   * Detect anomalies in engagement patterns
   */
  private detectAnomalies(contentId: string, engagement: Engagement): void {
    const performance = this.contentPerformance.get(contentId);
    if (!performance || performance.timeline.length < 10) return; // Need enough data

    // Check velocity spikes
    this.checkVelocityAnomalies(contentId, performance);
    
    // Check clustering
    this.checkClusteringAnomalies(contentId, performance);
    
    // Check authenticity drops
    this.checkAuthenticityAnomalies(contentId, performance);
    
    // Check suspicious patterns
    this.checkPatternAnomalies(contentId, performance);
  }

  /**
   * Check for velocity anomalies
   */
  private checkVelocityAnomalies(contentId: string, performance: ContentPerformance): void {
    const recentTrends = performance.timeline.slice(-10);
    const averageVelocity = recentTrends.reduce((sum, trend) => sum + trend.velocity, 0) / recentTrends.length;
    const latestVelocity = recentTrends[recentTrends.length - 1].velocity;
    
    if (latestVelocity > averageVelocity * this.anomalyThresholds.velocitySpike) {
      this.addAnomaly({
        type: 'velocity',
        severity: 'high',
        description: `Engagement velocity spike detected: ${latestVelocity.toFixed(2)}x average`,
        affectedContent: [contentId],
        affectedBots: [],
        detectedAt: new Date(),
        recommendedActions: [
          'Review recent bot activity',
          'Check for coordinated engagement',
          'Consider adjusting engagement rates'
        ]
      });
    }
  }

  /**
   * Check for clustering anomalies
   */
  private checkClusteringAnomalies(contentId: string, performance: ContentPerformance): void {
    const recentTrends = performance.timeline.slice(-20);
    const timestamps = recentTrends.map(trend => trend.timestamp.getTime());
    
    // Calculate clustering index
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    if (intervals.length === 0) return;
    
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const clusteringIndex = 1 - (Math.sqrt(variance) / mean);
    
    if (clusteringIndex > this.anomalyThresholds.clusteringIndex) {
      this.addAnomaly({
        type: 'clustering',
        severity: 'medium',
        description: `High engagement clustering detected: ${(clusteringIndex * 100).toFixed(1)}%`,
        affectedContent: [contentId],
        affectedBots: [],
        detectedAt: new Date(),
        recommendedActions: [
          'Add more temporal variance to bot schedules',
          'Review engagement timing patterns',
          'Implement randomization in scheduling'
        ]
      });
    }
  }

  /**
   * Check for authenticity anomalies
   */
  private checkAuthenticityAnomalies(contentId: string, performance: ContentPerformance): void {
    if (performance.authenticityScore < this.anomalyThresholds.authenticityDrop) {
      this.addAnomaly({
        type: 'authenticity',
        severity: 'critical',
        description: `Low authenticity score: ${(performance.authenticityScore * 100).toFixed(1)}%`,
        affectedContent: [contentId],
        affectedBots: [],
        detectedAt: new Date(),
        recommendedActions: [
          'Review bot persona configurations',
          'Improve content-bot matching',
          'Add more variance to engagement patterns'
        ]
      });
    }
  }

  /**
   * Check for pattern anomalies
   */
  private checkPatternAnomalies(contentId: string, performance: ContentPerformance): void {
    // Implementation would analyze patterns for suspicious similarities
    // This is a simplified version
    const hourlyDistribution = new Array(24).fill(0);
    
    for (const trend of performance.timeline) {
      const hour = trend.timestamp.getHours();
      hourlyDistribution[hour]++;
    }
    
    // Check if engagement is too concentrated in specific hours
    const maxHourEngagements = Math.max(...hourlyDistribution);
    const totalEngagements = hourlyDistribution.reduce((sum, count) => sum + count, 0);
    const concentration = maxHourEngagements / totalEngagements;
    
    if (concentration > this.anomalyThresholds.suspiciousPatterns) {
      this.addAnomaly({
        type: 'pattern',
        severity: 'medium',
        description: `Suspicious temporal concentration: ${(concentration * 100).toFixed(1)}% in single hour`,
        affectedContent: [contentId],
        affectedBots: [],
        detectedAt: new Date(),
        recommendedActions: [
          'Distribute engagement across more hours',
          'Review bot active hour configurations',
          'Add randomization to scheduling'
        ]
      });
    }
  }

  /**
   * Add anomaly to tracking
   */
  private addAnomaly(anomaly: AnomalyDetection): void {
    this.anomalies.push(anomaly);
    
    // Keep only recent anomalies (last 7 days)
    const cutoff = Date.now() - (7 * 24 * 3600000);
    this.anomalies = this.anomalies.filter(a => a.detectedAt.getTime() > cutoff);
    
    console.warn(`Anomaly detected: ${anomaly.type} - ${anomaly.description}`);
  }

  /**
   * Calculate various metrics and helper functions
   */
  private calculateAuthenticityScore(metrics: RealTimeMetrics): number {
    const botRatio = metrics.botActivity / (metrics.botActivity + metrics.humanActivity);
    const baseScore = 1 - botRatio; // Higher human activity = higher authenticity
    
    // Adjust based on engagement patterns
    const engagementRatio = metrics.engagementRate;
    const normalizedRatio = Math.min(1, engagementRatio / 0.1); // 10% is considered normal
    
    return Math.max(0, Math.min(1, baseScore * (1 - normalizedRatio * 0.3)));
  }

  private calculateCompletionRate(campaign: EngagementCampaign): number {
    const targets = campaign.targetMetrics;
    const actual = campaign.analytics.realTimeMetrics;
    
    const viewsRate = actual.currentViews / targets.views;
    const likesRate = actual.currentLikes / targets.likes;
    const commentsRate = actual.currentComments / targets.comments;
    const sharesRate = actual.currentShares / targets.shares;
    
    return Math.min(1, (viewsRate + likesRate + commentsRate + sharesRate) / 4);
  }

  private calculateEfficiency(campaign: EngagementCampaign): number {
    const totalEngagements = campaign.analytics.totalEngagements;
    const timeElapsed = Date.now() - campaign.startDate.getTime();
    const hoursElapsed = timeElapsed / 3600000;
    
    return totalEngagements / Math.max(1, hoursElapsed);
  }

  private calculateCostEffectiveness(campaign: EngagementCampaign): number {
    // Placeholder calculation - would factor in actual costs
    return campaign.analytics.averageAuthenticityScore * campaign.analytics.successRate;
  }

  private generateRecommendations(campaign: EngagementCampaign): string[] {
    const recommendations: string[] = [];
    
    if (campaign.analytics.averageAuthenticityScore < 0.7) {
      recommendations.push('Improve bot persona diversity');
      recommendations.push('Add more temporal variance to engagements');
    }
    
    if (campaign.analytics.successRate < 0.9) {
      recommendations.push('Review failed engagement causes');
      recommendations.push('Optimize retry mechanisms');
    }
    
    const completionRate = this.calculateCompletionRate(campaign);
    if (completionRate < 0.8) {
      recommendations.push('Consider increasing engagement targets');
      recommendations.push('Review bot selection criteria');
    }
    
    return recommendations;
  }

  private analyzeTemporalDistribution(performance: ContentPerformance): number {
    // Analyze how naturally distributed engagements are over time
    const hourlyDistribution = new Array(24).fill(0);
    
    for (const trend of performance.timeline) {
      const hour = trend.timestamp.getHours();
      hourlyDistribution[hour]++;
    }
    
    // Calculate entropy (higher = more natural)
    const total = performance.timeline.length;
    if (total === 0) return 0;
    
    const entropy = hourlyDistribution.reduce((sum, count) => {
      if (count === 0) return sum;
      const probability = count / total;
      return sum - probability * Math.log2(probability);
    }, 0);
    
    // Normalize entropy (max entropy for 24 hours = log2(24))
    return entropy / Math.log2(24);
  }

  private analyzeVelocityPatterns(performance: ContentPerformance): number {
    if (performance.timeline.length < 2) return 0.5;
    
    const velocities = performance.timeline.map(trend => trend.velocity);
    const mean = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;
    
    // Lower variance = more consistent = more natural
    const consistencyScore = 1 / (1 + variance);
    
    return Math.min(1, consistencyScore);
  }

  private analyzeClusteringIndex(performance: ContentPerformance): number {
    // Lower clustering = higher score
    const timestamps = performance.timeline.map(trend => trend.timestamp.getTime());
    
    if (timestamps.length < 2) return 0.5;
    
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher standard deviation relative to mean = less clustering = higher score
    return Math.min(1, stdDev / mean);
  }

  private analyzeBotHumanRatio(performance: ContentPerformance): number {
    // Ideal ratio is around 70% bot, 30% human for authenticity
    const idealBotRatio = 0.7;
    const actualBotRatio = performance.botContribution / performance.totalEngagements;
    
    const deviation = Math.abs(actualBotRatio - idealBotRatio);
    return Math.max(0, 1 - deviation * 2);
  }

  private analyzeEngagementPatterns(performance: ContentPerformance): number {
    // Analyze naturalness of engagement type patterns
    const typeDistribution = {
      view: 0,
      like: 0,
      comment: 0,
      share: 0,
      follow: 0
    };
    
    for (const trend of performance.timeline) {
      typeDistribution[trend.type]++;
    }
    
    // Expected ratios for natural engagement
    const expectedRatios = {
      view: 0.6,
      like: 0.25,
      comment: 0.1,
      share: 0.04,
      follow: 0.01
    };
    
    let score = 1.0;
    const total = performance.timeline.length;
    
    for (const [type, count] of Object.entries(typeDistribution)) {
      const actualRatio = count / total;
      const expectedRatio = expectedRatios[type as keyof typeof expectedRatios];
      const deviation = Math.abs(actualRatio - expectedRatio);
      score -= deviation * 0.5;
    }
    
    return Math.max(0, score);
  }

  private generateAuthenticityRecommendations(factors: Array<{
    factor: string;
    score: number;
    weight: number;
  }>): string[] {
    const recommendations: string[] = [];
    
    for (const factor of factors) {
      if (factor.score < 0.6) {
        switch (factor.factor) {
          case 'temporal_distribution':
            recommendations.push('Distribute engagements more evenly across time periods');
            break;
          case 'velocity_patterns':
            recommendations.push('Add more variance to engagement velocity');
            break;
          case 'clustering_index':
            recommendations.push('Reduce clustering by adding random delays');
            break;
          case 'bot_human_ratio':
            recommendations.push('Adjust bot-to-human engagement ratio');
            break;
          case 'engagement_patterns':
            recommendations.push('Review engagement type distribution patterns');
            break;
        }
      }
    }
    
    return recommendations;
  }

  private calculateVelocity(timeline: EngagementTrend[]): number {
    if (timeline.length < 2) return 0;
    
    const recent = timeline.slice(-5); // Last 5 engagements
    const timeSpan = recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime();
    
    return timeSpan > 0 ? (recent.length - 1) / (timeSpan / 3600000) : 0; // Engagements per hour
  }

  private calculateEngagementRate(performance: ContentPerformance): number {
    const views = performance.phaseBreakdown.discovery + 
                 performance.phaseBreakdown['viral-growth'] + 
                 performance.phaseBreakdown['sustained-interest'] + 
                 performance.phaseBreakdown.archive;
    
    const engagements = performance.totalEngagements - views; // Exclude views from engagement count
    
    return views > 0 ? engagements / views : 0;
  }

  private calculateVirality(performance: ContentPerformance): number {
    // Simple virality calculation based on growth rate
    if (performance.timeline.length < 10) return 0;
    
    const recent = performance.timeline.slice(-10);
    const older = performance.timeline.slice(-20, -10);
    
    const recentEngagements = recent.length;
    const olderEngagements = older.length;
    
    return olderEngagements > 0 ? recentEngagements / olderEngagements : 1;
  }

  private calculateAverageAuthenticity(performance: ContentPerformance): number {
    if (performance.timeline.length === 0) return 0;
    
    const totalAuthenticity = performance.timeline.reduce((sum, trend) => sum + trend.authenticity, 0);
    return totalAuthenticity / performance.timeline.length;
  }

  private getTopPerformingHours(performance: ContentPerformance): number[] {
    const hourlyEngagements = new Array(24).fill(0);
    
    for (const trend of performance.timeline) {
      const hour = trend.timestamp.getHours();
      hourlyEngagements[hour]++;
    }
    
    return hourlyEngagements
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.hour);
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - would need more robust implementation
    return JSON.stringify(data);
  }

  private startPeriodicAnalysis(): void {
    // Run analysis every hour
    setInterval(() => {
      this.performPeriodicAnalysis();
    }, 3600000);
  }

  private performPeriodicAnalysis(): void {
    // Cleanup old data
    const cutoff = Date.now() - (this.metricsRetentionHours * 3600000);
    
    for (const [contentId, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp.getTime() > cutoff);
      this.metrics.set(contentId, filteredMetrics);
    }
    
    // Update performance calculations
    for (const [contentId, performance] of this.contentPerformance.entries()) {
      performance.timeline = performance.timeline.filter(trend => 
        trend.timestamp.getTime() > cutoff
      );
      
      // Recalculate derived metrics
      performance.engagementRate = this.calculateEngagementRate(performance);
      performance.virality = this.calculateVirality(performance);
      performance.authenticityScore = this.calculateAverageAuthenticity(performance);
      performance.topPerformingHours = this.getTopPerformingHours(performance);
    }
    
    console.log('Periodic analytics analysis completed');
  }
}