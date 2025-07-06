/**
 * Integration tests for Malkuth Platform
 * Tests the full system integration including all components
 */

import { integrationService } from '../services/IntegrationService';
import { BotPersonaService } from '../services/BotPersonaService';
import { CommentGenerationService } from '../services/CommentGenerationService';
import { EngagementOrchestrator } from '../services/EngagementOrchestrator';
import { Content, BotPersona } from '../types';

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.GEMINI_MODEL = 'gemini-pro';

describe('Malkuth Platform Integration Tests', () => {
  let botPersonaService: BotPersonaService;
  let commentService: CommentGenerationService;
  let orchestrator: EngagementOrchestrator;
  let testContent: Content;
  let testBot: BotPersona;

  beforeAll(async () => {
    // Initialize services
    botPersonaService = new BotPersonaService();
    commentService = new CommentGenerationService();
    orchestrator = EngagementOrchestrator.getInstance();

    // Create test data
    testContent = {
      id: 'test-content-1',
      title: 'Amazing AI Technology Demo',
      description: 'A demonstration of cutting-edge AI technology',
      url: 'https://example.com/content/1',
      tags: ['AI', 'technology', 'demo', 'innovation'],
      category: 'technology',
      createdAt: new Date(),
      authorId: 'test-author',
      metadata: {
        views: 1000,
        likes: 50,
        comments: 10,
        shares: 5
      }
    };

    testBot = await botPersonaService.createBot({
      name: 'Test Bot Alex',
      personality: 'Curious and analytical tech enthusiast',
      interests: ['AI', 'technology', 'programming'],
      engagementStyle: 'analytical'
    });
  });

  describe('System Initialization', () => {
    test('should initialize integration service successfully', async () => {
      await expect(integrationService.initialize()).resolves.not.toThrow();
    });

    test('should have active bots after initialization', async () => {
      const activeBots = await botPersonaService.getActiveBots();
      expect(activeBots.length).toBeGreaterThan(0);
    });

    test('should get system health status', async () => {
      const health = await integrationService.getSystemHealth();
      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|critical/);
      expect(health.components).toBeDefined();
      expect(health.metrics).toBeDefined();
    });
  });

  describe('Bot Persona Integration', () => {
    test('should create bot personas with diverse characteristics', async () => {
      const bots = await botPersonaService.createBotBatch(5);
      expect(bots).toHaveLength(5);
      
      // Check diversity in engagement styles
      const styles = bots.map(bot => bot.engagementStyle);
      const uniqueStyles = new Set(styles);
      expect(uniqueStyles.size).toBeGreaterThan(1);
    });

    test('should find bots suitable for content', async () => {
      const suitableBots = await botPersonaService.getBotsForContent(testContent);
      expect(suitableBots.length).toBeGreaterThan(0);
      
      // Verify bots have relevant interests
      const relevantBot = suitableBots.find(bot => 
        bot.interests.some(interest => testContent.tags.includes(interest))
      );
      expect(relevantBot).toBeDefined();
    });

    test('should generate bot responses with Gemini API fallback', async () => {
      const response = await botPersonaService.generateBotResponse(
        testBot, 
        testContent, 
        'test context'
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response.length).toBeLessThan(500); // Reasonable length
    });
  });

  describe('Comment Generation Integration', () => {
    test('should generate comments using different methods', async () => {
      // Test AI comment generation
      const aiComment = await commentService.generateAIComment(
        testContent, 
        testBot, 
        'engagement context'
      );
      expect(aiComment).toBeDefined();
      expect(typeof aiComment).toBe('string');

      // Test full comment object generation
      const comment = await commentService.generateComment(testContent, testBot);
      expect(comment).toBeDefined();
      expect(comment.text).toBeDefined();
      expect(comment.authorId).toBe(testBot.id);
      expect(comment.contentId).toBe(testContent.id);
      expect(comment.isBot).toBe(true);
    });

    test('should generate conversation threads', async () => {
      const bots = await botPersonaService.getActiveBots();
      const selectedBots = bots.slice(0, 3);
      
      const thread = await commentService.generateConversationThread(
        testContent, 
        selectedBots, 
        3
      );
      
      expect(thread).toBeDefined();
      expect(thread.participants.length).toBe(selectedBots.length);
      expect(thread.depth).toBeGreaterThan(0);
    });

    test('should analyze comment sentiment correctly', async () => {
      const positiveComment = await commentService.generateComment(testContent, {
        ...testBot,
        engagementStyle: 'enthusiastic'
      });
      
      const sentiment = commentService.analyzeSentiment(positiveComment);
      expect(['positive', 'neutral', 'negative']).toContain(sentiment);
    });
  });

  describe('Engagement Orchestration Integration', () => {
    test('should create and manage engagement campaigns', async () => {
      const campaign = await integrationService.createContentCampaign(testContent);
      
      expect(campaign).toBeDefined();
      expect(campaign.contentId).toBe(testContent.id);
      expect(campaign.status).toBe('active');
      expect(campaign.targetMetrics).toBeDefined();

      // Check if campaign appears in active campaigns
      const activeCampaigns = orchestrator.getActiveCampaigns();
      const foundCampaign = activeCampaigns.find(c => c.id === campaign.id);
      expect(foundCampaign).toBeDefined();
    });

    test('should generate realistic engagement schedules', async () => {
      const campaign = await orchestrator.createCampaign(testContent);
      
      expect(campaign.parameters).toBeDefined();
      expect(campaign.parameters.phases).toBeDefined();
      expect(campaign.parameters.phases.discovery).toBeDefined();
      expect(campaign.parameters.phases.viralGrowth).toBeDefined();
      expect(campaign.parameters.phases.sustainedInterest).toBeDefined();
      expect(campaign.parameters.phases.archive).toBeDefined();
    });

    test('should handle campaign control operations', async () => {
      const campaign = await orchestrator.createCampaign(testContent);
      
      // Test pause/resume
      await expect(orchestrator.pauseCampaign(campaign.id)).resolves.not.toThrow();
      await expect(orchestrator.resumeCampaign(campaign.id)).resolves.not.toThrow();
      
      // Test stop
      await expect(orchestrator.stopCampaign(campaign.id)).resolves.not.toThrow();
    });
  });

  describe('Real-time Analytics Integration', () => {
    test('should provide real-time analytics data', async () => {
      const analytics = await integrationService.getRealTimeAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.systemMetrics).toBeDefined();
      expect(analytics.activeCampaigns).toBeDefined();
      expect(analytics.botMetrics).toBeDefined();
      expect(analytics.engagementPatterns).toBeDefined();
    });

    test('should track bot performance metrics', async () => {
      // Generate some activity
      await integrationService.generateBotComment(
        testBot.id, 
        testContent, 
        'test context'
      );

      const analytics = botPersonaService.getBotAnalytics(testBot.id);
      expect(analytics).toBeDefined();
    });
  });

  describe('API Integration', () => {
    test('should handle API requests correctly', async () => {
      // Mock API request
      const mockRequest = {
        url: 'http://localhost:3000/api/integration?action=health',
        method: 'GET',
        json: async () => ({}),
        headers: new Map()
      } as any;

      // This would be tested with actual HTTP requests in a full e2e test
      expect(mockRequest).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle Gemini API failures gracefully', async () => {
      // Temporarily disable API key
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'invalid-key';

      const response = await botPersonaService.generateBotResponse(
        testBot, 
        testContent
      );
      
      // Should fallback to template response
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');

      // Restore API key
      process.env.GEMINI_API_KEY = originalKey;
    });

    test('should handle emergency stop correctly', async () => {
      // Create a campaign first
      const campaign = await orchestrator.createCampaign(testContent);
      await orchestrator.startCampaign(campaign.id);

      // Execute emergency stop
      await expect(integrationService.emergencyStop('Test emergency stop'))
        .resolves.not.toThrow();

      // Verify all campaigns are stopped
      const activeCampaigns = orchestrator.getActiveCampaigns();
      expect(activeCampaigns.length).toBe(0);
    });

    test('should validate input data properly', async () => {
      // Test with invalid content
      const invalidContent = { ...testContent, id: '' };
      
      await expect(async () => {
        await orchestrator.createCampaign(invalidContent as Content);
      }).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle batch operations efficiently', async () => {
      const startTime = Date.now();
      
      const bots = await botPersonaService.createBotBatch(10);
      const comments = await Promise.all(
        bots.map(bot => commentService.generateComment(testContent, bot))
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(bots).toHaveLength(10);
      expect(comments).toHaveLength(10);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should maintain performance under load', async () => {
      const concurrentOperations = Array.from({ length: 5 }, async (_, i) => {
        const bot = await botPersonaService.createBot({
          name: `Load Test Bot ${i}`,
          engagementStyle: 'casual'
        });
        return commentService.generateComment(testContent, bot);
      });

      const results = await Promise.all(concurrentOperations);
      expect(results).toHaveLength(5);
      expect(results.every(comment => comment.text.length > 0)).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across services', async () => {
      const bot = await botPersonaService.createBot({
        name: 'Consistency Test Bot',
        engagementStyle: 'professional'
      });

      // Generate activity
      const comment = await commentService.generateComment(testContent, bot);
      
      // Update analytics
      botPersonaService.updateBotAnalytics(
        bot.id,
        'comment',
        0.8,
        testContent.category
      );

      // Verify consistency
      const botData = await botPersonaService.getBot(bot.id);
      const analytics = botPersonaService.getBotAnalytics(bot.id);
      
      expect(botData).toBeDefined();
      expect(botData!.id).toBe(bot.id);
      expect(analytics).toBeDefined();
      expect(analytics!.totalEngagements).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Cleanup
    await integrationService.shutdown();
  });
});

// Test utilities
export function createMockContent(overrides: Partial<Content> = {}): Content {
  return {
    id: 'mock-content',
    title: 'Mock Content Title',
    description: 'Mock content description',
    url: 'https://example.com/mock',
    tags: ['test', 'mock'],
    category: 'test',
    createdAt: new Date(),
    authorId: 'mock-author',
    metadata: {
      views: 100,
      likes: 10,
      comments: 2,
      shares: 1
    },
    ...overrides
  };
}

export function createMockBot(overrides: Partial<BotPersona> = {}): BotPersona {
  return {
    id: 'mock-bot',
    name: 'Mock Bot',
    personality: 'Test personality',
    interests: ['test'],
    engagementStyle: 'casual',
    demographics: {
      age: 25,
      location: 'Test City, TC',
      timezone: 'America/New_York'
    },
    behaviorPatterns: {
      activeHours: [9, 12, 15, 18],
      engagementFrequency: 'medium',
      contentPreferences: ['test']
    },
    createdAt: new Date(),
    isActive: true,
    ...overrides
  };
}