import { http, HttpResponse } from 'msw'
import {
  createMockAnalyticsMetric,
  createMockBotMetrics,
  createMockContentMetrics,
  createMockSystemMetrics,
  mockApiResponse
} from '../utils/test-utils'

// Mock API handlers for MSW
export const handlers = [
  // Analytics Overview
  http.get('/api/analytics/overview', () => {
    const metrics = [
      createMockAnalyticsMetric({
        id: 'total-views',
        name: 'Total Views',
        value: 125000,
        change: 15.5,
        changeType: 'increase'
      }),
      createMockAnalyticsMetric({
        id: 'total-likes',
        name: 'Total Likes',
        value: 8750,
        change: -2.3,
        changeType: 'decrease'
      }),
      createMockAnalyticsMetric({
        id: 'active-bots',
        name: 'Active Bots',
        value: 47,
        change: 0,
        changeType: 'neutral'
      }),
      createMockAnalyticsMetric({
        id: 'engagement-rate',
        name: 'Engagement Rate',
        value: 7.2,
        change: 12.8,
        changeType: 'increase'
      })
    ]
    
    return HttpResponse.json(mockApiResponse(metrics))
  }),

  // Bot Metrics
  http.get('/api/analytics/bots', ({ request }) => {
    const url = new URL(request.url)
    const botId = url.searchParams.get('botId')
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    
    let botMetrics = [
      createMockBotMetrics({
        id: 'bot-metrics-1',
        botId: 'bot-1',
        botName: 'Alex Chen',
        personality: 'Tech-savvy and curious',
        activeSessions: 5,
        totalInteractions: 150,
        averageResponseTime: 2.5,
        engagementQuality: 0.82,
        errorRate: 0.02,
        isActive: true
      }),
      createMockBotMetrics({
        id: 'bot-metrics-2',
        botId: 'bot-2',
        botName: 'Maya Rodriguez',
        personality: 'Creative and passionate',
        activeSessions: 3,
        totalInteractions: 98,
        averageResponseTime: 3.1,
        engagementQuality: 0.78,
        errorRate: 0.05,
        isActive: true
      }),
      createMockBotMetrics({
        id: 'bot-metrics-3',
        botId: 'bot-3',
        botName: 'Jordan Kim',
        personality: 'Business-minded',
        activeSessions: 0,
        totalInteractions: 45,
        averageResponseTime: 4.2,
        engagementQuality: 0.65,
        errorRate: 0.08,
        isActive: false
      })
    ]
    
    // Filter by botId if specified
    if (botId) {
      botMetrics = botMetrics.filter(metrics => metrics.botId === botId)
    }
    
    // Filter by active status if not including inactive
    if (!includeInactive) {
      botMetrics = botMetrics.filter(metrics => metrics.isActive)
    }
    
    return HttpResponse.json(mockApiResponse(botMetrics))
  }),

  // Content Metrics
  http.get('/api/analytics/content', ({ request }) => {
    const url = new URL(request.url)
    const contentType = url.searchParams.get('contentType')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    let contentMetrics = [
      createMockContentMetrics({
        id: 'content-metrics-1',
        contentId: 'content-1',
        contentType: 'post',
        views: 5000,
        likes: 500,
        comments: 100,
        shares: 50,
        engagementRate: 0.13,
        authenticityScore: 0.9,
        performanceScore: 0.95
      }),
      createMockContentMetrics({
        id: 'content-metrics-2',
        contentId: 'content-2',
        contentType: 'comment',
        views: 1200,
        likes: 80,
        comments: 25,
        shares: 5,
        engagementRate: 0.092,
        authenticityScore: 0.85,
        performanceScore: 0.78
      }),
      createMockContentMetrics({
        id: 'content-metrics-3',
        contentId: 'content-3',
        contentType: 'reply',
        views: 800,
        likes: 45,
        comments: 12,
        shares: 2,
        engagementRate: 0.074,
        authenticityScore: 0.88,
        performanceScore: 0.72
      })
    ]
    
    // Filter by content type if specified
    if (contentType) {
      contentMetrics = contentMetrics.filter(metrics => 
        metrics.contentType === contentType
      )
    }
    
    // Apply limit
    contentMetrics = contentMetrics.slice(0, limit)
    
    return HttpResponse.json(mockApiResponse(contentMetrics))
  }),

  // System Metrics
  http.get('/api/analytics/system', () => {
    const systemMetrics = createMockSystemMetrics({
      apiCalls: 45000,
      apiErrors: 12,
      geminiApiUsage: 1200,
      storageUsage: 524288000, // 500MB
      activeUsers: 1250,
      systemHealth: 'healthy',
      uptime: 99.8
    })
    
    return HttpResponse.json(mockApiResponse(systemMetrics))
  }),

  // Engagement Patterns
  http.get('/api/analytics/engagement-patterns', () => {
    const patterns = Array.from({ length: 24 }, (_, hour) => ({
      timeSlot: `${hour.toString().padStart(2, '0')}:00`,
      hour,
      day: 1,
      interactions: Math.floor(Math.random() * 200) + 50,
      authenticity: 0.7 + Math.random() * 0.3,
      botActivity: Math.floor(Math.random() * 100) + 20,
      contentCreation: Math.floor(Math.random() * 20) + 2
    }))
    
    return HttpResponse.json(mockApiResponse(patterns))
  }),

  // Activity Feed
  http.get('/api/analytics/activity-feed', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    const activities = Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
      id: `activity-${i + 1}`,
      type: ['bot_activity', 'content_creation', 'engagement', 'system_event'][i % 4],
      title: `Activity ${i + 1}`,
      description: `Description for activity ${i + 1}`,
      timestamp: new Date(Date.now() - i * 60000), // Each activity 1 minute apart
      severity: ['info', 'warning', 'error'][i % 3],
      metadata: {
        botId: i % 2 === 0 ? `bot-${(i % 10) + 1}` : undefined,
        contentId: i % 3 === 0 ? `content-${(i % 5) + 1}` : undefined
      }
    }))
    
    return HttpResponse.json(mockApiResponse(activities))
  }),

  // Top Content
  http.get('/api/analytics/top-content', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    const topContent = Array.from({ length: limit }, (_, i) => 
      createMockContentMetrics({
        id: `top-content-${i + 1}`,
        contentId: `content-${i + 1}`,
        contentType: 'post',
        views: 10000 - i * 500,
        likes: 1000 - i * 50,
        comments: 200 - i * 10,
        shares: 100 - i * 5,
        engagementRate: 0.15 - i * 0.005,
        authenticityScore: 0.95 - i * 0.02,
        performanceScore: 0.9 - i * 0.03
      })
    )
    
    return HttpResponse.json(mockApiResponse(topContent))
  }),

  // Trending Topics
  http.get('/api/analytics/trending-topics', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    const topics = [
      'artificial intelligence', 'machine learning', 'blockchain', 'cryptocurrency',
      'virtual reality', 'augmented reality', 'cloud computing', 'cybersecurity',
      'data science', 'internet of things', 'quantum computing', 'robotics',
      'biotechnology', 'renewable energy', 'space exploration', 'gaming',
      'social media', 'e-commerce', 'fintech', 'healthtech'
    ]
    
    const trendingTopics = topics.slice(0, limit).map((topic, i) => ({
      topic,
      count: 500 - i * 15,
      growth: Math.random() * 50 - 10 // -10% to +40%
    }))
    
    return HttpResponse.json(mockApiResponse(trendingTopics))
  }),

  // Cost Analysis
  http.get('/api/analytics/cost-analysis', ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'monthly'
    
    const baseCost = period === 'daily' ? 50 : period === 'weekly' ? 300 : 1250
    
    const costAnalysis = {
      totalCost: baseCost,
      geminiApiCost: baseCost * 0.64,
      storageCost: baseCost * 0.16,
      computeCost: baseCost * 0.20,
      costTrend: Math.random() * 20 - 5, // -5% to +15%
      breakdown: [
        { category: 'Gemini API', cost: baseCost * 0.64, percentage: 64.0 },
        { category: 'Storage', cost: baseCost * 0.16, percentage: 16.0 },
        { category: 'Compute', cost: baseCost * 0.20, percentage: 20.0 }
      ]
    }
    
    return HttpResponse.json(mockApiResponse(costAnalysis))
  }),

  // Report Generation
  http.post('/api/analytics/reports', async ({ request }) => {
    const body = await request.json() as any
    
    if (!body || !body.type) {
      return HttpResponse.json({
        success: false,
        error: 'Request body is required'
      }, { status: 400 })
    }
    
    if (!['daily', 'weekly', 'monthly', 'custom'].includes(body.type)) {
      return HttpResponse.json({
        success: false,
        error: 'Invalid report type'
      }, { status: 400 })
    }
    
    if (body.dateRange) {
      const start = new Date(body.dateRange.start)
      const end = new Date(body.dateRange.end)
      
      if (end <= start) {
        return HttpResponse.json({
          success: false,
          error: 'End date must be after start date'
        }, { status: 400 })
      }
    }
    
    const report = {
      id: `report-${Date.now()}`,
      title: `${body.type.charAt(0).toUpperCase() + body.type.slice(1)} Analytics Report`,
      type: body.type,
      dateRange: body.dateRange || {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      metrics: [
        createMockAnalyticsMetric({ name: 'Total Views', value: 125000 }),
        createMockAnalyticsMetric({ name: 'Total Engagements', value: 8750 }),
        createMockAnalyticsMetric({ name: 'Bot Interactions', value: 3420 })
      ],
      insights: [
        'Engagement increased by 15% compared to previous period',
        'Bot activity peaked during evening hours',
        'Video content performed 23% better than text content'
      ],
      recommendations: [
        'Consider increasing bot activity during peak hours',
        'Focus on video content creation',
        'Optimize engagement timing for better reach'
      ],
      generatedAt: new Date()
    }
    
    return HttpResponse.json(mockApiResponse(report))
  }),

  // Data Export
  http.post('/api/analytics/export', async ({ request }) => {
    const body = await request.json() as any
    
    if (!body || !body.format) {
      return HttpResponse.json({
        success: false,
        error: 'Export format is required'
      }, { status: 400 })
    }
    
    // Simulate file generation delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const csvData = 'Date,Views,Likes,Comments,Shares\n2024-01-01,1000,100,50,25\n2024-01-02,1200,120,60,30'
    const blob = new Blob([csvData], { type: 'text/csv' })
    
    return new Response(blob, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="analytics-export.csv"'
      }
    })
  }),

  // Health Check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        geminiApi: 'healthy',
        storage: 'healthy'
      }
    })
  }),

  // Error Simulation (for testing error states)
  http.get('/api/analytics/error-test', () => {
    return HttpResponse.json({
      success: false,
      error: 'Simulated server error'
    }, { status: 500 })
  }),

  // Slow Response Simulation (for testing loading states)
  http.get('/api/analytics/slow-test', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return HttpResponse.json(mockApiResponse([]))
  })
]

