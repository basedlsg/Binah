import {
  BotPersona,
  EngagementStyle,
  BotInteractionPattern,
  Content
} from '../types';

export interface BotCreationParams {
  name?: string;
  personality?: string;
  interests?: string[];
  engagementStyle?: EngagementStyle;
  demographics?: {
    ageRange?: [number, number];
    location?: string;
    timezone?: string;
  };
  behaviorPatterns?: {
    activeHours?: number[];
    engagementFrequency?: 'low' | 'medium' | 'high';
    contentPreferences?: string[];
  };
}

export interface BotAnalytics {
  totalEngagements: number;
  engagementsByType: Record<string, number>;
  averageAuthenticityScore: number;
  activityPattern: Array<{
    hour: number;
    activity: number;
  }>;
  contentPreferences: Array<{
    category: string;
    engagement: number;
  }>;
  socialConnections: string[];
}

export class BotPersonaService {
  private bots: Map<string, BotPersona> = new Map();
  private botAnalytics: Map<string, BotAnalytics> = new Map();
  private readonly maxBots = 1000;
  
  // Predefined personality traits and interests for realistic bot generation
  private readonly personalityTraits = [
    'curious', 'analytical', 'creative', 'social', 'introverted', 'extroverted',
    'optimistic', 'skeptical', 'detail-oriented', 'big-picture', 'innovative',
    'traditional', 'adventurous', 'cautious', 'competitive', 'collaborative'
  ];
  
  private readonly interestCategories = [
    'technology', 'sports', 'entertainment', 'education', 'business', 'science',
    'art', 'music', 'travel', 'food', 'fitness', 'gaming', 'news', 'lifestyle',
    'fashion', 'health', 'environment', 'politics', 'culture', 'history'
  ];
  
