import { BotPersonaService } from '@/services/BotPersonaService'
import { EngagementOrchestrator } from '@/services/EngagementOrchestrator'
import { AnalyticsService } from '@/services/AnalyticsService'
import { BotPersona, Content, EngagementCampaign } from '@/types'

describe('Data Integrity Validation', () => {
  let botPersonaService: BotPersonaService
  let engagementOrchestrator: EngagementOrchestrator
  let analyticsService: AnalyticsService

  beforeEach(() => {
    botPersonaService = new BotPersonaService()
    engagementOrchestrator = EngagementOrchestrator.getInstance()
    analyticsService = new AnalyticsService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Bot Persona Data Validation', () => {
    it('should validate bot persona data structure', async () => {
      const bot = await botPersonaService.createBot()
      
      // Validate required fields
      expect(bot.id).toBeDefined()
      expect(typeof bot.id).toBe('string')
      expect(bot.id.length).toBeGreaterThan(0)
      
      expect(bot.name).toBeDefined()
      expect(typeof bot.name).toBe('string')
      expect(bot.name.length).toBeGreaterThan(0)
      
      expect(bot.personality).toBeDefined()
      expect(typeof bot.personality).toBe('string')
      
      expect(Array.isArray(bot.interests)).toBe(true)
      expect(bot.interests.length).toBeGreaterThan(0)
      
      expect(['casual', 'professional', 'enthusiastic', 'analytical', 'humorous'])
        .toContain(bot.engagementStyle)
      
      // Validate demographics
      expect(bot.demographics).toBeDefined()
      expect(typeof bot.demographics.age).toBe('number')
      expect(bot.demographics.age).toBeGreaterThan(0)
      expect(bot.demographics.age).toBeLessThan(120)
      
      expect(typeof bot.demographics.location).toBe('string')
      expect(bot.demographics.location.length).toBeGreaterThan(0)
      
      expect(typeof bot.demographics.timezone).toBe('string')
      expect(bot.demographics.timezone.length).toBeGreaterThan(0)
      
      // Validate behavior patterns
      expect(bot.behaviorPatterns).toBeDefined()
      expect(Array.isArray(bot.behaviorPatterns.activeHours)).toBe(true)
      expect(bot.behaviorPatterns.activeHours.every(hour => 
        typeof hour === 'number' && hour >= 0 && hour <= 23
      )).toBe(true)
      
      expect(['low', 'medium', 'high']).toContain(bot.behaviorPatterns.engagementFrequency)
      
      expect(Array.isArray(bot.behaviorPatterns.contentPreferences)).toBe(true)
      
      // Validate timestamps
      expect(bot.createdAt).toBeInstanceOf(Date)
      expect(bot.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
      
      expect(typeof bot.isActive).toBe('boolean')
    })

    it('should validate bot ID uniqueness', async () => {
      const bots = await Promise.all(
        Array.from({ length: 100 }, () => botPersonaService.createBot())
      )
      
      const ids = bots.map(bot => bot.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length) // All IDs should be unique
    })

    it('should validate bot name format', async () => {
      const bots = await Promise.all(
        Array.from({ length: 50 }, () => botPersonaService.createBot())
      )
      
      bots.forEach(bot => {
        // Name should be in "First Last" format
        expect(bot.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
      })
    })

    it('should validate interest categories', async () => {
      const validInterests = [
        'technology', 'sports', 'entertainment', 'education', 'business', 'science',
        'art', 'music', 'travel', 'food', 'fitness', 'gaming', 'news', 'lifestyle',
        'fashion', 'health', 'environment', 'politics', 'culture', 'history'
      ]
      
      const bots = await Promise.all(
        Array.from({ length: 30 }, () => botPersonaService.createBot())
      )
      
      bots.forEach(bot => {
        bot.interests.forEach(interest => {
          expect(validInterests).toContain(interest)
        })
      })
    })

    it('should validate timezone formats', async () => {
      const bots = await Promise.all(
        Array.from({ length: 30 }, () => botPersonaService.createBot())
      )
      
      bots.forEach(bot => {
        // Should be valid timezone format
        expect(bot.demographics.timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/)
      })
    })
  })

  describe('Campaign Data Validation', () => {
    const mockContent: Content = {
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

    it('should validate campaign data structure', async () => {
      const campaign = await engagementOrchestrator.createCampaign(mockContent)
      
      // Validate required fields
      expect(campaign.id).toBeDefined()
      expect(typeof campaign.id).toBe('string')
      expect(campaign.id.length).toBeGreaterThan(0)
      
      expect(campaign.contentId).toBe(mockContent.id)
      
      // Validate target metrics
      expect(campaign.targetMetrics).toBeDefined()
      expect(typeof campaign.targetMetrics.views).toBe('number')
      expect(typeof campaign.targetMetrics.likes).toBe('number')
      expect(typeof campaign.targetMetrics.comments).toBe('number')
      expect(typeof campaign.targetMetrics.shares).toBe('number')
      
      expect(campaign.targetMetrics.views).toBeGreaterThan(0)
      expect(campaign.targetMetrics.likes).toBeGreaterThan(0)
      expect(campaign.targetMetrics.comments).toBeGreaterThan(0)
      expect(campaign.targetMetrics.shares).toBeGreaterThan(0)
      
      // Validate status
      expect(['draft', 'active', 'paused', 'completed', 'cancelled'])
        .toContain(campaign.status)
      
      // Validate timestamps
      expect(campaign.createdAt).toBeInstanceOf(Date)
      expect(campaign.startDate).toBeInstanceOf(Date)
      expect(campaign.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
      
      // Validate parameters structure
      expect(campaign.parameters).toBeDefined()
      expect(campaign.parameters.phases).toBeDefined()
      expect(campaign.parameters.rateLimit).toBeDefined()
      expect(campaign.parameters.authenticity).toBeDefined()
      
      // Validate analytics structure
      expect(campaign.analytics).toBeDefined()
      expect(typeof campaign.analytics.totalEngagements).toBe('number')
      expect(campaign.analytics.engagementsByType).toBeDefined()
      expect(campaign.analytics.engagementsByPhase).toBeDefined()
    })

    it('should validate phase configurations', async () => {
      const campaign = await engagementOrchestrator.createCampaign(mockContent)
      
      const phases = ['discovery', 'viralGrowth', 'sustainedInterest', 'archive']
      
      phases.forEach(phaseName => {
        const phase = campaign.parameters.phases[phaseName as keyof typeof campaign.parameters.phases]
        
        expect(phase).toBeDefined()
        expect(typeof phase.durationDays).toBe('number')
        expect(phase.durationDays).toBeGreaterThan(0)
        
        expect(typeof phase.engagementPercentage).toBe('number')
        expect(phase.engagementPercentage).toBeGreaterThan(0)
        expect(phase.engagementPercentage).toBeLessThanOrEqual(100)
        
        expect(Array.isArray(phase.primaryEngagementTypes)).toBe(true)
        expect(phase.primaryEngagementTypes.length).toBeGreaterThan(0)
        
        phase.primaryEngagementTypes.forEach(type => {
          expect(['view', 'like', 'comment', 'share', 'follow']).toContain(type)
        })
        
        expect(phase.timing).toBeDefined()
        expect(Array.isArray(phase.timing.peakHours)).toBe(true)
        expect(phase.timing.peakHours.every(hour => 
          typeof hour === 'number' && hour >= 0 && hour <= 23
        )).toBe(true)
        
        expect(['uniform', 'natural', 'burst']).toContain(phase.timing.distributionPattern)
      })
    })

    it('should validate rate limiting configuration', async () => {
      const campaign = await engagementOrchestrator.createCampaign(mockContent)
      
      expect(typeof campaign.parameters.rateLimit.maxEngagementsPerHour).toBe('number')
      expect(campaign.parameters.rateLimit.maxEngagementsPerHour).toBeGreaterThan(0)
      
      expect(typeof campaign.parameters.rateLimit.maxEngagementsPerDay).toBe('number')
      expect(campaign.parameters.rateLimit.maxEngagementsPerDay).toBeGreaterThan(0)
      
      // Daily limit should be >= hourly limit * 24
      expect(campaign.parameters.rateLimit.maxEngagementsPerDay)
        .toBeGreaterThanOrEqual(campaign.parameters.rateLimit.maxEngagementsPerHour)
    })

    it('should validate authenticity configuration', async () => {
      const campaign = await engagementOrchestrator.createCampaign(mockContent)
      
      expect(typeof campaign.parameters.authenticity.minDelay).toBe('number')
      expect(campaign.parameters.authenticity.minDelay).toBeGreaterThan(0)
      
      expect(typeof campaign.parameters.authenticity.maxDelay).toBe('number')
      expect(campaign.parameters.authenticity.maxDelay).toBeGreaterThan(0)
      
      // Max delay should be >= min delay
      expect(campaign.parameters.authenticity.maxDelay)
        .toBeGreaterThanOrEqual(campaign.parameters.authenticity.minDelay)
      
      expect(Array.isArray(campaign.parameters.authenticity.varianceFactors)).toBe(true)
      expect(campaign.parameters.authenticity.varianceFactors.length).toBeGreaterThan(0)
    })
  })

  describe('Analytics Data Validation', () => {
    beforeEach(() => {
      // Mock fetch for analytics service
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })
    })

    it('should validate metric data ranges', async () => {
      const mockMetrics = [
        {
          id: 'metric-1',
          name: 'Engagement Rate',
          value: 7.5,
          change: 15.2,
          changeType: 'increase',
          timestamp: new Date()
        }
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockMetrics,
          success: true
        })
      })

      const metrics = await analyticsService.getOverviewMetrics()
      
      metrics.forEach(metric => {
        // Engagement rates should be between 0 and 100
        if (metric.name.toLowerCase().includes('rate')) {
          expect(metric.value).toBeGreaterThanOrEqual(0)
          expect(metric.value).toBeLessThanOrEqual(100)
        }
        
        // Change percentages should be reasonable (-100 to +1000)
        expect(metric.change).toBeGreaterThanOrEqual(-100)
        expect(metric.change).toBeLessThanOrEqual(1000)
        
        // Timestamps should be recent
        const now = new Date()
        const metricTime = new Date(metric.timestamp)
        const timeDiff = now.getTime() - metricTime.getTime()
        expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000) // Within 24 hours
      })
    })

    it('should validate consistency between related metrics', async () => {
      const mockContentMetrics = [
        {
          id: 'content-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          contentId: 'content-1',
          contentType: 'post',
          views: 1000,
          likes: 100,
          comments: 50,
          shares: 25,
          engagementRate: 0.175,
          authenticityScore: 0.85,
          performanceScore: 0.78
        }
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockContentMetrics,
          success: true
        })
      })

      const contentMetrics = await analyticsService.getContentMetrics()
      
      contentMetrics.forEach(content => {
        // Engagement rate calculation validation
        const totalEngagements = content.likes + content.comments + content.shares
        const calculatedRate = totalEngagements / content.views
        
        // Allow for small rounding differences
        expect(Math.abs(content.engagementRate - calculatedRate)).toBeLessThan(0.01)
        
        // Authenticity score should be between 0 and 1
        expect(content.authenticityScore).toBeGreaterThanOrEqual(0)
        expect(content.authenticityScore).toBeLessThanOrEqual(1)
        
        // Performance score should be between 0 and 1
        expect(content.performanceScore).toBeGreaterThanOrEqual(0)
        expect(content.performanceScore).toBeLessThanOrEqual(1)
        
        // Views should be >= sum of other engagements
        expect(content.views).toBeGreaterThanOrEqual(totalEngagements)
      })
    })
  })

  describe('Cross-Service Data Consistency', () => {
    it('should maintain consistency between bot creation and analytics', async () => {
      const initialBots = await botPersonaService.getActiveBots()
      const initialCount = initialBots.length
      
      // Create new bots
      const newBots = await Promise.all(
        Array.from({ length: 10 }, () => botPersonaService.createBot())
      )
      
      const finalBots = await botPersonaService.getActiveBots()
      const finalCount = finalBots.length
      
      // Count should increase by exactly the number of bots created
      expect(finalCount).toBe(initialCount + 10)
      
      // All new bots should be in the final list
      newBots.forEach(newBot => {
        expect(finalBots.some(bot => bot.id === newBot.id)).toBe(true)
      })
    })

    it('should maintain consistency between campaigns and content', async () => {
      const mockContent: Content = {
        id: 'consistency-test-content',
        title: 'Consistency Test',
        description: 'Test content for consistency validation',
        url: 'https://example.com/test',
        tags: ['test'],
        category: 'test',
        createdAt: new Date(),
        authorId: 'test-author',
        metadata: {
          views: 100,
          likes: 10,
          comments: 5,
          shares: 2,
        },
      }

      const campaign = await engagementOrchestrator.createCampaign(mockContent)
      
      // Campaign should reference the correct content
      expect(campaign.contentId).toBe(mockContent.id)
      
      // Target metrics should be based on content's current metrics
      expect(campaign.targetMetrics.views).toBeGreaterThan(mockContent.metadata.views)
      expect(campaign.targetMetrics.likes).toBeGreaterThan(mockContent.metadata.likes)
      expect(campaign.targetMetrics.comments).toBeGreaterThan(mockContent.metadata.comments)
      expect(campaign.targetMetrics.shares).toBeGreaterThan(mockContent.metadata.shares)
    })
  })

  describe('Data Constraints Validation', () => {
    it('should enforce bot creation limits', async () => {
      // Try to create more than the maximum allowed bots
      const maxBots = 1000
      
      // Create bots up to the limit
      const bots = await Promise.all(
        Array.from({ length: maxBots }, () => botPersonaService.createBot())
      )
      
      expect(bots).toHaveLength(maxBots)
      
      // Try to create one more - should fail
      await expect(botPersonaService.createBot())
        .rejects.toThrow('Maximum number of bots reached')
    })

    it('should enforce campaign limits', async () => {
      const mockContent: Content = {
        id: 'limit-test-content',
        title: 'Limit Test',
        description: 'Test content for limit validation',
        url: 'https://example.com/limit-test',
        tags: ['test'],
        category: 'test',
        createdAt: new Date(),
        authorId: 'test-author',
        metadata: {
          views: 100,
          likes: 10,
          comments: 5,
          shares: 2,
        },
      }

      // Create and start maximum number of campaigns
      const maxConcurrentCampaigns = 10
      
      const campaigns = await Promise.all(
        Array.from({ length: maxConcurrentCampaigns }, () => 
          engagementOrchestrator.createCampaign(mockContent)
        )
      )
      
      // Start all campaigns
      await Promise.all(
        campaigns.map(campaign => 
          engagementOrchestrator.startCampaign(campaign.id)
        )
      )
      
      // Try to start one more campaign - should fail
      const extraCampaign = await engagementOrchestrator.createCampaign(mockContent)
      
      await expect(engagementOrchestrator.startCampaign(extraCampaign.id))
        .rejects.toThrow('Maximum concurrent campaigns reached')
    })
  })

  describe('Data Type Validation', () => {
    it('should validate all numeric fields are valid numbers', async () => {
      const bot = await botPersonaService.createBot()
      
      // Check all numeric fields
      expect(Number.isFinite(bot.demographics.age)).toBe(true)
      expect(Number.isNaN(bot.demographics.age)).toBe(false)
      
      bot.behaviorPatterns.activeHours.forEach(hour => {
        expect(Number.isFinite(hour)).toBe(true)
        expect(Number.isInteger(hour)).toBe(true)
      })
    })

    it('should validate all date fields are valid dates', async () => {
      const bot = await botPersonaService.createBot()
      
      expect(bot.createdAt).toBeInstanceOf(Date)
      expect(Number.isNaN(bot.createdAt.getTime())).toBe(false)
      
      const campaign = await engagementOrchestrator.createCampaign({
        id: 'date-test-content',
        title: 'Date Test',
        description: 'Test content for date validation',
        url: 'https://example.com/date-test',
        tags: ['test'],
        category: 'test',
        createdAt: new Date(),
        authorId: 'test-author',
        metadata: {
          views: 100,
          likes: 10,
          comments: 5,
          shares: 2,
        },
      })
      
      expect(campaign.createdAt).toBeInstanceOf(Date)
      expect(campaign.startDate).toBeInstanceOf(Date)
      expect(Number.isNaN(campaign.createdAt.getTime())).toBe(false)
      expect(Number.isNaN(campaign.startDate.getTime())).toBe(false)
    })

    it('should validate all required string fields are non-empty', async () => {
      const bot = await botPersonaService.createBot()
      
      expect(typeof bot.id).toBe('string')
      expect(bot.id.trim().length).toBeGreaterThan(0)
      
      expect(typeof bot.name).toBe('string')
      expect(bot.name.trim().length).toBeGreaterThan(0)
      
      expect(typeof bot.personality).toBe('string')
      expect(bot.personality.trim().length).toBeGreaterThan(0)
      
      expect(typeof bot.demographics.location).toBe('string')
      expect(bot.demographics.location.trim().length).toBeGreaterThan(0)
      
      expect(typeof bot.demographics.timezone).toBe('string')
      expect(bot.demographics.timezone.trim().length).toBeGreaterThan(0)
    })
  })
})