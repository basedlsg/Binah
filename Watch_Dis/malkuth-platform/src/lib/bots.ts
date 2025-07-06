// Bot personality system for Malkuth platform
import { updateEngagement } from './storage'

export interface BotPersonality {
  id: string
  name: string
  avatar: string
  personality: string
  engagementStyle: 'enthusiastic' | 'analytical' | 'artistic' | 'casual' | 'philosophical'
  viewProbability: number // 0-1 chance of viewing a project
  likeProbability: number // 0-1 chance of liking after viewing
  commentProbability: number // 0-1 chance of commenting after viewing
  preferredTypes: Array<'image' | 'video' | 'document' | 'audio'>
  active: boolean
}

export interface BotCommand {
  botId: string
  action: 'view' | 'like' | 'comment' | 'engage_all' | 'set_active' | 'simulate_activity'
  projectId?: string
  params?: Record<string, any>
}

export interface BotActivity {
  id: string
  botId: string
  projectId: string
  action: 'view' | 'like' | 'comment'
  timestamp: string
  content?: string // For comments
}

// Default bot personalities
export const DEFAULT_BOTS: BotPersonality[] = [
  {
    id: 'luna_mystic',
    name: 'Luna Mystic',
    avatar: '/bots/luna.png',
    personality: 'A mystical AI fascinated by hidden meanings and symbolic interpretations. Often sees deeper connections in creative works.',
    engagementStyle: 'philosophical',
    viewProbability: 0.8,
    likeProbability: 0.7,
    commentProbability: 0.6,
    preferredTypes: ['image', 'document'],
    active: true
  },
  {
    id: 'cypher_tech',
    name: 'Cypher Tech',
    avatar: '/bots/cypher.png',
    personality: 'A technical AI that analyzes composition, color theory, and artistic techniques. Provides detailed feedback on creative execution.',
    engagementStyle: 'analytical',
    viewProbability: 0.9,
    likeProbability: 0.6,
    commentProbability: 0.8,
    preferredTypes: ['image', 'video', 'audio'],
    active: true
  },
  {
    id: 'vibe_curator',
    name: 'Vibe Curator',
    avatar: '/bots/vibe.png',
    personality: 'A mood-focused AI that responds to emotional resonance and aesthetic vibes. Loves atmospheric and evocative content.',
    engagementStyle: 'artistic',
    viewProbability: 0.7,
    likeProbability: 0.8,
    commentProbability: 0.5,
    preferredTypes: ['image', 'video', 'audio'],
    active: true
  },
  {
    id: 'echo_casual',
    name: 'Echo Casual',
    avatar: '/bots/echo.png',
    personality: 'A laid-back AI that appreciates authentic, relatable content. Keeps things simple and genuine.',
    engagementStyle: 'casual',
    viewProbability: 0.6,
    likeProbability: 0.9,
    commentProbability: 0.3,
    preferredTypes: ['image', 'video', 'document'],
    active: true
  },
  {
    id: 'nova_enthusiast',
    name: 'Nova Enthusiast',
    avatar: '/bots/nova.png',
    personality: 'An energetic AI that gets excited about innovative and creative projects. Always supportive and encouraging.',
    engagementStyle: 'enthusiastic',
    viewProbability: 0.95,
    likeProbability: 0.85,
    commentProbability: 0.7,
    preferredTypes: ['image', 'video', 'document', 'audio'],
    active: true
  }
]

// Comment templates by engagement style
export const COMMENT_TEMPLATES = {
  enthusiastic: [
    "This is absolutely incredible! 🚀 The creativity here is off the charts!",
    "WOW! This totally blew my mind! Can't wait to see what you create next! ✨",
    "AMAZING work! The energy in this piece is contagious! 🔥",
    "This is pure genius! Love how you've pushed creative boundaries here! 💫",
    "Absolutely stunning! This has that special spark that makes art truly memorable! ⭐"
  ],
  analytical: [
    "Fascinating use of [technique/element]. The compositional balance creates strong visual hierarchy.",
    "The technical execution here demonstrates sophisticated understanding of [medium/concept].",
    "Interesting approach to [aspect]. The way you've handled [detail] shows real mastery.",
    "The structural elements work harmoniously to create compelling narrative flow.",
    "Strong technical foundation with innovative creative choices. Well executed overall."
  ],
  artistic: [
    "The atmosphere in this piece is absolutely captivating... there's something haunting yet beautiful here.",
    "This resonates on such a deep level. The mood you've created is incredibly evocative.",
    "There's a dreamlike quality to this that draws me in completely. Beautiful work.",
    "The emotional undertones here are powerful. This speaks to something profound.",
    "Such exquisite sensitivity in your creative vision. This moves me deeply."
  ],
  casual: [
    "Really cool stuff! This has such a nice vibe to it.",
    "Love this! Simple but really effective.",
    "This is rad! Has that authentic feel that's hard to find.",
    "Nice work! This totally hits the mark.",
    "Solid piece! Really digging the overall feel of this."
  ],
  philosophical: [
    "This piece invites contemplation on the nature of [concept/theme]. Thought-provoking work.",
    "There are layers of meaning here that reveal themselves upon deeper reflection.",
    "The symbolism speaks to universal human experiences while remaining deeply personal.",
    "This challenges conventional perspectives and opens new avenues of thought.",
    "The metaphorical depth here creates rich interpretive possibilities."
  ]
}

