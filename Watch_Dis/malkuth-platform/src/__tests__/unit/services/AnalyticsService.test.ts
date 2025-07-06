import { AnalyticsService } from '@/services/AnalyticsService'
import { 
  AnalyticsMetric, 
  ContentMetrics, 
  BotMetrics, 
  SystemMetrics,
  EngagementPattern,
  ActivityFeedItem,
  AnalyticsReport
} from '@/types'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  beforeEach(() => {
    analyticsService = new AnalyticsService()
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Overview Metrics', () => {
    it('should fetch overview metrics successfully', async () => {
      const mockMetrics: AnalyticsMetric[] = [
        {
          id: 'metric-1',
          name: 'Total Views',
          value: 10000,
          change: 15.5,
          changeType: 'increase',
          timestamp: new Date('2024-01-01')
        },
        {
          id: 'metric-2',
          name: 'Total Likes',
          value: 1500,
          change: -5.2,
          changeType: 'decrease',
          timestamp: new Date('2024-01-01')
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockMetrics,
          success: true
        })
      })

      const result = await analyticsService.getOverviewMetrics()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/overview')
      expect(result).toEqual(mockMetrics)
    })

    it('should return empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await analyticsService.getOverviewMetrics()

      expect(result).toEqual([])
    })

    it('should handle API response errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({
          data: null,
          success: false,
          error: 'Server error'
        })
      })

      const result = await analyticsService.getOverviewMetrics()

      expect(result).toEqual([])
    })
  })

  describe('Content Metrics', () => {
    it('should fetch content metrics without filters', async () => {
      const mockContentMetrics: ContentMetrics[] = [
        {
          id: 'content-metrics-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockContentMetrics,
          success: true
        })
      })

      const result = await analyticsService.getContentMetrics()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/content?')
      expect(result).toEqual(mockContentMetrics)
    })

    it('should fetch content metrics with filters', async () => {
      const filters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        contentType: 'video',
        limit: 10
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      await analyticsService.getContentMetrics(filters)

      const expectedUrl = '/api/analytics/content?' + new URLSearchParams({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z',
        contentType: 'video',
        limit: '10'
      }).toString()

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl)
    })

    it('should handle partial filters correctly', async () => {
      const filters = {
        contentType: 'music'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      await analyticsService.getContentMetrics(filters)

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/content?contentType=music')
    })
  })

  describe('Bot Metrics', () => {
    it('should fetch bot metrics successfully', async () => {
      const mockBotMetrics: BotMetrics[] = [
        {
          id: 'bot-metrics-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          botId: 'bot-1',
          botName: 'Test Bot',
          personality: 'Friendly',
          activeSessions: 5,
          totalInteractions: 150,
          averageResponseTime: 2.5,
          engagementQuality: 0.82,
          errorRate: 0.02,
          isActive: true
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockBotMetrics,
          success: true
        })
      })

      const result = await analyticsService.getBotMetrics()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/bots?')
      expect(result).toEqual(mockBotMetrics)
    })

    it('should fetch bot metrics with filters', async () => {
      const filters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        botId: 'bot-1',
        includeInactive: true
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      await analyticsService.getBotMetrics(filters)

      const expectedUrl = '/api/analytics/bots?' + new URLSearchParams({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z',
        botId: 'bot-1',
        includeInactive: 'true'
      }).toString()

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl)
    })
  })

  describe('System Metrics', () => {
    it('should fetch system metrics successfully', async () => {
      const mockSystemMetrics: SystemMetrics = {
        id: 'system-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        apiCalls: 5000,
        apiErrors: 25,
        geminiApiUsage: 1200,
        storageUsage: 1024 * 1024 * 500, // 500MB
        activeUsers: 150,
        systemHealth: 'healthy',
        uptime: 99.9
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockSystemMetrics,
          success: true
        })
      })

      const result = await analyticsService.getSystemMetrics()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/system')
      expect(result).toEqual(mockSystemMetrics)
    })

    it('should return default system metrics on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await analyticsService.getSystemMetrics()

      expect(result).toMatchObject({
        apiCalls: 0,
        apiErrors: 0,
        geminiApiUsage: 0,
        storageUsage: 0,
        activeUsers: 0,
        systemHealth: 'critical',
        uptime: 0
      })
    })
  })

  describe('Engagement Patterns', () => {
    it('should fetch engagement patterns successfully', async () => {
      const mockPatterns: EngagementPattern[] = [
        {
          timeSlot: '2024-01-01T09:00:00Z',
          hour: 9,
          day: 1,
          interactions: 150,
          authenticity: 0.85,
          botActivity: 45,
          contentCreation: 12
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockPatterns,
          success: true
        })
      })

      const result = await analyticsService.getEngagementPatterns()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/engagement-patterns?')
      expect(result).toEqual(mockPatterns)
    })

    it('should fetch engagement patterns with date range', async () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      await analyticsService.getEngagementPatterns(dateRange)

      const expectedUrl = '/api/analytics/engagement-patterns?' + new URLSearchParams({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z'
      }).toString()

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl)
    })
  })

  describe('Activity Feed', () => {
    it('should fetch activity feed with default limit', async () => {
      const mockFeed: ActivityFeedItem[] = [
        {
          id: 'feed-1',
          type: 'bot_activity',
          title: 'Bot engaged with content',
          description: 'Bot TestBot liked a video',
          timestamp: new Date('2024-01-01'),
          severity: 'info'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockFeed,
          success: true
        })
      })

      const result = await analyticsService.getActivityFeed()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/activity-feed?limit=50')
      expect(result).toEqual(mockFeed)
    })

    it('should fetch activity feed with custom limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      await analyticsService.getActivityFeed(100)

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/activity-feed?limit=100')
    })
  })

  describe('Report Generation', () => {
    it('should generate daily report', async () => {
      const mockReport: AnalyticsReport = {
        id: 'report-1',
        title: 'Daily Analytics Report',
        type: 'daily',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-01')
        },
        metrics: [],
        insights: ['Engagement increased by 15%'],
        recommendations: ['Consider posting more video content'],
        generatedAt: new Date('2024-01-02')
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockReport,
          success: true
        })
      })

      const result = await analyticsService.generateReport('daily')

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"type":"daily"')
      })
      expect(result).toEqual(mockReport)
    })

    it('should generate custom report with date range', async () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {},
          success: true
        })
      })

      await analyticsService.generateReport('custom', dateRange)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.type).toBe('custom')
      expect(requestBody.dateRange.start).toBe('2024-01-01T00:00:00.000Z')
      expect(requestBody.dateRange.end).toBe('2024-01-31T00:00:00.000Z')
    })

    it('should use default date range when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {},
          success: true
        })
      })

      await analyticsService.generateReport('weekly')

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.dateRange).toBeDefined()
      expect(new Date(requestBody.dateRange.start)).toBeInstanceOf(Date)
      expect(new Date(requestBody.dateRange.end)).toBeInstanceOf(Date)
    })
  })

  describe('Data Export', () => {
    it('should export data as CSV', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob)
      })

      const options = {
        format: 'csv' as const,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        metrics: ['views', 'likes', 'comments'],
        includeCharts: false
      }

      const result = await analyticsService.exportData(options)

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      })
      expect(result).toBe(mockBlob)
    })

    it('should throw error on export failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const options = {
        format: 'pdf' as const,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        metrics: ['views'],
        includeCharts: true
      }

      await expect(analyticsService.exportData(options))
        .rejects.toThrow('Export failed')
    })
  })

  describe('Top Content', () => {
    it('should fetch top content with default limit', async () => {
      const mockTopContent: ContentMetrics[] = [
        {
          id: 'content-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          contentId: 'content-1',
          contentType: 'post',
          views: 5000,
          likes: 500,
          comments: 100,
          shares: 50,
          engagementRate: 0.13,
          authenticityScore: 0.9,
          performanceScore: 0.95
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockTopContent,
          success: true
        })
      })

      const result = await analyticsService.getTopContent()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/top-content?limit=10')
      expect(result).toEqual(mockTopContent)
    })

    it('should fetch top content with custom limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      await analyticsService.getTopContent(20)

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/top-content?limit=20')
    })
  })

  describe('Trending Topics', () => {
    it('should fetch trending topics successfully', async () => {
      const mockTrends = [
        { topic: 'AI', count: 150, growth: 25.5 },
        { topic: 'blockchain', count: 120, growth: 15.2 }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockTrends,
          success: true
        })
      })

      const result = await analyticsService.getTrendingTopics()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/trending-topics?limit=20')
      expect(result).toEqual(mockTrends)
    })
  })

  describe('Cost Analysis', () => {
    it('should fetch cost analysis with default period', async () => {
      const mockCostAnalysis = {
        totalCost: 1250.50,
        geminiApiCost: 800.00,
        storageCost: 200.00,
        computeCost: 250.50,
        costTrend: 12.5,
        breakdown: [
          { category: 'Gemini API', cost: 800.00, percentage: 64.0 },
          { category: 'Storage', cost: 200.00, percentage: 16.0 },
          { category: 'Compute', cost: 250.50, percentage: 20.0 }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockCostAnalysis,
          success: true
        })
      })

      const result = await analyticsService.getCostAnalysis()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/cost-analysis?period=monthly')
      expect(result).toEqual(mockCostAnalysis)
    })

    it('should fetch cost analysis with custom period', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {},
          success: true
        })
      })

      await analyticsService.getCostAnalysis('weekly')

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/cost-analysis?period=weekly')
    })

    it('should return default cost analysis on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await analyticsService.getCostAnalysis()

      expect(result).toMatchObject({
        totalCost: 0,
        geminiApiCost: 0,
        storageCost: 0,
        computeCost: 0,
        costTrend: 0,
        breakdown: []
      })
    })
  })

  describe('Real-time Updates', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should subscribe to real-time updates', async () => {
      const mockFeedItem: ActivityFeedItem = {
        id: 'feed-1',
        type: 'bot_activity',
        title: 'New bot activity',
        description: 'Bot performed action',
        timestamp: new Date(),
        severity: 'info'
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [mockFeedItem],
          success: true
        })
      })

      const callback = jest.fn()
      const unsubscribe = analyticsService.subscribeToUpdates(callback)

      // Fast-forward time to trigger the interval
      jest.advanceTimersByTime(5000)

      // Wait for the async call to complete
      await Promise.resolve()

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/activity-feed?limit=1')
      expect(callback).toHaveBeenCalledWith(mockFeedItem)

      // Clean up
      unsubscribe()
    })

    it('should handle subscription errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const callback = jest.fn()
      const unsubscribe = analyticsService.subscribeToUpdates(callback)

      // Fast-forward time to trigger the interval
      jest.advanceTimersByTime(5000)

      // Wait for the async call to complete
      await Promise.resolve()

      expect(callback).not.toHaveBeenCalled()

      // Clean up
      unsubscribe()
    })

    it('should not call callback when no new data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [],
          success: true
        })
      })

      const callback = jest.fn()
      const unsubscribe = analyticsService.subscribeToUpdates(callback)

      // Fast-forward time to trigger the interval
      jest.advanceTimersByTime(5000)

      // Wait for the async call to complete
      await Promise.resolve()

      expect(callback).not.toHaveBeenCalled()

      // Clean up
      unsubscribe()
    })
  })
})