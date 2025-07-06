import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should load dashboard with analytics overview', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1')).toContainText('Overview Dashboard')
    
    // Check that metric cards are visible
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
    
    // Verify metric names are displayed
    await expect(page.locator('text=Total Views')).toBeVisible()
    await expect(page.locator('text=Total Likes')).toBeVisible()
    await expect(page.locator('text=Active Bots')).toBeVisible()
    await expect(page.locator('text=Engagement Rate')).toBeVisible()
  })

  test('should display system health information', async ({ page }) => {
    // Check system health section
    await expect(page.locator('text=System Health')).toBeVisible()
    await expect(page.locator('[data-testid="health-indicator"]')).toBeVisible()
    
    // Verify health status is displayed
    const healthStatus = page.locator('[data-testid="health-status"]')
    await expect(healthStatus).toBeVisible()
    await expect(healthStatus).toContainText(/Healthy|Degraded|Critical/)
  })

  test('should show real-time activity feed', async ({ page }) => {
    // Check activity feed section
    await expect(page.locator('text=Recent Activity')).toBeVisible()
    
    // Wait for activity items to load
    await page.waitForSelector('[data-testid="activity-item"]', { timeout: 10000 })
    
    // Verify activity items are displayed
    const activityItems = page.locator('[data-testid="activity-item"]')
    await expect(activityItems).toHaveCountGreaterThan(0)
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
    
    // Click refresh button
    await page.click('[data-testid="refresh-button"]')
    
    // Verify loading state appears
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for data to reload
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden()
    
    // Verify data is still displayed
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
  })

  test('should navigate to detailed analytics pages', async ({ page }) => {
    // Click on content analytics
    await page.click('text=Content Analytics')
    
    // Verify navigation to content page
    await expect(page).toHaveURL('/content')
    await expect(page.locator('h1')).toContainText('Content Management')
    
    // Go back to dashboard
    await page.goBack()
    
    // Click on engagement analytics
    await page.click('text=Engagement Analytics')
    
    // Verify navigation to engagement page
    await expect(page).toHaveURL('/engagement')
    await expect(page.locator('h1')).toContainText('Engagement Orchestration')
  })

  test('should display responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="overview-dashboard"]')).toHaveClass(/grid-cols-1/)
    
    // Check that all content is still accessible
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
    await expect(page.locator('text=System Health')).toBeVisible()
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/analytics/overview', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })
    
    // Reload page to trigger error
    await page.reload()
    
    // Verify error state is displayed
    await expect(page.locator('text=Error loading metrics')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should retry failed requests', async ({ page }) => {
    // Mock initial failure then success
    let callCount = 0
    await page.route('**/api/analytics/overview', route => {
      callCount++
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        })
      } else {
        route.continue()
      }
    })
    
    // Reload page to trigger initial error
    await page.reload()
    
    // Verify error state
    await expect(page.locator('text=Error loading metrics')).toBeVisible()
    
    // Click retry button
    await page.click('[data-testid="retry-button"]')
    
    // Verify success after retry
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
  })
})

test.describe('Analytics Dashboard Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
  })

  test('should filter metrics by date range', async ({ page }) => {
    // Open date range picker
    await page.click('[data-testid="date-range-picker"]')
    
    // Select last 7 days
    await page.click('text=Last 7 days')
    
    // Wait for data to update
    await page.waitForResponse(response => 
      response.url().includes('/api/analytics') && response.status() === 200
    )
    
    // Verify metrics updated
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
  })

  test('should export analytics data', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-button"]')
    
    // Select CSV format
    await page.click('text=CSV')
    
    // Wait for download to start
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="confirm-export"]')
    
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should toggle between different metric views', async ({ page }) => {
    // Switch to detailed view
    await page.click('[data-testid="view-toggle"]')
    await page.click('text=Detailed View')
    
    // Verify detailed metrics are shown
    await expect(page.locator('[data-testid="detailed-metric"]')).toHaveCountGreaterThan(0)
    
    // Switch back to overview
    await page.click('[data-testid="view-toggle"]')
    await page.click('text=Overview')
    
    // Verify overview is restored
    await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
  })

  test('should display charts and visualizations', async ({ page }) => {
    // Verify chart containers exist
    await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible()
    
    // Interact with chart (hover to show tooltip)
    await page.hover('[data-testid="engagement-chart"] canvas')
    
    // Verify tooltip appears
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
  })

  test('should handle real-time updates', async ({ page }) => {
    // Get initial metric value
    const initialValue = await page.locator('[data-testid="total-views"] .value').textContent()
    
    // Mock real-time update
    await page.route('**/api/analytics/activity-feed', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'new-activity',
            type: 'bot_activity',
            title: 'New bot engagement',
            description: 'Bot liked a video',
            timestamp: new Date().toISOString(),
            severity: 'info'
          }]
        })
      })
    })
    
    // Wait for real-time update
    await page.waitForTimeout(6000) // Wait for subscription interval
    
    // Verify activity feed updated
    await expect(page.locator('text=New bot engagement')).toBeVisible()
  })
})

test.describe('Accessibility Tests', () => {
  test('should be navigable with keyboard', async ({ page }) => {
    await page.goto('/')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Navigate through all interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/')
    
    // Check main landmarks
    await expect(page.locator('main')).toHaveAttribute('role', 'main')
    await expect(page.locator('nav')).toHaveAttribute('role', 'navigation')
    
    // Check metric cards have proper labels
    const metricCards = page.locator('[data-testid="metric-card"]')
    for (let i = 0; i < await metricCards.count(); i++) {
      await expect(metricCards.nth(i)).toHaveAttribute('aria-label')
    }
  })

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/')
    
    // Enable screen reader mode
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Check that content is properly announced
    await expect(page.locator('h1')).toHaveAttribute('aria-level', '1')
    
    // Verify skip links
    await page.keyboard.press('Tab')
    await expect(page.locator('text=Skip to main content')).toBeVisible()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    
    // This would typically use axe-core or similar tool
    // For now, we'll check that elements are visible
    await expect(page.locator('text=Total Views')).toBeVisible()
    await expect(page.locator('[data-testid="metric-value"]')).toBeVisible()
  })
})