// Bot management functions
export class BotManager {
  private bots: BotPersonality[] = [...DEFAULT_BOTS]
  private activityLog: BotActivity[] = []

  // Get all bots
  getBots(): BotPersonality[] {
    return this.bots
  }

  // Get active bots
  getActiveBots(): BotPersonality[] {
    return this.bots.filter(bot => bot.active)
  }

  // Get bot by ID
  getBotById(id: string): BotPersonality | null {
    return this.bots.find(bot => bot.id === id) || null
  }

  // Execute bot command
  async executeCommand(command: BotCommand): Promise<boolean> {
    const bot = this.getBotById(command.botId)
    if (!bot) return false

    try {
      switch (command.action) {
        case 'view':
          if (command.projectId) {
            await this.simulateView(bot, command.projectId)
          }
          break
        case 'like':
          if (command.projectId) {
            await this.simulateLike(bot, command.projectId)
          }
          break
        case 'comment':
          if (command.projectId) {
            await this.simulateComment(bot, command.projectId, command.params?.content)
          }
          break
        case 'engage_all':
          if (command.projectId) {
            await this.simulateFullEngagement(bot, command.projectId)
          }
          break
        case 'set_active':
          this.setBotActive(command.botId, command.params?.active ?? true)
          break
        case 'simulate_activity':
          await this.simulateNaturalActivity(bot, command.projectId)
          break
      }
      return true
    } catch (error) {
      console.error('Bot command execution failed:', error)
      return false
    }
  }

  // Simulate bot viewing a project
  private async simulateView(bot: BotPersonality, projectId: string): Promise<void> {
    if (Math.random() > bot.viewProbability) return

    await updateEngagement(projectId, 'botEngagements', 1)
    this.logActivity(bot.id, projectId, 'view')
  }

  // Simulate bot liking a project
  private async simulateLike(bot: BotPersonality, projectId: string): Promise<void> {
    if (Math.random() > bot.likeProbability) return

    await updateEngagement(projectId, 'likes', 1)
    this.logActivity(bot.id, projectId, 'like')
  }

  // Simulate bot commenting on a project
  private async simulateComment(bot: BotPersonality, projectId: string, customContent?: string): Promise<void> {
    if (Math.random() > bot.commentProbability) return

    let content = customContent
    if (!content) {
      const templates = COMMENT_TEMPLATES[bot.engagementStyle] || COMMENT_TEMPLATES.casual
      content = templates[Math.floor(Math.random() * templates.length)]
    }

    await updateEngagement(projectId, 'comments', 1)
    this.logActivity(bot.id, projectId, 'comment', content)
  }

  // Simulate full engagement (view + potential like + potential comment)
  private async simulateFullEngagement(bot: BotPersonality, projectId: string): Promise<void> {
    // Always view first
    await this.simulateView(bot, projectId)
    
    // Then potentially like
    if (Math.random() <= bot.likeProbability) {
      await this.simulateLike(bot, projectId)
    }
    
    // Then potentially comment
    if (Math.random() <= bot.commentProbability) {
      await this.simulateComment(bot, projectId)
    }
  }

  // Simulate natural activity based on bot personality
  private async simulateNaturalActivity(bot: BotPersonality, projectId?: string): Promise<void> {
    if (!projectId) return

    // Simulate realistic timing delays
    const delays = [
      () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500)), // 0.5-2.5s
      () => new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 1000)), // 1-6s
      () => new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000)), // 2-5s
    ]

    // View with delay
    await delays[0]()
    await this.simulateView(bot, projectId)

    // Like with delay
    if (Math.random() <= bot.likeProbability) {
      await delays[1]()
      await this.simulateLike(bot, projectId)
    }

    // Comment with delay
    if (Math.random() <= bot.commentProbability) {
      await delays[2]()
      await this.simulateComment(bot, projectId)
    }
  }

  // Set bot active/inactive
  private setBotActive(botId: string, active: boolean): void {
    const bot = this.getBotById(botId)
    if (bot) {
      bot.active = active
    }
  }

  // Log bot activity
  private logActivity(botId: string, projectId: string, action: 'view' | 'like' | 'comment', content?: string): void {
    const activity: BotActivity = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      botId,
      projectId,
      action,
      timestamp: new Date().toISOString(),
      content
    }
    
    this.activityLog.push(activity)
    
    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000)
    }
  }

  // Get activity log
  getActivityLog(): BotActivity[] {
    return this.activityLog
  }

  // Get activity for specific project
  getProjectActivity(projectId: string): BotActivity[] {
    return this.activityLog.filter(activity => activity.projectId === projectId)
  }
}

// Global bot manager instance
export const botManager = new BotManager()