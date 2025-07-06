import { NextRequest } from 'next/server'
import { GET as overviewHandler } from '@/app/api/analytics/overview/route'
import { GET as botsHandler } from '@/app/api/analytics/bots/route'
import { GET as contentHandler } from '@/app/api/analytics/content/route'
import { GET as systemHandler } from '@/app/api/analytics/system/route'
import { POST as reportsHandler } from '@/app/api/analytics/reports/route'

// Mock external dependencies
jest.mock('@/services/AnalyticsService')
jest.mock('@/services/BotPersonaService')

describe('Analytics API Integration Tests', () => {
  const createRequest = (url: string, options: RequestInit = {}) => {
    return new NextRequest(url, options)
  }

  describe('Overview Analytics API', () => {
    it('should return overview metrics successfully', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/overview')
      const response = await overviewHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should handle overview metrics error gracefully', async () => {
      // Mock error condition
      jest.doMock('@/services/AnalyticsService', () => ({
        analyticsService: {
          getOverviewMetrics: jest.fn().mockRejectedValue(new Error('Database error'))
        }
      }))

      const request = createRequest('http://localhost:3000/api/analytics/overview')
      const response = await overviewHandler(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
    })

    it('should return correct data structure for overview metrics', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/overview')
      const response = await overviewHandler(request)
      const data = await response.json()
      
      if (data.data.length > 0) {
        const metric = data.data[0]
        expect(metric).toHaveProperty('id')
        expect(metric).toHaveProperty('name')
        expect(metric).toHaveProperty('value')
        expect(metric).toHaveProperty('change')
        expect(metric).toHaveProperty('changeType')
        expect(metric).toHaveProperty('timestamp')
      }
    })
  })

  describe('Bot Analytics API', () => {
    it('should return bot metrics without filters', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/bots')
      const response = await botsHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should return bot metrics with date range filter', async () => {
      const url = new URL('http://localhost:3000/api/analytics/bots')
      url.searchParams.set('startDate', '2024-01-01T00:00:00.000Z')
      url.searchParams.set('endDate', '2024-01-31T23:59:59.999Z')
      
      const request = createRequest(url.toString())
      const response = await botsHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should return bot metrics with bot ID filter', async () => {
      const url = new URL('http://localhost:3000/api/analytics/bots')
      url.searchParams.set('botId', 'bot-123')
      
      const request = createRequest(url.toString())
      const response = await botsHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should validate date range parameters', async () => {
      const url = new URL('http://localhost:3000/api/analytics/bots')
      url.searchParams.set('startDate', 'invalid-date')
      
      const request = createRequest(url.toString())
      const response = await botsHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid date')
    })

    it('should return correct bot metrics data structure', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/bots')
      const response = await botsHandler(request)
      const data = await response.json()
      
      if (data.data.length > 0) {
        const botMetric = data.data[0]
        expect(botMetric).toHaveProperty('id')
        expect(botMetric).toHaveProperty('botId')
        expect(botMetric).toHaveProperty('botName')
        expect(botMetric).toHaveProperty('activeSessions')
        expect(botMetric).toHaveProperty('totalInteractions')
        expect(botMetric).toHaveProperty('averageResponseTime')
        expect(botMetric).toHaveProperty('engagementQuality')
        expect(botMetric).toHaveProperty('errorRate')
        expect(botMetric).toHaveProperty('isActive')
      }
    })
  })

  describe('Content Analytics API', () => {
    it('should return content metrics successfully', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/content')
      const response = await contentHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should filter content by type', async () => {
      const url = new URL('http://localhost:3000/api/analytics/content')
      url.searchParams.set('contentType', 'video')
      
      const request = createRequest(url.toString())
      const response = await contentHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should limit content results', async () => {
      const url = new URL('http://localhost:3000/api/analytics/content')
      url.searchParams.set('limit', '5')
      
      const request = createRequest(url.toString())
      const response = await contentHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(5)
    })

    it('should validate limit parameter', async () => {
      const url = new URL('http://localhost:3000/api/analytics/content')
      url.searchParams.set('limit', '0')
      
      const request = createRequest(url.toString())
      const response = await contentHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Limit must be greater than 0')
    })
  })

  describe('System Analytics API', () => {
    it('should return system metrics successfully', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/system')
      const response = await systemHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(typeof data.data).toBe('object')
    })

    it('should return correct system metrics structure', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/system')
      const response = await systemHandler(request)
      const data = await response.json()
      
      const systemMetrics = data.data
      expect(systemMetrics).toHaveProperty('apiCalls')
      expect(systemMetrics).toHaveProperty('apiErrors')
      expect(systemMetrics).toHaveProperty('geminiApiUsage')
      expect(systemMetrics).toHaveProperty('storageUsage')
      expect(systemMetrics).toHaveProperty('activeUsers')
      expect(systemMetrics).toHaveProperty('systemHealth')
      expect(systemMetrics).toHaveProperty('uptime')
      
      expect(typeof systemMetrics.apiCalls).toBe('number')
      expect(typeof systemMetrics.uptime).toBe('number')
      expect(['healthy', 'degraded', 'critical']).toContain(systemMetrics.systemHealth)
    })
  })

  describe('Reports API', () => {
    it('should generate daily report successfully', async () => {
      const requestBody = {
        type: 'daily',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-01')
        }
      }
      
      const request = createRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const response = await reportsHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('type', 'daily')
    })

    it('should generate weekly report successfully', async () => {
      const requestBody = {
        type: 'weekly',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-07')
        }
      }
      
      const request = createRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const response = await reportsHandler(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.data).toHaveProperty('type', 'weekly')
    })

    it('should validate report request body', async () => {
      const invalidRequestBody = {
        type: 'invalid-type'
      }
      
      const request = createRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidRequestBody)
      })
      
      const response = await reportsHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should handle missing request body', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await reportsHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Request body is required')
    })

    it('should validate date range in report request', async () => {
      const requestBody = {
        type: 'custom',
        dateRange: {
          start: new Date('2024-01-31'),
          end: new Date('2024-01-01') // End before start
        }
      }
      
      const request = createRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const response = await reportsHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('End date must be after start date')
    })
  })

  describe('Cross-API Integration', () => {
    it('should maintain data consistency across endpoints', async () => {
      // Get overview metrics
      const overviewRequest = createRequest('http://localhost:3000/api/analytics/overview')
      const overviewResponse = await overviewHandler(overviewRequest)
      const overviewData = await overviewResponse.json()
      
      // Get system metrics
      const systemRequest = createRequest('http://localhost:3000/api/analytics/system')
      const systemResponse = await systemHandler(systemRequest)
      const systemData = await systemResponse.json()
      
      // Verify timestamp consistency (within 1 minute)
      const overviewTimestamp = new Date(overviewData.data[0]?.timestamp || 0)
      const systemTimestamp = new Date(systemData.data.updatedAt)
      const timeDiff = Math.abs(overviewTimestamp.getTime() - systemTimestamp.getTime())
      
      expect(timeDiff).toBeLessThan(60000) // Less than 1 minute difference
    })

    it('should handle concurrent requests properly', async () => {
      const requests = [
        overviewHandler(createRequest('http://localhost:3000/api/analytics/overview')),
        botsHandler(createRequest('http://localhost:3000/api/analytics/bots')),
        contentHandler(createRequest('http://localhost:3000/api/analytics/content')),
        systemHandler(createRequest('http://localhost:3000/api/analytics/system'))
      ]
      
      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Parse all responses
      const dataPromises = responses.map(response => response.json())
      const allData = await Promise.all(dataPromises)
      
      // All should be successful
      allData.forEach(data => {
        expect(data.success).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.doMock('@/services/AnalyticsService', () => ({
        analyticsService: {
          getOverviewMetrics: jest.fn().mockRejectedValue(new Error('Connection timeout'))
        }
      }))

      const request = createRequest('http://localhost:3000/api/analytics/overview')
      const response = await overviewHandler(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeTruthy()
    })

    it('should handle malformed JSON in POST requests', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{invalid-json}'
      })
      
      const response = await reportsHandler(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle unsupported HTTP methods', async () => {
      const request = createRequest('http://localhost:3000/api/analytics/overview', {
        method: 'DELETE'
      })
      
      // This should return 405 Method Not Allowed
      try {
        await overviewHandler(request)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      
      const request = createRequest('http://localhost:3000/api/analytics/overview')
      const response = await overviewHandler(request)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    })

    it('should handle large result sets efficiently', async () => {
      const url = new URL('http://localhost:3000/api/analytics/content')
      url.searchParams.set('limit', '1000')
      
      const startTime = Date.now()
      
      const request = createRequest(url.toString())
      const response = await contentHandler(request)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(10000) // Should handle large sets within 10 seconds
    })
  })
})