import {
  Content,
  BotPersona,
  EngagementPhase,
  EngagementStyle
} from '../types';

export interface LikeDistributionPattern {
  phase: EngagementPhase;
  timeDistribution: number[];
  velocityPattern: 'linear' | 'exponential' | 'logarithmic' | 'burst';
  peakHours: number[];
  authenticityFactors: {
    clustering: number;
    velocity: number;
    timing: number;
  };
}

export interface LikeMetrics {
  totalLikes: number;
  averageVelocity: number;
  peakVelocity: number;
  distributionScore: number;
  authenticityScore: number;
  timeline: Array<{
    timestamp: Date;
    likes: number;
    cumulativeLikes: number;
  }>;
}

export class LikeDistributionService {
  private readonly phasePatterns: Map<EngagementPhase, LikeDistributionPattern> = new Map();
  private readonly contentLikeHistory: Map<string, LikeMetrics> = new Map();
  private readonly botLikeHistory: Map<string, Date[]> = new Map();

  constructor() {
    this.initializePhasePatterns();
  }

  /**
   * Execute a like action with realistic distribution
   */
  public async executeLike(content: Content, bot: BotPersona): Promise<void> {
    const likeTimestamp = new Date();
    
    // Check if bot should like this content
    if (!this.shouldBotLike(content, bot)) {
      return;
    }

    // Add authentic delay before liking
    await this.addAuthenticLikeDelay(bot, content);

    // Record the like
    await this.recordLike(content, bot, likeTimestamp);

    // Update metrics
    this.updateLikeMetrics(content, likeTimestamp);
    this.updateBotLikeHistory(bot, likeTimestamp);

    console.log(`Bot ${bot.name} liked content ${content.title}`);
  }

  /**
   * Generate natural like distribution for content across phases
   */
  public async generateLikeDistribution(
    content: Content,
    targetLikes: number,
    phase: EngagementPhase
  ): Promise<LikeDistributionPattern> {
    const pattern = this.phasePatterns.get(phase) || this.getDefaultPattern();
    
    // Customize pattern based on content characteristics
    const customizedPattern = this.customizePatternForContent(pattern, content);
    
    // Apply authenticity factors
    this.applyAuthenticityFactors(customizedPattern, content);
    
    return customizedPattern;
  }

  /**
   * Distribute likes across time periods with natural patterns
   */
  public async distributeLikesOverTime(
    content: Content,
    bots: BotPersona[],
    targetLikes: number,
    durationHours: number,
    phase: EngagementPhase
  ): Promise<Array<{ bot: BotPersona; timestamp: Date }>> {
    const distribution: Array<{ bot: BotPersona; timestamp: Date }> = [];
    const pattern = await this.generateLikeDistribution(content, targetLikes, phase);
    
    // Select bots that will like the content
    const likingBots = this.selectLikingBots(bots, targetLikes, content);
    
    // Generate timestamps based on pattern
    const timestamps = this.generateNaturalTimestamps(
      durationHours,
      likingBots.length,
      pattern
    );
    
    // Pair bots with timestamps
    for (let i = 0; i < likingBots.length; i++) {
      distribution.push({
        bot: likingBots[i],
        timestamp: timestamps[i]
      });
    }
    
    // Sort by timestamp for natural flow
    distribution.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return distribution;
  }

  /**
   * Calculate optimal like velocity for authenticity
   */
  public calculateOptimalVelocity(
    content: Content,
    phase: EngagementPhase,
    currentLikes: number,
    timeElapsed: number
  ): number {
    const pattern = this.phasePatterns.get(phase) || this.getDefaultPattern();
    
    // Base velocity calculation
    let baseVelocity = this.calculateBaseVelocity(content, phase);
    
    // Apply pattern-specific adjustments
    switch (pattern.velocityPattern) {
      case 'linear':
        return baseVelocity;
      case 'exponential':
        return baseVelocity * Math.exp(timeElapsed / 3600000); // Convert to hours
      case 'logarithmic':
        return baseVelocity * Math.log(1 + timeElapsed / 3600000);
      case 'burst':
        return this.calculateBurstVelocity(baseVelocity, timeElapsed);
    }
  }

  /**
   * Analyze like authenticity
   */
  public analyzeLikeAuthenticity(content: Content): {
    score: number;
    flags: string[];
    recommendations: string[];
  } {
    const metrics = this.contentLikeHistory.get(content.id);
    if (!metrics) {
      return {
        score: 0,
        flags: ['No like history available'],
        recommendations: ['Generate initial like activity']
      };
    }

    const flags: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Check velocity patterns
    if (metrics.averageVelocity > this.getMaxRealisticVelocity(content)) {
      flags.push('Velocity too high');
      score -= 0.3;
      recommendations.push('Reduce like velocity');
    }

    // Check distribution patterns
    if (metrics.distributionScore < 0.5) {
      flags.push('Unnatural distribution pattern');
      score -= 0.2;
      recommendations.push('Improve time distribution');
    }

    // Check clustering
    const clustering = this.calculateClustering(metrics.timeline);
    if (clustering > 0.8) {
      flags.push('Excessive clustering detected');
      score -= 0.2;
      recommendations.push('Add more temporal variance');
    }

    return {
      score: Math.max(0, score),
      flags,
      recommendations
    };
  }

  /**
   * Get like metrics for content
   */
  public getLikeMetrics(contentId: string): LikeMetrics | null {
    return this.contentLikeHistory.get(contentId) || null;
  }

  /**
   * Get bot like activity
   */
  public getBotLikeActivity(botId: string): Date[] {
    return this.botLikeHistory.get(botId) || [];
  }

  /**
   * Initialize phase patterns
   */
  private initializePhasePatterns(): void {
    // Discovery Phase (Days 1-7)
    this.phasePatterns.set('discovery', {
      phase: 'discovery',
      timeDistribution: [0.3, 0.4, 0.2, 0.1], // Front-loaded
      velocityPattern: 'linear',
      peakHours: [9, 12, 15, 18, 21],
      authenticityFactors: {
        clustering: 0.3,
        velocity: 0.5,
        timing: 0.7
      }
    });

    // Viral Growth Phase (Days 8-45)
    this.phasePatterns.set('viral-growth', {
      phase: 'viral-growth',
      timeDistribution: [0.1, 0.2, 0.4, 0.3], // Peak in middle
      velocityPattern: 'exponential',
      peakHours: [8, 12, 16, 20],
      authenticityFactors: {
        clustering: 0.4,
        velocity: 0.8,
        timing: 0.6
      }
    });

    // Sustained Interest Phase (Days 46-120)
    this.phasePatterns.set('sustained-interest', {
      phase: 'sustained-interest',
      timeDistribution: [0.2, 0.3, 0.3, 0.2], // Steady
      velocityPattern: 'logarithmic',
      peakHours: [10, 14, 19],
      authenticityFactors: {
        clustering: 0.2,
        velocity: 0.3,
        timing: 0.8
      }
    });

    // Archive Phase (Days 121+)
    this.phasePatterns.set('archive', {
      phase: 'archive',
      timeDistribution: [0.4, 0.3, 0.2, 0.1], // Declining
      velocityPattern: 'linear',
      peakHours: [11, 15, 22],
      authenticityFactors: {
        clustering: 0.1,
        velocity: 0.2,
        timing: 0.9
      }
    });
  }

  /**
   * Check if bot should like content
   */
  private shouldBotLike(content: Content, bot: BotPersona): boolean {
    // Check recent activity to avoid spam
    const recentLikes = this.getBotLikeActivity(bot.id);
    const recentThreshold = Date.now() - 300000; // 5 minutes
    const recentLikeCount = recentLikes.filter(date => date.getTime() > recentThreshold).length;
    
    if (recentLikeCount > 3) {
      return false; // Too many recent likes
    }

    // Check content-bot compatibility
    const compatibility = this.calculateContentBotCompatibility(content, bot);
    const likeProbability = this.calculateLikeProbability(bot, compatibility);
    
    return Math.random() < likeProbability;
  }

  /**
   * Calculate content-bot compatibility
   */
  private calculateContentBotCompatibility(content: Content, bot: BotPersona): number {
    let compatibility = 0.5; // Base compatibility

    // Check interest overlap
    const interestOverlap = bot.interests.filter(interest => 
      content.tags.includes(interest) || 
      content.category === interest
    ).length;
    
    compatibility += interestOverlap * 0.1;

    // Check engagement style compatibility
    const styleCompatibility = this.getStyleCompatibility(bot.engagementStyle, content.category);
    compatibility += styleCompatibility * 0.2;

    return Math.min(1.0, compatibility);
  }

  /**
   * Calculate like probability based on bot characteristics
   */
  private calculateLikeProbability(bot: BotPersona, compatibility: number): number {
    let probability = compatibility * 0.5; // Base probability

    // Adjust based on engagement style
    switch (bot.engagementStyle) {
      case 'enthusiastic':
        probability *= 1.5;
        break;
      case 'casual':
        probability *= 0.8;
        break;
      case 'professional':
        probability *= 0.9;
        break;
      case 'analytical':
        probability *= 0.7;
        break;
      case 'humorous':
        probability *= 1.2;
        break;
    }

    // Adjust based on engagement frequency
    const frequencyMultiplier = bot.behaviorPatterns.engagementFrequency === 'high' ? 1.3 :
                               bot.behaviorPatterns.engagementFrequency === 'low' ? 0.6 : 1.0;
    probability *= frequencyMultiplier;

    return Math.min(1.0, probability);
  }

  /**
   * Get style compatibility with content category
   */
  private getStyleCompatibility(style: EngagementStyle, category: string): number {
    const compatibilityMap: Record<EngagementStyle, Record<string, number>> = {
      casual: {
        entertainment: 0.8,
        lifestyle: 0.7,
        sports: 0.6,
        news: 0.4,
        educational: 0.3
      },
      professional: {
        business: 0.9,
        educational: 0.8,
        news: 0.7,
        technology: 0.6,
        entertainment: 0.3
      },
      enthusiastic: {
        entertainment: 0.9,
        sports: 0.8,
        gaming: 0.8,
        lifestyle: 0.7,
        technology: 0.6
      },
      analytical: {
        educational: 0.9,
        technology: 0.8,
        business: 0.7,
        news: 0.6,
        entertainment: 0.4
      },
      humorous: {
        entertainment: 0.9,
        lifestyle: 0.7,
        sports: 0.6,
        gaming: 0.6,
        business: 0.3
      }
    };

    return compatibilityMap[style]?.[category.toLowerCase()] || 0.5;
  }

