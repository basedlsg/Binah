import { performance } from 'perf_hooks'
import { AnalyticsService } from '@/services/AnalyticsService'
import { BotPersonaService } from '@/services/BotPersonaService'
import { EngagementOrchestrator } from '@/services/EngagementOrchestrator'

// Mock external dependencies for performance testing
jest.mock('@/services/ViewingPatternService')
jest.mock('@/services/CommentGenerationService')
jest.mock('@/services/LikeDistributionService')
jest.mock('@/services/EngagementQueueService')

describe('API Performance Tests', () => {
  let analyticsService: AnalyticsService
  let botPersonaService: BotPersonaService
  let engagementOrchestrator: EngagementOrchestrator

  beforeEach(() => {
    analyticsService = new AnalyticsService()
    botPersonaService = new BotPersonaService()
    engagementOrchestrator = EngagementOrchestrator.getInstance()
    
    // Mock fetch for analytics service
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [],
        success: true
      })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Bot Creation Performance', () => {
    it('should create single bot within performance threshold', async () => {
      const startTime = performance.now()
      
      await botPersonaService.createBot()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should create 100 bots within acceptable time', async () => {
      const startTime = performance.now()
      
      const promises = Array.from({ length: 100 }, () => 
        botPersonaService.createBot()
      )
      
      await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle concurrent bot creation efficiently', async () => {
      const concurrentCreations = 50
      const startTime = performance.now()
      
      const promises = Array.from({ length: concurrentCreations }, () => 
        botPersonaService.createBot()
      )
      
      const results = await Promise.allSettled(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // All should succeed
      expect(results.every(result => result.status === 'fulfilled')).toBe(true)
      
      // Should complete within 3 seconds for concurrent operations
      expect(duration).toBeLessThan(3000)
    })

    it('should maintain performance with large bot collections', async () => {
      // Create 500 bots first
      const bots = await Promise.all(
        Array.from({ length: 500 }, () => botPersonaService.createBot())
      )
      
      // Test retrieval performance
      const startTime = performance.now()
      
      const activeBots = await botPersonaService.getActiveBots()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(activeBots.length).toBeGreaterThanOrEqual(500)
      expect(duration).toBeLessThan(200) // Should retrieve within 200ms
    })
  })

  describe('Analytics Service Performance', () => {
    it('should fetch overview metrics quickly', async () => {
      const startTime = performance.now()
      
      await analyticsService.getOverviewMetrics()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(500) // Should complete within 500ms
    })

    it('should handle multiple concurrent analytics requests', async () => {
      const startTime = performance.now()
      
      const promises = [
        analyticsService.getOverviewMetrics(),
        analyticsService.getBotMetrics(),
        analyticsService.getContentMetrics(),
        analyticsService.getSystemMetrics(),
        analyticsService.getEngagementPatterns()
      ]
      
      await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(2000) // All requests within 2 seconds
    })

    it('should generate reports efficiently', async () => {
      const startTime = performance.now()
      
      await analyticsService.generateReport('daily')
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(1000) // Report generation within 1 second
    })

    it('should handle large data exports performantly', async () => {
      const startTime = performance.now()
      
      const options = {
        format: 'csv' as const,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        metrics: ['views', 'likes', 'comments', 'shares'],
        includeCharts: false
      }
      
      await analyticsService.exportData(options)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(3000) // Large export within 3 seconds
    })
  })

  describe('Engagement Orchestrator Performance', () => {
    const mockContent = {
      id: 'content-1',
      title: 'Test Content',
      description: 'Test Description',
      url: 'https://example.com/content',
      tags: ['test', 'content'],
      category: 'entertainment',
      createdAt: new Date('2024-01-01'),
      authorId: 'author-1',
      metadata: {
        duration: 120,
        views: 1000,
        likes: 100,
        comments: 50,
        shares: 25,
      },
    }

    it('should create campaign quickly', async () => {
      const startTime = performance.now()
      
      await engagementOrchestrator.createCampaign(mockContent)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(300) // Campaign creation within 300ms
    })

    it('should handle multiple concurrent campaigns', async () => {
      const campaignCount = 10
      const startTime = performance.now()
      
      const promises = Array.from({ length: campaignCount }, () => 
        engagementOrchestrator.createCampaign(mockContent)
      )
      
      const campaigns = await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(campaigns).toHaveLength(campaignCount)
      expect(duration).toBeLessThan(2000) // Multiple campaigns within 2 seconds
    })

    it('should start campaigns efficiently', async () => {
      // Create campaigns first
      const campaigns = await Promise.all(
        Array.from({ length: 5 }, () => 
          engagementOrchestrator.createCampaign(mockContent)
        )
      )
      
      const startTime = performance.now()
      
      // Start all campaigns
      await Promise.all(
        campaigns.map(campaign => 
          engagementOrchestrator.startCampaign(campaign.id)
        )
      )
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(1000) // Starting campaigns within 1 second
    })
  })

  describe('Memory Usage Tests', () => {
    it('should not leak memory during bot creation', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create and delete many bots
      for (let i = 0; i < 100; i++) {
        const bot = await botPersonaService.createBot()
        await botPersonaService.deleteBot(bot.id)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryGrowth = finalMemory - initialMemory
      
      // Memory growth should be minimal (less than 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    })

    it('should handle large data sets without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create large number of bots
      const bots = await Promise.all(
        Array.from({ length: 1000 }, () => botPersonaService.createBot())
      )
      
      const peakMemory = process.memoryUsage().heapUsed
      
      // Clean up
      await Promise.all(
        bots.map(bot => botPersonaService.deleteBot(bot.id))
      )
      
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      
      // Peak memory should be reasonable (less than 100MB growth)
      expect(peakMemory - initialMemory).toBeLessThan(100 * 1024 * 1024)
      
      // Should clean up most memory
      expect(finalMemory - initialMemory).toBeLessThan(20 * 1024 * 1024)
    })
  })

  describe('Database Query Performance', () => {
    it('should perform bot searches efficiently', async () => {
      // Create test bots
      await Promise.all(
        Array.from({ length: 200 }, (_, i) => 
          botPersonaService.createBot({
            interests: i % 2 === 0 ? ['technology'] : ['music'],
            engagementStyle: i % 3 === 0 ? 'analytical' : 'casual'
          })
        )
      )
      
      const startTime = performance.now()
      
      // Perform various searches
      await Promise.all([
        botPersonaService.getBotsByStyle('analytical'),
        botPersonaService.getBotsByInterests(['technology']),
        botPersonaService.getActiveBots()
      ])
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(500) // All searches within 500ms
    })

    it('should handle complex filtering efficiently', async () => {
      const mockContent = {
        id: 'content-1',
        title: 'Tech Video',
        description: 'Technology content',
        url: 'https://example.com',
        tags: ['technology', 'AI', 'programming'],
        category: 'technology',
        createdAt: new Date(),
        authorId: 'author-1',
        metadata: { views: 1000, likes: 100, comments: 50, shares: 25 }
      }
      
      // Create diverse bots
      await Promise.all(
        Array.from({ length: 300 }, (_, i) => 
          botPersonaService.createBot({
            interests: ['technology', 'AI', 'programming', 'music', 'sports'].slice(0, (i % 3) + 1),
            engagementStyle: ['analytical', 'casual', 'professional', 'enthusiastic'][i % 4]
          })
        )
      )
      
      const startTime = performance.now()
      
      const suitableBots = await botPersonaService.getBotsForContent(mockContent)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(suitableBots.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(800) // Complex filtering within 800ms
    })
  })

  describe('Stress Tests', () => {
    it('should handle high-frequency API calls', async () => {
      const callCount = 50
      const maxDuration = 5000 // 5 seconds
      
      const startTime = performance.now()
      
      // Simulate high-frequency calls
      const promises = Array.from({ length: callCount }, () => 
        analyticsService.getOverviewMetrics()
      )
      
      const results = await Promise.allSettled(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // All calls should succeed
      expect(results.every(result => result.status === 'fulfilled')).toBe(true)
      
      // Should handle high frequency within time limit
      expect(duration).toBeLessThan(maxDuration)
      
      // Average response time should be reasonable
      const avgResponseTime = duration / callCount
      expect(avgResponseTime).toBeLessThan(100) // Average < 100ms per call
    })

    it('should maintain performance under load', async () => {
      // Create load scenario: multiple campaigns with many bots
      const campaignPromises = Array.from({ length: 10 }, async () => {
        const campaign = await engagementOrchestrator.createCampaign(mockContent)
        await engagementOrchestrator.startCampaign(campaign.id)
        return campaign
      })
      
      const botPromises = Array.from({ length: 100 }, () => 
        botPersonaService.createBot()
      )
      
      const analyticsPromises = Array.from({ length: 20 }, () => 
        analyticsService.getOverviewMetrics()
      )
      
      const startTime = performance.now()
      
      await Promise.all([
        ...campaignPromises,
        ...botPromises,
        ...analyticsPromises
      ])
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should handle mixed load within 10 seconds
      expect(duration).toBeLessThan(10000)
    })
  })

  describe('Scalability Tests', () => {
    it('should scale linearly with data size', async () => {
      const testSizes = [10, 50, 100, 200]
      const results: number[] = []
      
      for (const size of testSizes) {
        // Clear previous bots
        const existingBots = await botPersonaService.getActiveBots()
        await Promise.all(
          existingBots.map(bot => botPersonaService.deleteBot(bot.id))
        )
        
        // Create bots of current size
        await Promise.all(
          Array.from({ length: size }, () => botPersonaService.createBot())
        )
        
        // Measure retrieval time
        const startTime = performance.now()
        await botPersonaService.getActiveBots()
        const endTime = performance.now()
        
        results.push(endTime - startTime)
      }
      
      // Check that time complexity is reasonable (not exponential)
      // Each doubling of size should not more than double the time
      for (let i = 1; i < results.length; i++) {
        const ratio = results[i] / results[i - 1]
        const sizeRatio = testSizes[i] / testSizes[i - 1]
        
        // Time increase should not be much worse than linear
        expect(ratio).toBeLessThan(sizeRatio * 1.5)
      }
    })
  })
})