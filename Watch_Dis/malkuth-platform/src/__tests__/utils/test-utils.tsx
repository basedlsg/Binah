import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock providers and contexts if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const user = userEvent.setup()
  
  return {
    user,
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  }
}

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockContent = (overrides = {}) => ({
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
  ...overrides,
})

export const createMockBotPersona = (overrides = {}) => ({
  id: 'bot-1',
  name: 'Test Bot',
  personality: 'Friendly and helpful',
  interests: ['technology', 'music'],
  engagementStyle: 'casual' as const,
  demographics: {
    age: 25,
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
  },
  behaviorPatterns: {
    activeHours: [9, 12, 15, 18, 21],
    engagementFrequency: 'medium' as const,
    contentPreferences: ['technology', 'entertainment'],
  },
  createdAt: new Date('2024-01-01'),
  isActive: true,
  ...overrides,
})

export const createMockEngagementCampaign = (overrides = {}) => ({
  id: 'campaign-1',
  contentId: 'content-1',
  targetMetrics: {
    views: 5000,
    likes: 500,
    comments: 100,
    shares: 50,
  },
  parameters: {
    phases: {
      discovery: {
        durationDays: 7,
        engagementPercentage: 15,
        primaryEngagementTypes: ['view', 'like'],
        timing: {
          peakHours: [9, 12, 15, 18, 21],
          distributionPattern: 'natural' as const,
        },
      },
      viralGrowth: {
        durationDays: 37,
        engagementPercentage: 60,
        primaryEngagementTypes: ['view', 'like', 'comment', 'share'],
        timing: {
          peakHours: [8, 12, 16, 20],
          distributionPattern: 'burst' as const,
        },
      },
      sustainedInterest: {
        durationDays: 75,
        engagementPercentage: 20,
        primaryEngagementTypes: ['view', 'like', 'comment'],
        timing: {
          peakHours: [10, 14, 19],
          distributionPattern: 'uniform' as const,
        },
      },
      archive: {
        durationDays: 365,
        engagementPercentage: 5,
        primaryEngagementTypes: ['view'],
        timing: {
          peakHours: [11, 15, 22],
          distributionPattern: 'natural' as const,
        },
      },
    },
    rateLimit: {
      maxEngagementsPerHour: 100,
      maxEngagementsPerDay: 1000,
    },
    authenticity: {
      minDelay: 1000,
      maxDelay: 30000,
      varianceFactors: ['user_behavior', 'content_type', 'time_of_day'],
    },
  },
  status: 'active' as const,
  createdAt: new Date('2024-01-01'),
  startDate: new Date('2024-01-01'),
  analytics: {
    totalEngagements: 0,
    engagementsByType: {
      view: 0,
      like: 0,
      comment: 0,
      share: 0,
      follow: 0,
    },
    engagementsByPhase: {
      discovery: 0,
      'viral-growth': 0,
      'sustained-interest': 0,
      archive: 0,
    },
    averageAuthenticityScore: 0,
    botsParticipated: 0,
    successRate: 0,
    realTimeMetrics: {
      currentViews: 0,
      currentLikes: 0,
      currentComments: 0,
      currentShares: 0,
    },
  },
  ...overrides,
})

export const createMockAnalyticsMetric = (overrides = {}) => ({
  id: 'metric-1',
  name: 'Total Views',
  value: 10000,
  change: 15.5,
  changeType: 'increase' as const,
  timestamp: new Date('2024-01-01'),
  ...overrides,
})

export const createMockContentMetrics = (overrides = {}) => ({
  id: 'content-metrics-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  contentId: 'content-1',
  contentType: 'post' as const,
  views: 1000,
  likes: 100,
  comments: 50,
  shares: 25,
  engagementRate: 0.175,
  authenticityScore: 0.85,
  performanceScore: 0.78,
  ...overrides,
})

export const createMockBotMetrics = (overrides = {}) => ({
  id: 'bot-metrics-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  botId: 'bot-1',
  botName: 'Test Bot',
  personality: 'Friendly and helpful',
  activeSessions: 5,
  totalInteractions: 150,
  averageResponseTime: 2.5,
  engagementQuality: 0.82,
  errorRate: 0.02,
  isActive: true,
  ...overrides,
})

// Mock API responses
export const mockApiResponse = <T>(data: T) => ({
  data,
  success: true,
  message: 'Success',
})

export const mockApiError = (message = 'Test error') => ({
  data: null,
  success: false,
  error: message,
})

// Wait helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const waitForNextTick = () => waitFor(0)

// DOM testing helpers
export const createMockFile = (
  name = 'test.txt',
  type = 'text/plain',
  content = 'test content'
) => {
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'size', { value: content.length })
  return file
}

export const createMockFileList = (files: File[]) => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      yield* files
    },
  }
  
  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, { value: file })
  })
  
  return fileList as FileList
}

// Mock fetch helper
export const mockFetch = (response: any, ok = true) => {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    blob: jest.fn().mockResolvedValue(new Blob([JSON.stringify(response)])),
  })
}

// Performance testing helpers
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Accessibility testing helpers
export const getAccessibilityViolations = async (container: HTMLElement) => {
  // This would integrate with axe-core in a real implementation
  const violations: any[] = []
  
  // Check for basic accessibility issues
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      violations.push({
        rule: 'image-alt',
        element: img,
        message: 'Image missing alt attribute',
      })
    }
  })
  
  const buttons = container.querySelectorAll('button')
  buttons.forEach(button => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      violations.push({
        rule: 'button-name',
        element: button,
        message: 'Button missing accessible name',
      })
    }
  })
  
  return violations
}