import { BotPersonaService } from '@/services/BotPersonaService'
import { EngagementStyle, Content } from '@/types'

describe('BotPersonaService', () => {
  let botPersonaService: BotPersonaService

  beforeEach(() => {
    botPersonaService = new BotPersonaService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Bot Creation', () => {
    it('should create a bot with default parameters', async () => {
      const bot = await botPersonaService.createBot()

      expect(bot).toHaveProperty('id')
      expect(bot).toHaveProperty('name')
      expect(bot).toHaveProperty('personality')
      expect(bot).toHaveProperty('interests')
      expect(bot).toHaveProperty('engagementStyle')
      expect(bot).toHaveProperty('demographics')
      expect(bot).toHaveProperty('behaviorPatterns')
      expect(bot.isActive).toBe(true)
      expect(bot.createdAt).toBeInstanceOf(Date)
    })

    it('should create a bot with custom parameters', async () => {
      const params = {
        name: 'Custom Bot',
        personality: 'Tech enthusiast',
        interests: ['AI', 'blockchain'],
        engagementStyle: 'analytical' as EngagementStyle,
        demographics: {
          ageRange: [25, 35] as [number, number],
          location: 'New York, NY',
          timezone: 'America/New_York'
        }
      }

      const bot = await botPersonaService.createBot(params)

      expect(bot.name).toBe('Custom Bot')
      expect(bot.personality).toBe('Tech enthusiast')
      expect(bot.interests).toEqual(['AI', 'blockchain'])
      expect(bot.engagementStyle).toBe('analytical')
      expect(bot.demographics.location).toBe('New York, NY')
      expect(bot.demographics.timezone).toBe('America/New_York')
      expect(bot.demographics.age).toBeGreaterThanOrEqual(25)
      expect(bot.demographics.age).toBeLessThanOrEqual(35)
    })

    it('should throw error when maximum bots reached', async () => {
      // Create maximum number of bots (1000)
      const promises = Array.from({ length: 1000 }, () => botPersonaService.createBot())
      await Promise.all(promises)

      // Try to create one more
      await expect(botPersonaService.createBot()).rejects.toThrow('Maximum number of bots reached')
    })

    it('should generate unique IDs for each bot', async () => {
      const bot1 = await botPersonaService.createBot()
      const bot2 = await botPersonaService.createBot()

      expect(bot1.id).not.toBe(bot2.id)
    })
  })

  describe('Bot Retrieval', () => {
    it('should retrieve bot by ID', async () => {
      const createdBot = await botPersonaService.createBot()
      const retrievedBot = await botPersonaService.getBot(createdBot.id)

      expect(retrievedBot).toEqual(createdBot)
    })

    it('should return null for non-existent bot', async () => {
      const bot = await botPersonaService.getBot('non-existent-id')
      expect(bot).toBeNull()
    })

    it('should get all active bots', async () => {
      await botPersonaService.createBot()
      await botPersonaService.createBot()
      const bot3 = await botPersonaService.createBot()
      
      // Deactivate one bot
      await botPersonaService.deactivateBot(bot3.id)

      const activeBots = await botPersonaService.getActiveBots()
      expect(activeBots).toHaveLength(7) // 5 default + 2 created - 1 deactivated
      expect(activeBots.every(bot => bot.isActive)).toBe(true)
    })

    it('should get bots by engagement style', async () => {
      await botPersonaService.createBot({ engagementStyle: 'analytical' })
      await botPersonaService.createBot({ engagementStyle: 'analytical' })
      await botPersonaService.createBot({ engagementStyle: 'casual' })

      const analyticalBots = await botPersonaService.getBotsByStyle('analytical')
      expect(analyticalBots.length).toBeGreaterThanOrEqual(2)
      expect(analyticalBots.every(bot => bot.engagementStyle === 'analytical')).toBe(true)
    })

    it('should get bots by interests', async () => {
      await botPersonaService.createBot({ interests: ['technology', 'science'] })
      await botPersonaService.createBot({ interests: ['art', 'music'] })

      const techBots = await botPersonaService.getBotsByInterests(['technology'])
      expect(techBots.length).toBeGreaterThanOrEqual(1)
      expect(techBots.some(bot => bot.interests.includes('technology'))).toBe(true)
    })
  })

  describe('Bot Content Matching', () => {
    it('should find suitable bots for content', async () => {
      const content: Content = {
        id: 'content-1',
        title: 'Tech Innovation',
        description: 'Latest in AI technology',
        url: 'https://example.com',
        tags: ['technology', 'AI'],
        category: 'technology',
        createdAt: new Date(),
        authorId: 'author-1',
        metadata: { views: 100, likes: 10, comments: 5, shares: 2 }
      }

      await botPersonaService.createBot({ 
        interests: ['technology', 'AI'],
        behaviorPatterns: { contentPreferences: ['technology'] }
      })

      const suitableBots = await botPersonaService.getBotsForContent(content)
      expect(suitableBots.length).toBeGreaterThan(0)
    })

    it('should rank bots by relevance to content', async () => {
      const content: Content = {
        id: 'content-1',
        title: 'Music Production',
        description: 'Electronic music techniques',
        url: 'https://example.com',
        tags: ['music', 'electronic'],
        category: 'music',
        createdAt: new Date(),
        authorId: 'author-1',
        metadata: { views: 100, likes: 10, comments: 5, shares: 2 }
      }

      const musicBot = await botPersonaService.createBot({ 
        interests: ['music', 'electronic'],
        behaviorPatterns: { contentPreferences: ['music'] }
      })

      const techBot = await botPersonaService.createBot({ 
        interests: ['technology'],
        behaviorPatterns: { contentPreferences: ['technology'] }
      })

      const suitableBots = await botPersonaService.getBotsForContent(content)
      const musicBotIndex = suitableBots.findIndex(bot => bot.id === musicBot.id)
      const techBotIndex = suitableBots.findIndex(bot => bot.id === techBot.id)

      if (musicBotIndex !== -1 && techBotIndex !== -1) {
        expect(musicBotIndex).toBeLessThan(techBotIndex)
      }
    })
  })

  describe('Bot Management', () => {
    it('should update bot properties', async () => {
      const bot = await botPersonaService.createBot()
      const updates = { 
        name: 'Updated Name',
        personality: 'Updated personality'
      }

      const updatedBot = await botPersonaService.updateBot(bot.id, updates)

      expect(updatedBot).not.toBeNull()
      expect(updatedBot!.name).toBe('Updated Name')
      expect(updatedBot!.personality).toBe('Updated personality')
      expect(updatedBot!.id).toBe(bot.id)
    })

    it('should return null when updating non-existent bot', async () => {
      const result = await botPersonaService.updateBot('non-existent', { name: 'New Name' })
      expect(result).toBeNull()
    })

    it('should deactivate bot', async () => {
      const bot = await botPersonaService.createBot()
      await botPersonaService.deactivateBot(bot.id)

      const retrievedBot = await botPersonaService.getBot(bot.id)
      expect(retrievedBot!.isActive).toBe(false)
    })

    it('should activate bot', async () => {
      const bot = await botPersonaService.createBot()
      await botPersonaService.deactivateBot(bot.id)
      await botPersonaService.activateBot(bot.id)

      const retrievedBot = await botPersonaService.getBot(bot.id)
      expect(retrievedBot!.isActive).toBe(true)
    })

    it('should delete bot', async () => {
      const bot = await botPersonaService.createBot()
      await botPersonaService.deleteBot(bot.id)

      const retrievedBot = await botPersonaService.getBot(bot.id)
      expect(retrievedBot).toBeNull()
    })
  })

  describe('Bot Batch Operations', () => {
    it('should create batch of bots', async () => {
      const bots = await botPersonaService.createBotBatch(5)
      expect(bots).toHaveLength(5)
      expect(bots.every(bot => bot.id)).toBe(true)
    })

    it('should create batch with distribution', async () => {
      const distribution = {
        analytical: 2,
        casual: 2,
        professional: 1
      }

      const bots = await botPersonaService.createBotBatch(5, distribution)
      expect(bots).toHaveLength(5)

      const analyticalCount = bots.filter(bot => bot.engagementStyle === 'analytical').length
      const casualCount = bots.filter(bot => bot.engagementStyle === 'casual').length
      const professionalCount = bots.filter(bot => bot.engagementStyle === 'professional').length

      expect(analyticalCount).toBeGreaterThan(0)
      expect(casualCount).toBeGreaterThan(0)
      expect(professionalCount).toBeGreaterThan(0)
    })
  })

  describe('Bot Statistics', () => {
    it('should return bot statistics', async () => {
      // Clear existing bots by deactivating them
      const existingBots = await botPersonaService.getActiveBots()
      for (const bot of existingBots) {
        await botPersonaService.deactivateBot(bot.id)
      }

      // Create test bots
      await botPersonaService.createBot({ engagementStyle: 'analytical' })
      await botPersonaService.createBot({ engagementStyle: 'casual' })
      await botPersonaService.createBot({ engagementStyle: 'analytical' })

      const stats = botPersonaService.getBotStatistics()

      expect(stats.totalBots).toBeGreaterThanOrEqual(3)
      expect(stats.activeBots).toBe(3)
      expect(stats.botsByStyle.analytical).toBe(2)
      expect(stats.botsByStyle.casual).toBe(1)
      expect(stats.averageAge).toBeGreaterThan(0)
      expect(Object.keys(stats.locationDistribution).length).toBeGreaterThan(0)
    })
  })

  describe('Interaction Patterns', () => {
    it('should generate interaction pattern for bot and content', () => {
      const bot: any = {
        id: 'bot-1',
        behaviorPatterns: {
          activeHours: [9, 12, 15, 18, 21],
          engagementFrequency: 'high'
        }
      }

      const content: Content = {
        id: 'content-1',
        title: 'Test Content',
        description: 'Test',
        url: 'https://example.com',
        tags: ['test'],
        category: 'entertainment',
        createdAt: new Date(),
        authorId: 'author-1',
        metadata: { views: 100, likes: 10, comments: 5, shares: 2 }
      }

      const pattern = botPersonaService.generateInteractionPattern(bot, content)

      expect(pattern).toHaveProperty('discoveryAlgorithm')
      expect(pattern).toHaveProperty('temporalPattern')
      expect(pattern).toHaveProperty('engagementDepth')
      expect(pattern).toHaveProperty('relationshipLevel')
      expect(['trending', 'recommended', 'hashtag', 'user-follow']).toContain(pattern.discoveryAlgorithm)
    })
  })

  describe('Bot Analytics', () => {
    it('should initialize analytics for new bot', async () => {
      const bot = await botPersonaService.createBot()
      const analytics = botPersonaService.getBotAnalytics(bot.id)

      expect(analytics).not.toBeNull()
      expect(analytics!.totalEngagements).toBe(0)
      expect(analytics!.averageAuthenticityScore).toBe(0)
      expect(analytics!.activityPattern).toEqual([])
      expect(analytics!.contentPreferences).toEqual([])
    })

    it('should update bot analytics after engagement', async () => {
      const bot = await botPersonaService.createBot()
      
      botPersonaService.updateBotAnalytics(bot.id, 'like', 0.8, 'entertainment')
      const analytics = botPersonaService.getBotAnalytics(bot.id)

      expect(analytics!.totalEngagements).toBe(1)
      expect(analytics!.engagementsByType.like).toBe(1)
      expect(analytics!.averageAuthenticityScore).toBe(0.8)
      expect(analytics!.contentPreferences).toHaveLength(1)
      expect(analytics!.contentPreferences[0].category).toBe('entertainment')
    })

    it('should return null for non-existent bot analytics', () => {
      const analytics = botPersonaService.getBotAnalytics('non-existent')
      expect(analytics).toBeNull()
    })
  })

  describe('Random Generation', () => {
    it('should generate realistic names', async () => {
      const bot1 = await botPersonaService.createBot()
      const bot2 = await botPersonaService.createBot()

      expect(bot1.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/) // First Last format
      expect(bot2.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
      expect(bot1.name).not.toBe(bot2.name)
    })

    it('should generate varied personalities', async () => {
      const bots = await Promise.all(
        Array.from({ length: 10 }, () => botPersonaService.createBot())
      )

      const personalities = bots.map(bot => bot.personality)
      const uniquePersonalities = new Set(personalities)
      
      // Should have some variety in personalities
      expect(uniquePersonalities.size).toBeGreaterThan(1)
    })

    it('should generate appropriate active hours', async () => {
      const bot = await botPersonaService.createBot()
      
      expect(bot.behaviorPatterns.activeHours).toBeInstanceOf(Array)
      expect(bot.behaviorPatterns.activeHours.length).toBeGreaterThan(0)
      expect(bot.behaviorPatterns.activeHours.every(hour => hour >= 0 && hour <= 23)).toBe(true)
    })
  })
})