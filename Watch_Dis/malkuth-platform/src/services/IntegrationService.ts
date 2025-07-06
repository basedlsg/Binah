import { EngagementOrchestrator } from './EngagementOrchestrator';
import { BotPersonaService } from './BotPersonaService';
import { AnalyticsService } from './AnalyticsService';
import { EngagementAnalyticsService } from './EngagementAnalyticsService';
import { ContentPerformanceTracker } from './ContentPerformanceTracker';
import { Content, BotPersona, EngagementCampaign, SystemMetrics } from '../types';

/**
 * Central integration service that coordinates all platform components
 */
export class IntegrationService {
  private static instance: IntegrationService;
  
  private orchestrator: EngagementOrchestrator;
  private botPersonaService: BotPersonaService;
  private analyticsService: AnalyticsService;
  private engagementAnalytics: EngagementAnalyticsService;
  private performanceTracker: ContentPerformanceTracker;
  
  private isInitialized = false;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.orchestrator = EngagementOrchestrator.getInstance();
    this.botPersonaService = new BotPersonaService();
    this.analyticsService = new AnalyticsService();
    this.engagementAnalytics = new EngagementAnalyticsService();
    this.performanceTracker = new ContentPerformanceTracker();
  }

  public static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  /**
   * Initialize the platform with all components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Integration service already initialized');
      return;
    }

    try {
      console.log('Initializing Malkuth Platform Integration Service...');

      // Initialize bot personas (create default bots if none exist)
      await this.initializeBotPersonas();

      // Set up health monitoring
      this.startHealthMonitoring();

      // Initialize analytics tracking
      await this.analyticsService.initialize();

      // Initialize performance tracking
      await this.performanceTracker.initialize();

      this.isInitialized = true;
      console.log('✅ Malkuth Platform Integration Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Integration Service:', error);
      throw error;
    }
  }

  /**
   * Create and start a content engagement campaign
   */
  public async createContentCampaign(content: Content, options?: {
    targetMetrics?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
    };
    customBots?: string[];
  }): Promise<EngagementCampaign> {
    try {
      console.log(`Creating campaign for content: ${content.title}`);

      // Create engagement campaign
      const campaign = await this.orchestrator.createCampaign(content, {
        phases: {
          discovery: {
            durationDays: 3,
            engagementPercentage: 20,
            primaryEngagementTypes: ['view', 'like'],
            timing: {
              peakHours: [9, 12, 15, 18, 21],
              distributionPattern: 'natural'
            }
          },
          viralGrowth: {
            durationDays: 14,
            engagementPercentage: 60,
            primaryEngagementTypes: ['view', 'like', 'comment', 'share'],
            timing: {
              peakHours: [8, 12, 16, 20],
              distributionPattern: 'burst'
            }
          },
          sustainedInterest: {
            durationDays: 30,
            engagementPercentage: 15,
            primaryEngagementTypes: ['view', 'like', 'comment'],
            timing: {
              peakHours: [10, 14, 19],
              distributionPattern: 'uniform'
            }
          },
          archive: {
            durationDays: 90,
            engagementPercentage: 5,
            primaryEngagementTypes: ['view'],
            timing: {
              peakHours: [11, 15, 22],
              distributionPattern: 'natural'
            }
          }
        }
      });

      // Start performance tracking for the content
      await this.performanceTracker.startTracking(content.id);

      // Start analytics collection
      await this.engagementAnalytics.startCampaignTracking(campaign.id);

      // Start the campaign
      await this.orchestrator.startCampaign(campaign.id);

      console.log(`✅ Campaign ${campaign.id} created and started for content ${content.title}`);
      return campaign;
    } catch (error) {
      console.error('Failed to create content campaign:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics for the dashboard
   */
  public async getRealTimeAnalytics(): Promise<{
    systemMetrics: SystemMetrics;
    activeCampaigns: EngagementCampaign[];
    botMetrics: any[];
    engagementPatterns: any[];
  }> {
    try {
      const [systemMetrics, activeCampaigns, botStats] = await Promise.all([
        this.analyticsService.getSystemMetrics(),
        this.orchestrator.getActiveCampaigns(),
        this.botPersonaService.getBotStatistics()
      ]);

      const botMetrics = await Promise.all(
        (await this.botPersonaService.getActiveBots()).slice(0, 10).map(async (bot) => {
          const analytics = this.botPersonaService.getBotAnalytics(bot.id);
          return {
            ...bot,
            analytics
          };
        })
      );

      const engagementPatterns = await this.engagementAnalytics.getEngagementPatterns();

      return {
        systemMetrics,
        activeCampaigns,
        botMetrics,
        engagementPatterns
      };
    } catch (error) {
      console.error('Failed to get real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Create a batch of bot personas
   */
  public async createBotBatch(count: number = 50): Promise<BotPersona[]> {
    try {
      console.log(`Creating batch of ${count} bot personas...`);
      
      const bots = await this.botPersonaService.createBotBatch(count, {
        casual: 30,
        professional: 20,
        enthusiastic: 25,
        analytical: 15,
        humorous: 10
      });

      console.log(`✅ Created ${bots.length} bot personas`);
      return bots;
    } catch (error) {
      console.error('Failed to create bot batch:', error);
      throw error;
    }
  }

  /**
   * Generate bot comment using Gemini API
   */
  public async generateBotComment(
    botId: string, 
    content: Content, 
    context?: string
  ): Promise<string> {
    try {
      const bot = await this.botPersonaService.getBot(botId);
      if (!bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      const comment = await this.botPersonaService.generateBotResponse(bot, content, context);
      
      // Update bot analytics
      this.botPersonaService.updateBotAnalytics(
        botId, 
        'comment', 
        0.8, // authenticity score
        content.category
      );

      return comment;
    } catch (error) {
      console.error('Failed to generate bot comment:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  public async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    components: Record<string, 'operational' | 'degraded' | 'down'>;
    metrics: {
      activeBots: number;
      activeCampaigns: number;
      apiResponseTime: number;
      errorRate: number;
    };
    timestamp: Date;
  }> {
    try {
      const [activeBots, activeCampaigns, systemMetrics] = await Promise.all([
        this.botPersonaService.getActiveBots(),
        this.orchestrator.getActiveCampaigns(),
        this.analyticsService.getSystemMetrics()
      ]);

      const components = {
        orchestrator: 'operational' as const,
        botService: activeBots.length > 0 ? 'operational' as const : 'degraded' as const,
        analytics: 'operational' as const,
        geminiApi: await this.testGeminiAPI() ? 'operational' as const : 'degraded' as const
      };

      const errorRate = systemMetrics.apiErrors / Math.max(systemMetrics.apiCalls, 1);
      
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (errorRate > 0.1 || Object.values(components).includes('down')) {
        status = 'critical';
      } else if (errorRate > 0.05 || Object.values(components).includes('degraded')) {
        status = 'degraded';
      }

      return {
        status,
        components,
        metrics: {
          activeBots: activeBots.length,
          activeCampaigns: activeCampaigns.length,
          apiResponseTime: 0, // TODO: implement actual measurement
          errorRate
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        status: 'critical',
        components: {
          orchestrator: 'down',
          botService: 'down',
          analytics: 'down',
          geminiApi: 'down'
        },
        metrics: {
          activeBots: 0,
          activeCampaigns: 0,
          apiResponseTime: 0,
          errorRate: 1
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Emergency stop all operations
   */
  public async emergencyStop(reason: string): Promise<void> {
    try {
      console.log(`🚨 EMERGENCY STOP: ${reason}`);
      
      // Stop all campaigns
      await this.orchestrator.emergencyStopAll();
      
      // Deactivate all bots
      const activeBots = await this.botPersonaService.getActiveBots();
      await Promise.all(
        activeBots.map(bot => this.botPersonaService.deactivateBot(bot.id))
      );

      console.log('✅ Emergency stop completed');
    } catch (error) {
      console.error('Failed to execute emergency stop:', error);
      throw error;
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('Shutting down Integration Service...');
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      await this.orchestrator.emergencyStopAll();
      this.isInitialized = false;
      
      console.log('✅ Integration Service shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Initialize bot personas
   */
  private async initializeBotPersonas(): Promise<void> {
    const activeBots = await this.botPersonaService.getActiveBots();
    
    if (activeBots.length === 0) {
      console.log('No active bots found, creating initial batch...');
      await this.createBotBatch(25);
    } else {
      console.log(`Found ${activeBots.length} active bots`);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        if (health.status === 'critical') {
          console.warn('🚨 System health is critical:', health);
        } else if (health.status === 'degraded') {
          console.warn('⚠️ System health is degraded:', health);
        }
        
        // Update analytics with health metrics
        await this.analyticsService.recordMetric('system_health', health.status === 'healthy' ? 1 : 0);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Test Gemini API connectivity
   */
  private async testGeminiAPI(): Promise<boolean> {
    try {
      const testBot = await this.botPersonaService.getActiveBots().then(bots => bots[0]);
      if (!testBot) return true; // No bots to test with
      
      const testContent: Content = {
        id: 'test',
        title: 'Test Content',
        description: 'Test description',
        url: '',
        tags: ['test'],
        category: 'test',
        createdAt: new Date(),
        authorId: 'system',
        metadata: { views: 0, likes: 0, comments: 0, shares: 0 }
      };
      
      await this.botPersonaService.generateBotResponse(testBot, testContent, 'health check');
      return true;
    } catch (error) {
      console.error('Gemini API test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const integrationService = IntegrationService.getInstance();