// Helper function to create realistic bot personas for testing
export const createMockBotPersonas = (count: number) => {
  const names = [
    'Alex Chen', 'Maya Rodriguez', 'Jordan Kim', 'Sam Taylor', 'Riley Johnson',
    'Casey Wong', 'Morgan Davis', 'Avery Smith', 'Quinn Brown', 'Sage Miller'
  ]
  
  const personalities = [
    'Tech-savvy and curious about new developments',
    'Creative and passionate about arts and culture',
    'Business-minded and results-oriented',
    'Laid-back and enjoys casual conversations',
    'Witty and loves making people laugh',
    'Analytical and detail-oriented',
    'Enthusiastic about sports and fitness',
    'Intellectual and philosophical',
    'Social and loves meeting new people',
    'Adventurous and travel-loving'
  ]
  
  const interests = [
    ['technology', 'science', 'innovation'],
    ['art', 'culture', 'entertainment'],
    ['business', 'finance', 'entrepreneurship'],
    ['lifestyle', 'sports', 'entertainment'],
    ['entertainment', 'comedy', 'pop culture'],
    ['technology', 'data', 'analytics'],
    ['sports', 'fitness', 'health'],
    ['education', 'philosophy', 'science'],
    ['lifestyle', 'travel', 'food'],
    ['travel', 'adventure', 'photography']
  ]
  
  const locations = [
    'San Francisco, CA', 'New York, NY', 'Chicago, IL', 'Austin, TX',
    'Los Angeles, CA', 'Seattle, WA', 'Boston, MA', 'Denver, CO',
    'Miami, FL', 'Portland, OR'
  ]
  
  const timezones = [
    'America/Los_Angeles', 'America/New_York', 'America/Chicago', 'America/Chicago',
    'America/Los_Angeles', 'America/Los_Angeles', 'America/New_York', 'America/Denver',
    'America/New_York', 'America/Los_Angeles'
  ]
  
  const engagementStyles = ['casual', 'professional', 'enthusiastic', 'analytical', 'humorous']
  
  return Array.from({ length: count }, (_, i) => {
    const index = i % names.length
    return {
      id: `mock-bot-${i + 1}`,
      name: names[index],
      personality: personalities[index],
      interests: interests[index],
      engagementStyle: engagementStyles[i % engagementStyles.length],
      demographics: {
        age: 22 + (i % 20),
        location: locations[index],
        timezone: timezones[index]
      },
      behaviorPatterns: {
        activeHours: [9, 12, 15, 18, 21].filter(() => Math.random() > 0.3),
        engagementFrequency: ['low', 'medium', 'high'][i % 3],
        contentPreferences: interests[index].slice(0, 2)
      },
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      isActive: i % 10 !== 9 // 90% active
    }
  })
}

