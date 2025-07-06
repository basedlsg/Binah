import { EngagementOrchestrator } from '@/services/EngagementOrchestrator'
import { Content, EngagementParameters, AdminControl } from '@/types'

// Mock dependencies
jest.mock('@/services/ViewingPatternService')
jest.mock('@/services/CommentGenerationService')
jest.mock('@/services/LikeDistributionService')
jest.mock('@/services/EngagementQueueService')
jest.mock('@/services/BotPersonaService')

describe('EngagementOrchestrator', () => {
  let orchestrator: EngagementOrchestrator
  let mockContent: Content

  beforeEach(() => {
    orchestrator = EngagementOrchestrator.getInstance()
    
    mockContent = {
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EngagementOrchestrator.getInstance()
      const instance2 = EngagementOrchestrator.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('Campaign Creation', () => {
    it('should create campaign with default parameters', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign).toHaveProperty('id')
      expect(campaign.contentId).toBe(mockContent.id)
      expect(campaign.status).toBe('draft')
      expect(campaign.targetMetrics).toBeDefined()
      expect(campaign.parameters).toBeDefined()
      expect(campaign.analytics).toBeDefined()
      expect(campaign.createdAt).toBeInstanceOf(Date)
      expect(campaign.startDate).toBeInstanceOf(Date)
    })

    it('should create campaign with custom parameters', async () => {
      const customParameters: Partial<EngagementParameters> = {
        rateLimit: {
          maxEngagementsPerHour: 50,
          maxEngagementsPerDay: 500
        }
      }

      const campaign = await orchestrator.createCampaign(mockContent, customParameters)

      expect(campaign.parameters.rateLimit.maxEngagementsPerHour).toBe(50)
      expect(campaign.parameters.rateLimit.maxEngagementsPerDay).toBe(500)
    })

    it('should calculate target metrics based on content', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.targetMetrics.views).toBe(5000) // 1000 * 5
      expect(campaign.targetMetrics.likes).toBe(500) // 1000 * 0.1 * 5
      expect(campaign.targetMetrics.comments).toBe(100) // 1000 * 0.02 * 5
      expect(campaign.targetMetrics.shares).toBe(50) // 1000 * 0.01 * 5
    })

    it('should initialize analytics correctly', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.analytics.totalEngagements).toBe(0)
      expect(campaign.analytics.averageAuthenticityScore).toBe(0)
      expect(campaign.analytics.successRate).toBe(0)
      expect(campaign.analytics.botsParticipated).toBe(0)
      expect(campaign.analytics.engagementsByType).toEqual({
        view: 0,
        like: 0,
        comment: 0,
        share: 0,
        follow: 0
      })
    })
  })

  describe('Campaign Management', () => {
    let campaign: any

    beforeEach(async () => {
      campaign = await orchestrator.createCampaign(mockContent)
    })

    it('should start campaign successfully', async () => {
      await orchestrator.startCampaign(campaign.id)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('active')
      expect(updatedCampaign!.startDate).toBeInstanceOf(Date)
    })

    it('should throw error when starting non-existent campaign', async () => {
      await expect(orchestrator.startCampaign('non-existent'))
        .rejects.toThrow('Campaign non-existent not found')
    })

    it('should throw error when maximum concurrent campaigns reached', async () => {
      // Create and start 10 campaigns (the maximum)
      const campaigns = await Promise.all(
        Array.from({ length: 10 }, () => orchestrator.createCampaign(mockContent))
      )
      
      await Promise.all(
        campaigns.map(c => orchestrator.startCampaign(c.id))
      )

      // Try to start one more
      const extraCampaign = await orchestrator.createCampaign(mockContent)
      await expect(orchestrator.startCampaign(extraCampaign.id))
        .rejects.toThrow('Maximum concurrent campaigns reached')
    })

    it('should pause campaign successfully', async () => {
      await orchestrator.startCampaign(campaign.id)
      await orchestrator.pauseCampaign(campaign.id)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('paused')
    })

    it('should resume paused campaign', async () => {
      await orchestrator.startCampaign(campaign.id)
      await orchestrator.pauseCampaign(campaign.id)
      await orchestrator.resumeCampaign(campaign.id)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('active')
    })

    it('should stop campaign permanently', async () => {
      await orchestrator.startCampaign(campaign.id)
      await orchestrator.stopCampaign(campaign.id)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('completed')
      expect(updatedCampaign!.endDate).toBeInstanceOf(Date)
    })

    it('should handle emergency stop for all campaigns', async () => {
      const campaigns = await Promise.all([
        orchestrator.createCampaign(mockContent),
        orchestrator.createCampaign(mockContent),
        orchestrator.createCampaign(mockContent)
      ])

      await Promise.all(campaigns.map(c => orchestrator.startCampaign(c.id)))
      
      await orchestrator.emergencyStopAll()

      const activeCampaigns = orchestrator.getActiveCampaigns()
      expect(activeCampaigns).toHaveLength(0)
    })
  })

  describe('Campaign Retrieval', () => {
    let campaigns: any[]

    beforeEach(async () => {
      campaigns = await Promise.all([
        orchestrator.createCampaign(mockContent),
        orchestrator.createCampaign(mockContent),
        orchestrator.createCampaign(mockContent)
      ])
    })

    it('should get all campaigns', () => {
      const allCampaigns = orchestrator.getAllCampaigns()
      expect(allCampaigns.length).toBeGreaterThanOrEqual(3)
    })

    it('should get only active campaigns', async () => {
      await orchestrator.startCampaign(campaigns[0].id)
      await orchestrator.startCampaign(campaigns[1].id)
      // Leave campaigns[2] as draft

      const activeCampaigns = orchestrator.getActiveCampaigns()
      expect(activeCampaigns).toHaveLength(2)
      expect(activeCampaigns.every(c => c.status === 'active')).toBe(true)
    })

    it('should get campaign analytics', async () => {
      const analytics = orchestrator.getCampaignAnalytics(campaigns[0].id)
      
      expect(analytics).toBeDefined()
      expect(analytics!.totalEngagements).toBe(0)
      expect(analytics!.engagementsByType).toBeDefined()
      expect(analytics!.realTimeMetrics).toBeDefined()
    })

    it('should return null for non-existent campaign analytics', () => {
      const analytics = orchestrator.getCampaignAnalytics('non-existent')
      expect(analytics).toBeNull()
    })
  })

  describe('Admin Controls', () => {
    let campaign: any

    beforeEach(async () => {
      campaign = await orchestrator.createCampaign(mockContent)
    })

    it('should execute start admin control', async () => {
      const control: AdminControl = {
        campaignId: campaign.id,
        action: 'start',
        executedBy: 'admin-1',
        executedAt: new Date()
      }

      await orchestrator.executeAdminControl(control)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('active')
    })

    it('should execute pause admin control', async () => {
      await orchestrator.startCampaign(campaign.id)
      
      const control: AdminControl = {
        campaignId: campaign.id,
        action: 'pause',
        reason: 'Temporary maintenance',
        executedBy: 'admin-1',
        executedAt: new Date()
      }

      await orchestrator.executeAdminControl(control)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('paused')
    })

    it('should execute emergency stop admin control', async () => {
      await orchestrator.startCampaign(campaign.id)
      
      const control: AdminControl = {
        campaignId: campaign.id,
        action: 'emergency-stop',
        reason: 'Critical issue detected',
        executedBy: 'admin-1',
        executedAt: new Date()
      }

      await orchestrator.executeAdminControl(control)

      const activeCampaigns = orchestrator.getActiveCampaigns()
      expect(activeCampaigns).toHaveLength(0)
    })

    it('should update campaign parameters through admin control', async () => {
      const newParameters: Partial<EngagementParameters> = {
        rateLimit: {
          maxEngagementsPerHour: 25,
          maxEngagementsPerDay: 250
        }
      }

      const control: AdminControl = {
        campaignId: campaign.id,
        action: 'pause',
        parameters: newParameters,
        executedBy: 'admin-1',
        executedAt: new Date()
      }

      await orchestrator.executeAdminControl(control)

      const updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.parameters.rateLimit.maxEngagementsPerHour).toBe(25)
      expect(updatedCampaign!.parameters.rateLimit.maxEngagementsPerDay).toBe(250)
    })
  })

  describe('Phase Configuration', () => {
    it('should use default phase parameters', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.parameters.phases.discovery).toBeDefined()
      expect(campaign.parameters.phases.viralGrowth).toBeDefined()
      expect(campaign.parameters.phases.sustainedInterest).toBeDefined()
      expect(campaign.parameters.phases.archive).toBeDefined()

      expect(campaign.parameters.phases.discovery.durationDays).toBe(7)
      expect(campaign.parameters.phases.viralGrowth.durationDays).toBe(37)
      expect(campaign.parameters.phases.sustainedInterest.durationDays).toBe(75)
      expect(campaign.parameters.phases.archive.durationDays).toBe(365)
    })

    it('should validate phase engagement percentages', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.parameters.phases.discovery.engagementPercentage).toBe(15)
      expect(campaign.parameters.phases.viralGrowth.engagementPercentage).toBe(60)
      expect(campaign.parameters.phases.sustainedInterest.engagementPercentage).toBe(20)
      expect(campaign.parameters.phases.archive.engagementPercentage).toBe(5)
    })

    it('should have appropriate engagement types for each phase', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.parameters.phases.discovery.primaryEngagementTypes)
        .toEqual(['view', 'like'])
      expect(campaign.parameters.phases.viralGrowth.primaryEngagementTypes)
        .toEqual(['view', 'like', 'comment', 'share'])
      expect(campaign.parameters.phases.sustainedInterest.primaryEngagementTypes)
        .toEqual(['view', 'like', 'comment'])
      expect(campaign.parameters.phases.archive.primaryEngagementTypes)
        .toEqual(['view'])
    })
  })

  describe('Rate Limiting', () => {
    it('should have default rate limits', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.parameters.rateLimit.maxEngagementsPerHour).toBe(100)
      expect(campaign.parameters.rateLimit.maxEngagementsPerDay).toBe(1000)
    })

    it('should allow custom rate limits', async () => {
      const customParameters: Partial<EngagementParameters> = {
        rateLimit: {
          maxEngagementsPerHour: 200,
          maxEngagementsPerDay: 2000
        }
      }

      const campaign = await orchestrator.createCampaign(mockContent, customParameters)

      expect(campaign.parameters.rateLimit.maxEngagementsPerHour).toBe(200)
      expect(campaign.parameters.rateLimit.maxEngagementsPerDay).toBe(2000)
    })
  })

  describe('Authenticity Configuration', () => {
    it('should have default authenticity settings', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)

      expect(campaign.parameters.authenticity.minDelay).toBe(1000)
      expect(campaign.parameters.authenticity.maxDelay).toBe(30000)
      expect(campaign.parameters.authenticity.varianceFactors).toEqual([
        'user_behavior',
        'content_type',
        'time_of_day'
      ])
    })

    it('should allow custom authenticity settings', async () => {
      const customParameters: Partial<EngagementParameters> = {
        authenticity: {
          minDelay: 2000,
          maxDelay: 60000,
          varianceFactors: ['user_behavior', 'device_type']
        }
      }

      const campaign = await orchestrator.createCampaign(mockContent, customParameters)

      expect(campaign.parameters.authenticity.minDelay).toBe(2000)
      expect(campaign.parameters.authenticity.maxDelay).toBe(60000)
      expect(campaign.parameters.authenticity.varianceFactors).toEqual([
        'user_behavior',
        'device_type'
      ])
    })
  })

  describe('Error Handling', () => {
    it('should handle campaign not found errors gracefully', async () => {
      await expect(orchestrator.pauseCampaign('non-existent'))
        .rejects.toThrow('Campaign non-existent not found')
      
      await expect(orchestrator.resumeCampaign('non-existent'))
        .rejects.toThrow('Campaign non-existent not found')
      
      await expect(orchestrator.stopCampaign('non-existent'))
        .rejects.toThrow('Campaign non-existent not found')
    })

    it('should handle resume of non-paused campaign', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)
      
      await expect(orchestrator.resumeCampaign(campaign.id))
        .rejects.toThrow('Campaign ' + campaign.id + ' not found or not paused')
    })
  })

  describe('Campaign Lifecycle', () => {
    it('should transition through all states correctly', async () => {
      const campaign = await orchestrator.createCampaign(mockContent)
      
      // Initial state
      expect(campaign.status).toBe('draft')
      
      // Start campaign
      await orchestrator.startCampaign(campaign.id)
      let updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('active')
      
      // Pause campaign
      await orchestrator.pauseCampaign(campaign.id)
      updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('paused')
      
      // Resume campaign
      await orchestrator.resumeCampaign(campaign.id)
      updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('active')
      
      // Stop campaign
      await orchestrator.stopCampaign(campaign.id)
      updatedCampaign = orchestrator.getAllCampaigns().find(c => c.id === campaign.id)
      expect(updatedCampaign!.status).toBe('completed')
      expect(updatedCampaign!.endDate).toBeInstanceOf(Date)
    })
  })
})