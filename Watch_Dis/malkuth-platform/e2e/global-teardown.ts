import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...')

  try {
    // Perform any global cleanup tasks here
    // For example: clean up test data, stop services, etc.
    
    console.log('Global teardown completed')
  } catch (error) {
    console.error('Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown