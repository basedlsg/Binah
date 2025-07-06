import {
  ViewingPattern,
  ViewingSegment,
  Content,
  BotPersona,
  EngagementStyle
} from '../types';

export class ViewingPatternService {
  private readonly patterns: Map<string, ViewingPattern> = new Map();
  
  /**
   * Generate realistic viewing pattern for a bot viewing content
   */
  public async generateViewingPattern(
    content: Content,
    bot: BotPersona
  ): Promise<ViewingPattern> {
    const contentDuration = content.metadata.duration || 60; // Default 60 seconds
    const pattern = this.createBasePattern(contentDuration, bot);
    
    // Apply bot-specific viewing behaviors
    this.applyBotBehaviors(pattern, bot, content);
    
    // Add content-specific adjustments
    this.applyContentFactors(pattern, content);
    
    // Add temporal factors
    this.applyTemporalFactors(pattern, bot);
    
    // Cache pattern for potential reuse
    const patternId = `${content.id}-${bot.id}`;
    this.patterns.set(patternId, pattern);
    
    return pattern;
  }

  /**
   * Generate viewing pattern for multiple bots (batch processing)
   */
  public async generateBatchViewingPatterns(
    content: Content,
    bots: BotPersona[]
  ): Promise<Map<string, ViewingPattern>> {
    const patterns = new Map<string, ViewingPattern>();
    
    for (const bot of bots) {
      const pattern = await this.generateViewingPattern(content, bot);
      patterns.set(bot.id, pattern);
    }
    
    return patterns;
  }

  /**
   * Get viewing pattern analytics
   */
  public getViewingAnalytics(pattern: ViewingPattern): {
    averageWatchTime: number;
    completionRate: number;
    engagementRate: number;
    dropOffRate: number;
  } {
    const totalWatchTime = pattern.segments.reduce((sum, segment) => 
      sum + (segment.endTime - segment.startTime), 0
    );
    
    const completionRate = totalWatchTime / pattern.duration;
    const engagementMoments = pattern.engagementMoments.length;
    const dropOffPoints = pattern.dropOffPoints.length;
    
    return {
      averageWatchTime: totalWatchTime,
      completionRate,
      engagementRate: engagementMoments / pattern.duration,
      dropOffRate: dropOffPoints / pattern.segments.length
    };
  }

  /**
   * Simulate realistic viewing behavior
   */
  public async simulateViewing(
    pattern: ViewingPattern,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    for (const segment of pattern.segments) {
      const segmentDuration = segment.endTime - segment.startTime;
      const watchTime = segmentDuration * (segment.watchPercentage / 100);
      
      // Simulate watching with realistic pauses
      await this.simulateWatchingSegment(segment, watchTime, onProgress);
      
      // Check for drop-off
      if (this.shouldDropOff(segment, pattern)) {
        break;
      }
    }
  }

  /**
   * Get drop-off prediction
   */
  public predictDropOff(pattern: ViewingPattern, currentTime: number): number {
    const segment = pattern.segments.find(s => 
      currentTime >= s.startTime && currentTime <= s.endTime
    );
    
    if (!segment) return 0;
    
    // Calculate drop-off probability based on segment engagement
    const baseDropOff = 0.1; // 10% base drop-off rate
    const engagementBonus = segment.engagementLevel === 'high' ? 0.5 : 
                           segment.engagementLevel === 'medium' ? 0.3 : 0.1;
    
    return Math.max(0, baseDropOff - engagementBonus);
  }

  /**
   * Generate viewing heatmap for content
   */
  public generateViewingHeatmap(patterns: ViewingPattern[]): number[] {
    if (patterns.length === 0) return [];
    
    const maxDuration = Math.max(...patterns.map(p => p.duration));
    const heatmap = new Array(maxDuration).fill(0);
    
    for (const pattern of patterns) {
      for (const segment of pattern.segments) {
        const intensity = this.calculateSegmentIntensity(segment);
        
        for (let i = segment.startTime; i < segment.endTime; i++) {
          if (i < heatmap.length) {
            heatmap[i] += intensity;
          }
        }
      }
    }
    
    // Normalize heatmap
    const maxIntensity = Math.max(...heatmap);
    if (maxIntensity > 0) {
      for (let i = 0; i < heatmap.length; i++) {
        heatmap[i] = heatmap[i] / maxIntensity;
      }
    }
    
    return heatmap;
  }

  /**
   * Create base viewing pattern
   */
  private createBasePattern(duration: number, bot: BotPersona): ViewingPattern {
    const segments: ViewingSegment[] = [];
    const engagementMoments: number[] = [];
    const dropOffPoints: number[] = [];
    
    // Create segments based on content duration
    const segmentCount = Math.max(1, Math.floor(duration / 10)); // 10-second segments
    const segmentDuration = duration / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const startTime = i * segmentDuration;
      const endTime = (i + 1) * segmentDuration;
      
      segments.push({
        startTime,
        endTime,
        watchPercentage: this.calculateInitialWatchPercentage(i, segmentCount),
        engagementLevel: this.calculateInitialEngagementLevel(i, segmentCount)
      });
    }
    