  private readonly locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
    'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
    'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
    'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI', 'Oklahoma City, OK'
  ];

  constructor() {
    this.initializeDefaultBots();
  }

  /**
   * Create a new bot persona
   */
  public async createBot(params: BotCreationParams = {}): Promise<BotPersona> {
    if (this.bots.size >= this.maxBots) {
      throw new Error('Maximum number of bots reached');
    }

    const bot: BotPersona = {
      id: this.generateId(),
      name: params.name || this.generateName(),
      personality: params.personality || this.generatePersonality(),
      interests: params.interests || this.generateInterests(),
      engagementStyle: params.engagementStyle || this.generateEngagementStyle(),
      demographics: {
        age: this.generateAge(params.demographics?.ageRange),
        location: params.demographics?.location || this.generateLocation(),
        timezone: params.demographics?.timezone || this.generateTimezone()
      },
      behaviorPatterns: {
        activeHours: params.behaviorPatterns?.activeHours || this.generateActiveHours(),
        engagementFrequency: params.behaviorPatterns?.engagementFrequency || this.generateEngagementFrequency(),
        contentPreferences: params.behaviorPatterns?.contentPreferences || this.generateContentPreferences()
      },
      createdAt: new Date(),
      isActive: true
    };

    this.bots.set(bot.id, bot);
    this.initializeBotAnalytics(bot.id);
    
    console.log(`Created bot: ${bot.name} (${bot.id})`);
    return bot;
  }

  /**
   * Get bot by ID
   */
  public async getBot(botId: string): Promise<BotPersona | null> {
    return this.bots.get(botId) || null;
  }

  /**
   * Get all active bots
   */
  public async getActiveBots(): Promise<BotPersona[]> {
    return Array.from(this.bots.values()).filter(bot => bot.isActive);
  }

  /**
   * Get bots by engagement style
   */
  public async getBotsByStyle(style: EngagementStyle): Promise<BotPersona[]> {
    return Array.from(this.bots.values()).filter(bot => 
      bot.isActive && bot.engagementStyle === style
    );
  }

  /**
   * Get bots with specific interests
   */
  public async getBotsByInterests(interests: string[]): Promise<BotPersona[]> {
    return Array.from(this.bots.values()).filter(bot => {
      if (!bot.isActive) return false;
      
      const commonInterests = bot.interests.filter(interest => 
        interests.some(targetInterest => 
          interest.toLowerCase().includes(targetInterest.toLowerCase())
        )
      );
      
      return commonInterests.length > 0;
    });
  }

  /**
   * Get bots suitable for specific content
   */
  public async getBotsForContent(content: Content): Promise<BotPersona[]> {
    const suitableBots = Array.from(this.bots.values()).filter(bot => {
      if (!bot.isActive) return false;
      
      // Check interest alignment
      const interestMatch = bot.interests.some(interest => 
        content.tags.includes(interest) || 
        content.category.toLowerCase().includes(interest.toLowerCase())
      );
      
      // Check content preference alignment
      const contentMatch = bot.behaviorPatterns.contentPreferences.some(pref =>
        content.category.toLowerCase().includes(pref.toLowerCase()) ||
        content.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
      );
      
      return interestMatch || contentMatch;
    });
    
    // Sort by relevance score
    return suitableBots.sort((a, b) => {
      const scoreA = this.calculateBotContentRelevance(a, content);
      const scoreB = this.calculateBotContentRelevance(b, content);
      return scoreB - scoreA;
    });
  }

  /**
   * Update bot persona
   */
  public async updateBot(botId: string, updates: Partial<BotPersona>): Promise<BotPersona | null> {
    const bot = this.bots.get(botId);
    if (!bot) return null;
    
    const updatedBot = { ...bot, ...updates };
    this.bots.set(botId, updatedBot);
    
    console.log(`Updated bot: ${bot.name} (${botId})`);
    return updatedBot;
  }

  /**
   * Deactivate bot
   */
  public async deactivateBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.isActive = false;
      console.log(`Deactivated bot: ${bot.name} (${botId})`);
    }
  }

  /**
   * Activate bot
   */
  public async activateBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.isActive = true;
      console.log(`Activated bot: ${bot.name} (${botId})`);
    }
  }

  /**
   * Delete bot
   */
  public async deleteBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (bot) {
      this.bots.delete(botId);
      this.botAnalytics.delete(botId);
      console.log(`Deleted bot: ${bot.name} (${botId})`);
    }
  }

  /**
   * Generate interaction pattern for bot
   */
  public generateInteractionPattern(bot: BotPersona, content: Content): BotInteractionPattern {
    // Determine discovery algorithm based on bot characteristics
    const discoveryAlgorithm = this.selectDiscoveryAlgorithm(bot, content);
    
    // Determine temporal pattern based on current time and bot's active hours
    const temporalPattern = this.selectTemporalPattern(bot);
    
    // Determine engagement depth based on bot's personality and content relevance
    const engagementDepth = this.selectEngagementDepth(bot, content);
    
    // Determine relationship level (for now, defaulting to stranger)
    const relationshipLevel = 'stranger';
    
    return {
      discoveryAlgorithm,
      temporalPattern,
      engagementDepth,
      relationshipLevel
    };
  }

  /**
   * Get bot analytics
   */
  public getBotAnalytics(botId: string): BotAnalytics | null {
    return this.botAnalytics.get(botId) || null;
  }

  /**
   * Update bot analytics after engagement
   */
  public updateBotAnalytics(
    botId: string, 
    engagementType: string, 
    authenticityScore: number,
    contentCategory: string
  ): void {
    const analytics = this.botAnalytics.get(botId);
    if (!analytics) return;
    
    analytics.totalEngagements++;
    analytics.engagementsByType[engagementType] = (analytics.engagementsByType[engagementType] || 0) + 1;
    
    // Update average authenticity score
    const totalScore = analytics.averageAuthenticityScore * (analytics.totalEngagements - 1);
    analytics.averageAuthenticityScore = (totalScore + authenticityScore) / analytics.totalEngagements;
    
    // Update activity pattern
    const currentHour = new Date().getHours();
    const hourData = analytics.activityPattern.find(h => h.hour === currentHour);
    if (hourData) {
      hourData.activity++;
    } else {
      analytics.activityPattern.push({ hour: currentHour, activity: 1 });
    }
    
    // Update content preferences
    const categoryData = analytics.contentPreferences.find(c => c.category === contentCategory);
    if (categoryData) {
      categoryData.engagement++;
    } else {
      analytics.contentPreferences.push({ category: contentCategory, engagement: 1 });
    }
  }

  /**
   * Create batch of bots with different characteristics
   */
  public async createBotBatch(count: number, distribution?: {
    casual?: number;
    professional?: number;
    enthusiastic?: number;
    analytical?: number;
    humorous?: number;
  }): Promise<BotPersona[]> {
    const bots: BotPersona[] = [];
    const styles: EngagementStyle[] = ['casual', 'professional', 'enthusiastic', 'analytical', 'humorous'];
    
    for (let i = 0; i < count; i++) {
      let style: EngagementStyle;
      
      if (distribution) {
        // Use weighted distribution
        style = this.selectWeightedStyle(distribution);
      } else {
        // Random distribution
        style = styles[Math.floor(Math.random() * styles.length)];
      }
      
      const bot = await this.createBot({ engagementStyle: style });
      bots.push(bot);
    }
    
    return bots;
  }

  /**
   * Get bot statistics
   */
  public getBotStatistics(): {
    totalBots: number;
    activeBots: number;
    botsByStyle: Record<EngagementStyle, number>;
    botsByFrequency: Record<string, number>;
    averageAge: number;
    locationDistribution: Record<string, number>;
  } {
    const activeBots = this.getActiveBots();
    
    const stats = {
      totalBots: this.bots.size,
      activeBots: activeBots.length,
      botsByStyle: {
        casual: 0,
        professional: 0,
        enthusiastic: 0,
        analytical: 0,
        humorous: 0
      } as Record<EngagementStyle, number>,
      botsByFrequency: {
        low: 0,
        medium: 0,
        high: 0
      },
      averageAge: 0,
      locationDistribution: {} as Record<string, number>
    };
    
    let totalAge = 0;
    
    for (const bot of activeBots) {
      stats.botsByStyle[bot.engagementStyle]++;
      stats.botsByFrequency[bot.behaviorPatterns.engagementFrequency]++;
      totalAge += bot.demographics.age;
      
      const location = bot.demographics.location;
      stats.locationDistribution[location] = (stats.locationDistribution[location] || 0) + 1;
    }
    
    stats.averageAge = activeBots.length > 0 ? totalAge / activeBots.length : 0;
    
    return stats;
  }

  /**
   * Initialize default bot personas
   */
  private async initializeDefaultBots(): Promise<void> {
    const defaultBots = [
      {
        name: 'Alex Chen',
        personality: 'Tech-savvy and curious about new developments',
        interests: ['technology', 'science', 'innovation'],
        engagementStyle: 'analytical' as EngagementStyle,
        demographics: { age: 28, location: 'San Francisco, CA', timezone: 'America/Los_Angeles' }
      },
      {
        name: 'Maya Rodriguez',
        personality: 'Creative and passionate about arts and culture',
        interests: ['art', 'culture', 'entertainment'],
        engagementStyle: 'enthusiastic' as EngagementStyle,
        demographics: { age: 32, location: 'New York, NY', timezone: 'America/New_York' }
      },
      {
        name: 'Jordan Kim',
        personality: 'Business-minded and results-oriented',
        interests: ['business', 'finance', 'entrepreneurship'],
        engagementStyle: 'professional' as EngagementStyle,
        demographics: { age: 35, location: 'Chicago, IL', timezone: 'America/Chicago' }
      },
      {
        name: 'Sam Taylor',
        personality: 'Laid-back and enjoys casual conversations',
        interests: ['lifestyle', 'sports', 'entertainment'],
        engagementStyle: 'casual' as EngagementStyle,
        demographics: { age: 24, location: 'Austin, TX', timezone: 'America/Chicago' }
      },
      {
        name: 'Riley Johnson',
        personality: 'Witty and loves making people laugh',
        interests: ['entertainment', 'comedy', 'pop culture'],
        engagementStyle: 'humorous' as EngagementStyle,
        demographics: { age: 29, location: 'Los Angeles, CA', timezone: 'America/Los_Angeles' }
      }
    ];

    for (const botData of defaultBots) {
      await this.createBot({
        name: botData.name,
        personality: botData.personality,
        interests: botData.interests,
        engagementStyle: botData.engagementStyle,
        demographics: {
          location: botData.demographics.location,
          timezone: botData.demographics.timezone
        }
      });
    }
  }

  /**
   * Generate bot name
   */
  private generateName(): string {
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Avery', 'Riley', 'Quinn',
      'Sage', 'River', 'Kai', 'Rowan', 'Emery', 'Hayden', 'Cameron', 'Phoenix'
    ];
    
    const lastNames = [
      'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
      'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate personality
   */
  private generatePersonality(): string {
    const traits = [];
    const numTraits = 2 + Math.floor(Math.random() * 3); // 2-4 traits
    
    for (let i = 0; i < numTraits; i++) {
      const trait = this.personalityTraits[Math.floor(Math.random() * this.personalityTraits.length)];
      if (!traits.includes(trait)) {
        traits.push(trait);
      }
    }
    
    return traits.join(', ');
  }

  /**
   * Generate interests
   */
  private generateInterests(): string[] {
    const interests = [];
    const numInterests = 3 + Math.floor(Math.random() * 4); // 3-6 interests
    
    for (let i = 0; i < numInterests; i++) {
      const interest = this.interestCategories[Math.floor(Math.random() * this.interestCategories.length)];
      if (!interests.includes(interest)) {
        interests.push(interest);
      }
    }
    
    return interests;
  }

  /**
   * Generate engagement style
   */
  private generateEngagementStyle(): EngagementStyle {
    const styles: EngagementStyle[] = ['casual', 'professional', 'enthusiastic', 'analytical', 'humorous'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  /**
   * Generate age
   */
  private generateAge(ageRange?: [number, number]): number {
    const min = ageRange ? ageRange[0] : 18;
    const max = ageRange ? ageRange[1] : 65;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /**
   * Generate location
   */
  private generateLocation(): string {
    return this.locations[Math.floor(Math.random() * this.locations.length)];
  }

  /**
   * Generate timezone
   */
  private generateTimezone(): string {
    const timezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu'
    ];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * Generate active hours
   */
  private generateActiveHours(): number[] {
    const hours = [];
    const baseHours = [9, 12, 15, 18, 21]; // Common active hours
    
    // Add base hours with some variation
    for (const hour of baseHours) {
      if (Math.random() < 0.8) { // 80% chance to include base hour
        hours.push(hour);
      }
    }
    
    // Add some random hours
    for (let i = 0; i < 24; i++) {
      if (!hours.includes(i) && Math.random() < 0.1) { // 10% chance for other hours
        hours.push(i);
      }
    }
    
    return hours.sort((a, b) => a - b);
  }

  /**
   * Generate engagement frequency
   */
  private generateEngagementFrequency(): 'low' | 'medium' | 'high' {
    const frequencies = ['low', 'medium', 'high'] as const;
    const weights = [0.3, 0.5, 0.2]; // 30% low, 50% medium, 20% high
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return frequencies[i];
      }
    }
    
    return 'medium';
  }

  /**
   * Generate content preferences
   */
  private generateContentPreferences(): string[] {
    const preferences = [];
    const numPreferences = 2 + Math.floor(Math.random() * 3); // 2-4 preferences
    
    for (let i = 0; i < numPreferences; i++) {
      const preference = this.interestCategories[Math.floor(Math.random() * this.interestCategories.length)];
      if (!preferences.includes(preference)) {
        preferences.push(preference);
      }
    }
    
    return preferences;
  }

  /**
   * Calculate bot-content relevance score
   */
  private calculateBotContentRelevance(bot: BotPersona, content: Content): number {
    let score = 0;
    
    // Interest alignment
    const interestMatches = bot.interests.filter(interest => 
      content.tags.includes(interest) || 
      content.category.toLowerCase().includes(interest.toLowerCase())
    );
    score += interestMatches.length * 0.3;
    
    // Content preference alignment
    const preferenceMatches = bot.behaviorPatterns.contentPreferences.filter(pref =>
      content.category.toLowerCase().includes(pref.toLowerCase()) ||
      content.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
    );
    score += preferenceMatches.length * 0.2;
    
    // Engagement style compatibility
    const styleCompatibility = this.getStyleContentCompatibility(bot.engagementStyle, content.category);
    score += styleCompatibility * 0.5;
    
    return score;
  }

  /**
   * Get style-content compatibility
   */
  private getStyleContentCompatibility(style: EngagementStyle, category: string): number {
    const compatibility: Record<EngagementStyle, Record<string, number>> = {
      casual: {
        entertainment: 0.9,
        lifestyle: 0.8,
        sports: 0.7,
        gaming: 0.8
      },
      professional: {
        business: 0.9,
        educational: 0.8,
        news: 0.7,
        technology: 0.8
      },
      enthusiastic: {
        entertainment: 0.9,
        sports: 0.8,
        gaming: 0.8,
        music: 0.9
      },
      analytical: {
        educational: 0.9,
        technology: 0.9,
        science: 0.8,
        business: 0.7
      },
      humorous: {
        entertainment: 0.9,
        comedy: 0.9,
        lifestyle: 0.6,
        gaming: 0.7
      }
    };
    
    return compatibility[style]?.[category.toLowerCase()] || 0.5;
  }

  /**
   * Select discovery algorithm for bot
   */
  private selectDiscoveryAlgorithm(bot: BotPersona, content: Content): 'trending' | 'recommended' | 'hashtag' | 'user-follow' {
    const algorithms = ['trending', 'recommended', 'hashtag', 'user-follow'] as const;
    
    // Weight algorithms based on bot characteristics
    const weights = {
      trending: bot.engagementStyle === 'enthusiastic' ? 0.4 : 0.2,
      recommended: bot.engagementStyle === 'professional' ? 0.4 : 0.3,
      hashtag: bot.behaviorPatterns.engagementFrequency === 'high' ? 0.3 : 0.2,
      'user-follow': bot.engagementStyle === 'casual' ? 0.3 : 0.3
    };
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const algorithm of algorithms) {
      cumulative += weights[algorithm];
      if (random < cumulative) {
        return algorithm;
      }
    }
    
    return 'recommended';
  }

  /**
   * Select temporal pattern for bot
   */
  private selectTemporalPattern(bot: BotPersona): 'morning' | 'afternoon' | 'evening' | 'night' | 'random' {
    const currentHour = new Date().getHours();
    const isActiveHour = bot.behaviorPatterns.activeHours.includes(currentHour);
    
    if (isActiveHour) {
      if (currentHour >= 6 && currentHour < 12) return 'morning';
      if (currentHour >= 12 && currentHour < 17) return 'afternoon';
      if (currentHour >= 17 && currentHour < 22) return 'evening';
      return 'night';
    }
    
    return 'random';
  }

  /**
   * Select engagement depth for bot
   */
  private selectEngagementDepth(bot: BotPersona, content: Content): 'shallow' | 'moderate' | 'deep' {
    const relevance = this.calculateBotContentRelevance(bot, content);
    
    if (relevance > 0.7) return 'deep';
    if (relevance > 0.4) return 'moderate';
    return 'shallow';
  }

  /**
   * Select weighted engagement style
   */
  private selectWeightedStyle(distribution: Record<string, number>): EngagementStyle {
    const styles = Object.keys(distribution) as EngagementStyle[];
    const total = Object.values(distribution).reduce((sum, weight) => sum + weight, 0);
    
    const random = Math.random() * total;
    let cumulative = 0;
    
    for (const style of styles) {
      cumulative += distribution[style];
      if (random < cumulative) {
        return style;
      }
    }
    
    return styles[0];
  }

  /**
   * Initialize analytics for new bot
   */
  private initializeBotAnalytics(botId: string): void {
    this.botAnalytics.set(botId, {
      totalEngagements: 0,
      engagementsByType: {},
      averageAuthenticityScore: 0,
      activityPattern: [],
      contentPreferences: [],
      socialConnections: []
    });
  }

  /**
   * Generate bot response using Gemini API
   */
  public async generateBotResponse(
    bot: BotPersona,
    content: Content,
    context: string = ''
  ): Promise<string> {
    try {
      const prompt = this.buildResponsePrompt(bot, content, context);
      const response = await this.callGeminiAPI(prompt);
      return this.sanitizeResponse(response);
    } catch (error) {
      console.error('Error generating bot response:', error);
      return this.getFallbackResponse(bot);
    }
  }

  /**
   * Build prompt for Gemini API based on bot persona
   */
  private buildResponsePrompt(bot: BotPersona, content: Content, context: string): string {
    const prompt = `
You are roleplaying as ${bot.name}, a ${bot.demographics.age}-year-old from ${bot.demographics.location}.

Personality: ${bot.personality}
Interests: ${bot.interests.join(', ')}
Engagement Style: ${bot.engagementStyle}

Content Context:
- Title: ${content.title}
- Description: ${content.description}
- Category: ${content.category}
- Tags: ${content.tags.join(', ')}

${context ? `Additional Context: ${context}` : ''}

Generate a ${bot.engagementStyle} response that feels natural and authentic to this persona. 
Keep it concise (1-2 sentences) and relevant to the content.
Avoid being overly promotional or artificial.
`;

    return prompt;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-pro';
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Sanitize response to ensure authenticity
   */
  private sanitizeResponse(response: string): string {
    // Remove common AI-generated phrases
    const aiPhrases = [
      'As an AI', 'I am an AI', 'As a language model', 'I\'m an AI assistant',
      'I don\'t have personal experiences', 'I cannot', 'I\'m unable to'
    ];
    
    let sanitized = response;
    aiPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Clean up extra whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    
    // Ensure it's not empty
    if (!sanitized) {
      throw new Error('Response was filtered out');
    }
    
    return sanitized;
  }

  /**
   * Get fallback response for bot
   */
  private getFallbackResponse(bot: BotPersona): string {
    const fallbacks = {
      casual: ['Nice!', 'Cool stuff', 'Interesting', 'Thanks for sharing'],
      professional: ['Well done', 'Excellent work', 'Great content', 'Very informative'],
      enthusiastic: ['Amazing!', 'Love this!', 'So cool!', 'Awesome content!'],
      analytical: ['Interesting analysis', 'Good points', 'Well structured', 'Thoughtful content'],
      humorous: ['Haha nice', 'Pretty good', 'Made me smile', 'Good one']
    };
    
    const responses = fallbacks[bot.engagementStyle];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}