// Helper function to create realistic content for testing
export const createMockContent = (count: number) => {
  const titles = [
    'Introduction to AI Development',
    'Modern Web Design Trends',
    'Business Strategy Fundamentals',
    'Creative Writing Workshop',
    'Comedy in the Digital Age',
    'Data Science Basics',
    'Fitness and Nutrition Guide',
    'Philosophy of Technology',
    'Travel Photography Tips',
    'Adventure Planning Guide'
  ]
  
  const categories = [
    'technology', 'design', 'business', 'writing', 'entertainment',
    'science', 'health', 'education', 'travel', 'lifestyle'
  ]
  
  const tags = [
    ['AI', 'programming', 'tutorial'],
    ['design', 'UX', 'trends'],
    ['business', 'strategy', 'planning'],
    ['writing', 'creativity', 'workshop'],
    ['comedy', 'entertainment', 'digital'],
    ['data', 'analytics', 'tutorial'],
    ['fitness', 'health', 'nutrition'],
    ['philosophy', 'technology', 'ethics'],
    ['photography', 'travel', 'tips'],
    ['adventure', 'planning', 'guide']
  ]
  
  return Array.from({ length: count }, (_, i) => {
    const index = i % titles.length
    const baseViews = 500 + Math.floor(Math.random() * 5000)
    
    return {
      id: `mock-content-${i + 1}`,
      title: titles[index],
      description: `Description for ${titles[index]}`,
      url: `https://example.com/content/${i + 1}`,
      tags: tags[index],
      category: categories[index],
      createdAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000), // 6 hours apart
      authorId: `author-${(i % 5) + 1}`,
      metadata: {
        duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
        views: baseViews,
        likes: Math.floor(baseViews * 0.1),
        comments: Math.floor(baseViews * 0.02),
        shares: Math.floor(baseViews * 0.01)
      }
    }
  })
}