import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Start browser for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for development server to be ready
    console.log('Waiting for development server...')
    await page.goto(config.webServer?.url || 'http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Verify app is loaded
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 })
    console.log('Development server is ready')

    // Perform any global setup tasks here
    // For example: seed test data, authenticate test users, etc.

  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

export default globalSetup