  /**
   * Add authentic delay before liking
   */
  private async addAuthenticLikeDelay(bot: BotPersona, content: Content): Promise<void> {
    const baseDelay = 1000 + Math.random() * 3000; // 1-4 seconds
    
    // Adjust based on bot engagement style
    const styleMultiplier = bot.engagementStyle === 'enthusiastic' ? 0.5 :
                           bot.engagementStyle === 'analytical' ? 1.5 : 1.0;
    
    // Add reading time consideration
    const readingTime = Math.min(5000, content.title.length * 100); // Rough reading time
    
    const totalDelay = (baseDelay + readingTime) * styleMultiplier;
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  /**
   * Record like action
   */
  private async recordLike(content: Content, bot: BotPersona, timestamp: Date): Promise<void> {
    // This would integrate with your database to record the like
    console.log(`Recording like: ${bot.name} liked ${content.title} at ${timestamp}`);
  }

  /**
   * Update like metrics for content
   */
  private updateLikeMetrics(content: Content, timestamp: Date): void {
    let metrics = this.contentLikeHistory.get(content.id);
    
    if (!metrics) {
      metrics = {
        totalLikes: 0,
        averageVelocity: 0,
        peakVelocity: 0,
        distributionScore: 0,
        authenticityScore: 0,
        timeline: []
      };
    }

    metrics.totalLikes++;
    metrics.timeline.push({
      timestamp,
      likes: 1,
      cumulativeLikes: metrics.totalLikes
    });

    // Calculate velocity
    if (metrics.timeline.length > 1) {
      const timeDiff = timestamp.getTime() - metrics.timeline[metrics.timeline.length - 2].timestamp.getTime();
      const velocity = 1 / (timeDiff / 3600000); // Likes per hour
      metrics.peakVelocity = Math.max(metrics.peakVelocity, velocity);
      
      // Update average velocity
      const totalTime = timestamp.getTime() - metrics.timeline[0].timestamp.getTime();
      metrics.averageVelocity = (metrics.totalLikes - 1) / (totalTime / 3600000);
    }

    // Update distribution score
    metrics.distributionScore = this.calculateDistributionScore(metrics.timeline);
    
    // Update authenticity score
    metrics.authenticityScore = this.calculateAuthenticityScore(metrics);

    this.contentLikeHistory.set(content.id, metrics);
  }

  /**
   * Update bot like history
   */
  private updateBotLikeHistory(bot: BotPersona, timestamp: Date): void {
    const history = this.botLikeHistory.get(bot.id) || [];
    history.push(timestamp);
    
    // Keep only recent history (last 24 hours)
    const cutoff = Date.now() - 86400000; // 24 hours
    const recentHistory = history.filter(date => date.getTime() > cutoff);
    
    this.botLikeHistory.set(bot.id, recentHistory);
  }

  /**
   * Get default pattern
   */
  private getDefaultPattern(): LikeDistributionPattern {
    return {
      phase: 'discovery',
      timeDistribution: [0.25, 0.25, 0.25, 0.25],
      velocityPattern: 'linear',
      peakHours: [9, 12, 15, 18, 21],
      authenticityFactors: {
        clustering: 0.5,
        velocity: 0.5,
        timing: 0.5
      }
    };
  }

  /**
   * Customize pattern for specific content
   */
  private customizePatternForContent(pattern: LikeDistributionPattern, content: Content): LikeDistributionPattern {
    const customized = { ...pattern };
    
    // Adjust based on content category
    switch (content.category.toLowerCase()) {
      case 'entertainment':
        customized.velocityPattern = 'exponential';
        customized.peakHours = [19, 20, 21, 22];
        break;
      case 'news':
        customized.velocityPattern = 'burst';
        customized.peakHours = [7, 8, 12, 17, 18];
        break;
      case 'educational':
        customized.velocityPattern = 'linear';
        customized.peakHours = [10, 14, 16, 20];
        break;
    }
    
    return customized;
  }

  /**
   * Apply authenticity factors to pattern
   */
  private applyAuthenticityFactors(pattern: LikeDistributionPattern, content: Content): void {
    // Adjust clustering based on content age
    const contentAge = Date.now() - content.createdAt.getTime();
    const ageFactor = Math.min(1.0, contentAge / 86400000); // Days since creation
    
    pattern.authenticityFactors.clustering *= ageFactor;
    pattern.authenticityFactors.velocity *= (1 - ageFactor * 0.3);
  }

  /**
   * Select bots that will like the content
   */
  private selectLikingBots(bots: BotPersona[], targetLikes: number, content: Content): BotPersona[] {
    const eligibleBots = bots.filter(bot => this.shouldBotLike(content, bot));
    
    // Sort by compatibility
    eligibleBots.sort((a, b) => {
      const compatA = this.calculateContentBotCompatibility(content, a);
      const compatB = this.calculateContentBotCompatibility(content, b);
      return compatB - compatA;
    });
    
    return eligibleBots.slice(0, Math.min(targetLikes, eligibleBots.length));
  }

  /**
   * Generate natural timestamps for likes
   */
  private generateNaturalTimestamps(
    durationHours: number,
    likeCount: number,
    pattern: LikeDistributionPattern
  ): Date[] {
    const timestamps: Date[] = [];
    const startTime = Date.now();
    const endTime = startTime + (durationHours * 3600000);
    
    // Distribute likes across time periods
    const periods = pattern.timeDistribution.length;
    const periodDuration = durationHours / periods;
    
    for (let i = 0; i < periods; i++) {
      const periodStart = startTime + (i * periodDuration * 3600000);
      const periodEnd = periodStart + (periodDuration * 3600000);
      const periodLikes = Math.floor(likeCount * pattern.timeDistribution[i]);
      
      // Generate timestamps within this period
      for (let j = 0; j < periodLikes; j++) {
        const timestamp = new Date(periodStart + Math.random() * (periodEnd - periodStart));
        timestamps.push(timestamp);
      }
    }
    
    return timestamps.sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Calculate base velocity for content
   */
  private calculateBaseVelocity(content: Content, phase: EngagementPhase): number {
    const baseVelocities: Record<EngagementPhase, number> = {
      'discovery': 2,      // 2 likes per hour
      'viral-growth': 10,  // 10 likes per hour
      'sustained-interest': 1, // 1 like per hour
      'archive': 0.1       // 0.1 likes per hour
    };
    
    let velocity = baseVelocities[phase];
    
    // Adjust based on content quality
    const qualityMultiplier = (content.metadata.likes / Math.max(1, content.metadata.views)) * 10;
    velocity *= Math.max(0.5, Math.min(2.0, qualityMultiplier));
    
    return velocity;
  }

  /**
   * Calculate burst velocity pattern
   */
  private calculateBurstVelocity(baseVelocity: number, timeElapsed: number): number {
    const burstCycle = 3600000; // 1 hour cycle
    const cyclePosition = (timeElapsed % burstCycle) / burstCycle;
    
    // Create burst pattern (high at beginning of cycle, low at end)
    const burstMultiplier = Math.exp(-cyclePosition * 3);
    
    return baseVelocity * burstMultiplier;
  }

  /**
   * Get maximum realistic velocity for content
   */
  private getMaxRealisticVelocity(content: Content): number {
    // Base maximum on content views
    const viewsPerHour = content.metadata.views / 24; // Assume 24 hour lifespan
    return viewsPerHour * 0.1; // Max 10% like rate
  }

  /**
   * Calculate clustering in timeline
   */
  private calculateClustering(timeline: Array<{ timestamp: Date; likes: number }>): number {
    if (timeline.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < timeline.length; i++) {
      const interval = timeline[i].timestamp.getTime() - timeline[i - 1].timestamp.getTime();
      intervals.push(interval);
    }
    
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // High clustering = low standard deviation relative to mean
    return 1 - (stdDev / mean);
  }

  /**
   * Calculate distribution score
   */
  private calculateDistributionScore(timeline: Array<{ timestamp: Date; likes: number }>): number {
    if (timeline.length < 3) return 0.5;
    
    // Check if distribution follows natural patterns
    const hours = timeline.map(entry => entry.timestamp.getHours());
    const hourDistribution = new Array(24).fill(0);
    
    hours.forEach(hour => hourDistribution[hour]++);
    
    // Calculate entropy (higher entropy = more natural distribution)
    const total = hours.length;
    const entropy = hourDistribution.reduce((sum, count) => {
      if (count === 0) return sum;
      const probability = count / total;
      return sum - probability * Math.log2(probability);
    }, 0);
    
    // Normalize entropy (max entropy for 24 hours = log2(24))
    return entropy / Math.log2(24);
  }

  /**
   * Calculate authenticity score
   */
  private calculateAuthenticityScore(metrics: LikeMetrics): number {
    let score = 0.5; // Base score
    
    // Factor in distribution score
    score += metrics.distributionScore * 0.3;
    
    // Factor in velocity consistency
    const velocityConsistency = 1 - Math.abs(metrics.averageVelocity - metrics.peakVelocity) / metrics.peakVelocity;
    score += velocityConsistency * 0.2;
    
    return Math.min(1.0, score);
  }
}