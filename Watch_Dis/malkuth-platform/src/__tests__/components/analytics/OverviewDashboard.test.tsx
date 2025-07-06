import React from 'react'
import { render, screen, waitFor, fireEvent } from '@/utils/test-utils'
import { OverviewDashboard } from '@/components/analytics/OverviewDashboard'
import { analyticsService } from '@/services/AnalyticsService'
import { createMockAnalyticsMetric, createMockSystemMetrics } from '@/utils/test-utils'

// Mock the analytics service
jest.mock('@/services/AnalyticsService', () => ({
  analyticsService: {
    getOverviewMetrics: jest.fn(),
    getSystemMetrics: jest.fn(),
    subscribeToUpdates: jest.fn(),
  }
}))

const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>

describe('OverviewDashboard Component', () => {
  const mockMetrics = [
    createMockAnalyticsMetric({
      id: 'metric-1',
      name: 'Total Views',
      value: 125000,
      change: 15.5,
      changeType: 'increase'
    }),
    createMockAnalyticsMetric({
      id: 'metric-2',
      name: 'Total Likes',
      value: 8750,
      change: -2.3,
      changeType: 'decrease'
    }),
    createMockAnalyticsMetric({
      id: 'metric-3',
      name: 'Active Bots',
      value: 47,
      change: 0,
      changeType: 'neutral'
    }),
    createMockAnalyticsMetric({
      id: 'metric-4',
      name: 'Engagement Rate',
      value: 7.2,
      change: 12.8,
      changeType: 'increase'
    })
  ]

  const mockSystemMetrics = createMockSystemMetrics({
    systemHealth: 'healthy',
    uptime: 99.8,
    activeUsers: 1250,
    apiCalls: 45000,
    apiErrors: 12
  })

  beforeEach(() => {
    mockAnalyticsService.getOverviewMetrics.mockResolvedValue(mockMetrics)
    mockAnalyticsService.getSystemMetrics.mockResolvedValue(mockSystemMetrics)
    mockAnalyticsService.subscribeToUpdates.mockReturnValue(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<OverviewDashboard />)
      
      expect(screen.getByText('Overview Dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should load and display metrics after data fetch', async () => {
      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
        expect(screen.getByText('125,000')).toBeInTheDocument()
        expect(screen.getByText('Total Likes')).toBeInTheDocument()
        expect(screen.getByText('8,750')).toBeInTheDocument()
      })
    })

    it('should call analytics service methods on mount', async () => {
      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(mockAnalyticsService.getOverviewMetrics).toHaveBeenCalledTimes(1)
        expect(mockAnalyticsService.getSystemMetrics).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Metrics Display', () => {
    beforeEach(async () => {
      render(<OverviewDashboard />)
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })
    })

    it('should display all metric cards', () => {
      mockMetrics.forEach(metric => {
        expect(screen.getByText(metric.name)).toBeInTheDocument()
        expect(screen.getByText(metric.value.toLocaleString())).toBeInTheDocument()
      })
    })

    it('should show positive change indicators', () => {
      const increaseElements = screen.getAllByText(/↗/)
      expect(increaseElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText('+15.5%')).toBeInTheDocument()
      expect(screen.getByText('+12.8%')).toBeInTheDocument()
    })

    it('should show negative change indicators', () => {
      const decreaseElements = screen.getAllByText(/↘/)
      expect(decreaseElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText('-2.3%')).toBeInTheDocument()
    })

    it('should show neutral change indicators', () => {
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should format large numbers correctly', () => {
      expect(screen.getByText('125,000')).toBeInTheDocument()
      expect(screen.getByText('8,750')).toBeInTheDocument()
    })
  })

  describe('System Health Display', () => {
    beforeEach(async () => {
      render(<OverviewDashboard />)
      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument()
      })
    })

    it('should display system health status', () => {
      expect(screen.getByText('Healthy')).toBeInTheDocument()
    })

    it('should display uptime percentage', () => {
      expect(screen.getByText('99.8%')).toBeInTheDocument()
    })

    it('should display active users count', () => {
      expect(screen.getByText('1,250')).toBeInTheDocument()
    })

    it('should display API statistics', () => {
      expect(screen.getByText('45,000')).toBeInTheDocument() // API calls
      expect(screen.getByText('12')).toBeInTheDocument() // API errors
    })

    it('should show appropriate health indicator color', () => {
      const healthIndicator = screen.getByTestId('health-indicator')
      expect(healthIndicator).toHaveClass('bg-green-500') // Healthy status
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates on mount', () => {
      render(<OverviewDashboard />)
      
      expect(mockAnalyticsService.subscribeToUpdates).toHaveBeenCalledTimes(1)
      expect(mockAnalyticsService.subscribeToUpdates).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })

    it('should update metrics when real-time data arrives', async () => {
      let updateCallback: (data: any) => void
      
      mockAnalyticsService.subscribeToUpdates.mockImplementation((callback) => {
        updateCallback = callback
        return () => {}
      })

      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })

      // Simulate real-time update
      const newActivity = {
        id: 'activity-1',
        type: 'bot_activity',
        title: 'New bot engagement',
        description: 'Bot liked a video',
        timestamp: new Date(),
        severity: 'info'
      }

      updateCallback!(newActivity)

      await waitFor(() => {
        expect(screen.getByText('New bot engagement')).toBeInTheDocument()
      })
    })

    it('should unsubscribe on unmount', () => {
      const unsubscribe = jest.fn()
      mockAnalyticsService.subscribeToUpdates.mockReturnValue(unsubscribe)

      const { unmount } = render(<OverviewDashboard />)
      
      unmount()
      
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle metrics loading error gracefully', async () => {
      mockAnalyticsService.getOverviewMetrics.mockRejectedValue(
        new Error('Failed to fetch metrics')
      )

      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Error loading metrics')).toBeInTheDocument()
      })
    })

    it('should handle system metrics loading error gracefully', async () => {
      mockAnalyticsService.getSystemMetrics.mockRejectedValue(
        new Error('Failed to fetch system metrics')
      )

      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Error loading system health')).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      mockAnalyticsService.getOverviewMetrics.mockRejectedValue(
        new Error('Network error')
      )

      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry loading data when retry button is clicked', async () => {
      mockAnalyticsService.getOverviewMetrics
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockMetrics)

      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Retry'))
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })
      
      expect(mockAnalyticsService.getOverviewMetrics).toHaveBeenCalledTimes(2)
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<OverviewDashboard />)
      
      const dashboard = screen.getByTestId('overview-dashboard')
      expect(dashboard).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
    })

    it('should render properly on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      render(<OverviewDashboard />)
      
      const dashboard = screen.getByTestId('overview-dashboard')
      expect(dashboard).toHaveClass('lg:grid-cols-4')
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<OverviewDashboard />)
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })
    })

    it('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Overview Dashboard')
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2) // Metrics and System Health sections
    })

    it('should have accessible metric cards', () => {
      const metricCards = screen.getAllByRole('article')
      expect(metricCards.length).toBeGreaterThan(0)
      
      metricCards.forEach(card => {
        expect(card).toHaveAttribute('aria-label')
      })
    })

    it('should have proper ARIA labels for change indicators', () => {
      const increaseIndicator = screen.getByText('+15.5%').parentElement
      expect(increaseIndicator).toHaveAttribute('aria-label', 'Increase of 15.5%')
      
      const decreaseIndicator = screen.getByText('-2.3%').parentElement
      expect(decreaseIndicator).toHaveAttribute('aria-label', 'Decrease of 2.3%')
    })

    it('should announce loading state to screen readers', () => {
      render(<OverviewDashboard />)
      
      const loadingElement = screen.getByTestId('loading-spinner')
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading dashboard data')
    })
  })

  describe('Performance', () => {
    it('should memoize metric calculations', async () => {
      const { rerender } = render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })

      // Re-render with same data
      rerender(<OverviewDashboard />)
      
      // Should not call service again if data hasn't changed
      expect(mockAnalyticsService.getOverviewMetrics).toHaveBeenCalledTimes(1)
    })

    it('should debounce real-time updates', async () => {
      let updateCallback: (data: any) => void
      
      mockAnalyticsService.subscribeToUpdates.mockImplementation((callback) => {
        updateCallback = callback
        return () => {}
      })

      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })

      // Simulate rapid updates
      const activities = Array.from({ length: 10 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'bot_activity',
        title: `Activity ${i}`,
        description: 'Test activity',
        timestamp: new Date(),
        severity: 'info'
      }))

      activities.forEach(activity => updateCallback!(activity))

      // Should handle updates without crashing
      expect(screen.getByText('Total Views')).toBeInTheDocument()
    })
  })

  describe('Data Refresh', () => {
    it('should have refresh button', async () => {
      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should refresh data when refresh button is clicked', async () => {
      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)
      
      expect(mockAnalyticsService.getOverviewMetrics).toHaveBeenCalledTimes(2)
      expect(mockAnalyticsService.getSystemMetrics).toHaveBeenCalledTimes(2)
    })

    it('should show loading state during refresh', async () => {
      render(<OverviewDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeInTheDocument()
      })

      // Mock delayed response
      mockAnalyticsService.getOverviewMetrics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockMetrics), 1000))
      )

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })
})