    return {
      duration,
      segments,
      dropOffPoints,
      engagementMoments
    };
  }

  /**
   * Apply bot-specific viewing behaviors
   */
  private applyBotBehaviors(pattern: ViewingPattern, bot: BotPersona, content: Content): void {
    const attentionSpan = this.calculateAttentionSpan(bot);
    const interestLevel = this.calculateInterestLevel(bot, content);
    
    // Adjust watch percentages based on bot behavior
    for (let i = 0; i < pattern.segments.length; i++) {
      const segment = pattern.segments[i];
      
      // Apply attention span decay
      const attentionDecay = Math.pow(0.9, i / attentionSpan);
      segment.watchPercentage *= attentionDecay;
      
      // Apply interest level
      segment.watchPercentage *= interestLevel;
      
      // Apply engagement style effects
      this.applyEngagementStyleEffects(segment, bot.engagementStyle, i);
      
      // Ensure realistic bounds
      segment.watchPercentage = Math.max(0.1, Math.min(1.0, segment.watchPercentage));
    }
    
    // Add engagement moments based on bot personality
    this.addEngagementMoments(pattern, bot);
    
    // Add drop-off points
    this.addDropOffPoints(pattern, bot);
  }

  /**
   * Apply content-specific factors
   */
  private applyContentFactors(pattern: ViewingPattern, content: Content): void {
    // Content quality factor (based on existing metrics)
    const qualityScore = this.calculateContentQuality(content);
    
    // Apply quality multiplier to all segments
    for (const segment of pattern.segments) {
      segment.watchPercentage *= qualityScore;
    }
    
    // Content type specific adjustments
    this.applyContentTypeAdjustments(pattern, content);
  }

  /**
   * Apply temporal factors (time of day, day of week)
   */
  private applyTemporalFactors(pattern: ViewingPattern, bot: BotPersona): void {
    const currentHour = new Date().getHours();
    const isActiveHour = bot.behaviorPatterns.activeHours.includes(currentHour);
    
    // Adjust viewing intensity based on bot's active hours
    const temporalMultiplier = isActiveHour ? 1.2 : 0.8;
    
    for (const segment of pattern.segments) {
      segment.watchPercentage *= temporalMultiplier;
    }
  }

  /**
   * Calculate attention span for bot
   */
  private calculateAttentionSpan(bot: BotPersona): number {
    const baseAttentionSpan = 30; // 30 seconds base
    
    // Adjust based on demographics
    const ageMultiplier = bot.demographics.age < 25 ? 0.8 : 
                         bot.demographics.age > 45 ? 1.2 : 1.0;
    
    // Adjust based on engagement frequency
    const frequencyMultiplier = bot.behaviorPatterns.engagementFrequency === 'high' ? 1.3 :
                               bot.behaviorPatterns.engagementFrequency === 'low' ? 0.7 : 1.0;
    
    return baseAttentionSpan * ageMultiplier * frequencyMultiplier;
  }

  /**
   * Calculate interest level based on content-bot match
   */
  private calculateInterestLevel(bot: BotPersona, content: Content): number {
    const baseInterest = 0.5;
    
    // Check interest overlap
    const interestOverlap = bot.interests.filter(interest => 
      content.tags.includes(interest) || 
      content.category === interest ||
      content.title.toLowerCase().includes(interest.toLowerCase())
    ).length;
    
    const interestBonus = Math.min(0.4, interestOverlap * 0.1);
    
    return baseInterest + interestBonus;
  }

  /**
   * Apply engagement style effects to segment
   */
  private applyEngagementStyleEffects(
    segment: ViewingSegment,
    style: EngagementStyle,
    segmentIndex: number
  ): void {
    switch (style) {
      case 'casual':
        // Casual viewers have more variable attention
        segment.watchPercentage *= 0.8 + Math.random() * 0.4;
        break;
        
      case 'professional':
        // Professional viewers are more consistent
        segment.watchPercentage *= 0.9 + Math.random() * 0.2;
        break;
        
      case 'enthusiastic':
        // Enthusiastic viewers watch more, especially at the beginning
        const enthusiasmBonus = Math.max(0.2, 0.5 - segmentIndex * 0.05);
        segment.watchPercentage *= 1.0 + enthusiasmBonus;
        break;
        
      case 'analytical':
        // Analytical viewers have steady attention throughout
        segment.watchPercentage *= 1.1;
        break;
        
      case 'humorous':
        // Humorous viewers have spiky attention patterns
        segment.watchPercentage *= segmentIndex % 2 === 0 ? 1.2 : 0.8;
        break;
    }
  }

  /**
   * Add engagement moments to pattern
   */
  private addEngagementMoments(pattern: ViewingPattern, bot: BotPersona): void {
    const engagementProbability = this.calculateEngagementProbability(bot);
    
    for (const segment of pattern.segments) {
      if (Math.random() < engagementProbability) {
        const momentTime = segment.startTime + 
          Math.random() * (segment.endTime - segment.startTime);
        pattern.engagementMoments.push(momentTime);
      }
    }
  }

  /**
   * Add drop-off points to pattern
   */
  private addDropOffPoints(pattern: ViewingPattern, bot: BotPersona): void {
    const dropOffProbability = this.calculateDropOffProbability(bot);
    
    for (let i = 1; i < pattern.segments.length; i++) {
      const cumulativeDropOff = dropOffProbability * (i / pattern.segments.length);
      
      if (Math.random() < cumulativeDropOff) {
        pattern.dropOffPoints.push(pattern.segments[i].startTime);
      }
    }
  }

  /**
   * Calculate initial watch percentage for segment
   */
  private calculateInitialWatchPercentage(segmentIndex: number, totalSegments: number): number {
    // Natural drop-off curve
    const position = segmentIndex / totalSegments;
    const dropOffCurve = Math.exp(-position * 2); // Exponential decay
    
    return 0.3 + 0.7 * dropOffCurve; // 30% to 100% range
  }

  /**
   * Calculate initial engagement level for segment
   */
  private calculateInitialEngagementLevel(segmentIndex: number, totalSegments: number): 'low' | 'medium' | 'high' {
    const position = segmentIndex / totalSegments;
    
    if (position < 0.2) return 'high';     // High engagement at start
    if (position < 0.8) return 'medium';   // Medium engagement in middle
    return 'low';                          // Low engagement at end
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(content: Content): number {
    const baseQuality = 0.6;
    
    // Factor in existing metrics
    const engagementRate = content.metadata.likes / Math.max(1, content.metadata.views);
    const qualityBonus = Math.min(0.4, engagementRate * 10);
    
    return baseQuality + qualityBonus;
  }

  /**
   * Apply content type specific adjustments
   */
  private applyContentTypeAdjustments(pattern: ViewingPattern, content: Content): void {
    // Different content types have different viewing patterns
    switch (content.category.toLowerCase()) {
      case 'entertainment':
        // Entertainment content maintains attention better
        for (const segment of pattern.segments) {
          segment.watchPercentage *= 1.1;
        }
        break;
        
      case 'educational':
        // Educational content has more consistent viewing
        for (let i = 0; i < pattern.segments.length; i++) {
          pattern.segments[i].watchPercentage *= 0.9 + (i * 0.1 / pattern.segments.length);
        }
        break;
        
      case 'news':
        // News content has front-loaded attention
        for (let i = 0; i < pattern.segments.length; i++) {
          const frontLoadMultiplier = 1.3 - (i * 0.1);
          pattern.segments[i].watchPercentage *= Math.max(0.7, frontLoadMultiplier);
        }
        break;
    }
  }

  /**
   * Calculate engagement probability for bot
   */
  private calculateEngagementProbability(bot: BotPersona): number {
    const baseProb = 0.1;
    
    const styleMultiplier = bot.engagementStyle === 'enthusiastic' ? 2.0 :
                           bot.engagementStyle === 'casual' ? 0.5 : 1.0;
    
    const frequencyMultiplier = bot.behaviorPatterns.engagementFrequency === 'high' ? 1.5 :
                               bot.behaviorPatterns.engagementFrequency === 'low' ? 0.5 : 1.0;
    
    return baseProb * styleMultiplier * frequencyMultiplier;
  }

  /**
   * Calculate drop-off probability for bot
   */
  private calculateDropOffProbability(bot: BotPersona): number {
    const baseProb = 0.2;
    
    const ageMultiplier = bot.demographics.age < 25 ? 1.3 : 0.8;
    const styleMultiplier = bot.engagementStyle === 'casual' ? 1.5 : 0.8;
    
    return baseProb * ageMultiplier * styleMultiplier;
  }

  /**
   * Simulate watching a segment with realistic timing
   */
  private async simulateWatchingSegment(
    segment: ViewingSegment,
    watchTime: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const steps = Math.floor(watchTime / 1000); // 1-second steps
    const stepDelay = 1000;
    
    for (let step = 0; step < steps; step++) {
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      
      if (onProgress) {
        const progress = (segment.startTime + step) / segment.endTime;
        onProgress(progress);
      }
    }
  }

  /**
   * Check if viewer should drop off at this segment
   */
  private shouldDropOff(segment: ViewingSegment, pattern: ViewingPattern): boolean {
    const segmentTime = segment.startTime;
    return pattern.dropOffPoints.some(dropPoint => 
      Math.abs(dropPoint - segmentTime) < 1.0
    );
  }

  /**
   * Calculate segment intensity for heatmap
   */
  private calculateSegmentIntensity(segment: ViewingSegment): number {
    const baseIntensity = segment.watchPercentage;
    const engagementBonus = segment.engagementLevel === 'high' ? 0.3 :
                           segment.engagementLevel === 'medium' ? 0.2 : 0.1;
    
    return baseIntensity + engagementBonus;
  }
}