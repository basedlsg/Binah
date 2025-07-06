# Testing Guide - Malkuth Platform

This document provides comprehensive information about testing the Malkuth Platform, including setup, execution, and best practices.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Setup and Installation](#setup-and-installation)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The Malkuth Platform testing suite includes:

- **Unit Tests**: Testing individual functions and services
- **Component Tests**: Testing React components in isolation
- **Integration Tests**: Testing API endpoints and service interactions
- **End-to-End Tests**: Testing complete user workflows
- **Performance Tests**: Testing system performance under load
- **Validation Tests**: Testing data integrity and business rules

## Test Structure

```
src/
├── __tests__/
│   ├── unit/              # Unit tests
│   │   ├── services/      # Service layer tests
│   │   ├── lib/           # Utility function tests
│   │   └── utils/         # Helper function tests
│   ├── components/        # Component tests
│   │   ├── ui/            # UI component tests
│   │   ├── analytics/     # Analytics component tests
│   │   └── content/       # Content component tests
│   ├── integration/       # Integration tests
│   │   ├── api/           # API endpoint tests
│   │   └── services/      # Cross-service tests
│   ├── performance/       # Performance tests
│   ├── validation/        # Data validation tests
│   ├── mocks/            # Mock data and handlers
│   │   ├── handlers.ts    # MSW request handlers
│   │   └── server.ts      # MSW server setup
│   └── utils/            # Test utilities
│       └── test-utils.tsx # Custom render and helpers
├── e2e/                  # End-to-end tests
│   ├── dashboard.spec.ts # Dashboard E2E tests
│   ├── setup.ts         # E2E test setup
│   ├── global-setup.ts  # Global E2E setup
│   └── global-teardown.ts # Global E2E teardown
└── playwright.config.ts  # Playwright configuration
```

## Setup and Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Install Dependencies

```bash
npm install
```

All testing dependencies are included in the main package.json:

- **Jest**: Test runner and framework
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW (Mock Service Worker)**: API mocking
- **@testing-library/jest-dom**: DOM testing utilities

### Configuration Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup
- `playwright.config.ts` - Playwright configuration

## Running Tests

### All Tests

```bash
# Run all test types
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests for CI
npm run test:ci
```

### Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Component tests only
npm run test:component

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance

# End-to-end tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:headed
```

### Individual Test Files

```bash
# Run specific test file
npm test -- BotPersonaService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Bot Creation"

# Run tests with verbose output
npm test -- --verbose
```

## Test Types

### 1. Unit Tests

Test individual functions, classes, and services in isolation.

**Location**: `src/__tests__/unit/`

**Example**:
```typescript
describe('BotPersonaService', () => {
  it('should create bot with default parameters', async () => {
    const bot = await botPersonaService.createBot()
    expect(bot).toHaveProperty('id')
    expect(bot).toHaveProperty('name')
    expect(bot.isActive).toBe(true)
  })
})
```

**Focus Areas**:
- Service layer business logic
- Utility functions
- Data transformations
- Error handling
- Edge cases

### 2. Component Tests

Test React components with various props and user interactions.

**Location**: `src/__tests__/components/`

**Example**:
```typescript
describe('Button Component', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Focus Areas**:
- Component rendering
- User interactions
- Props handling
- State management
- Accessibility
- Responsive behavior

### 3. Integration Tests

Test API endpoints and cross-service interactions.

**Location**: `src/__tests__/integration/`

**Example**:
```typescript
describe('Analytics API Integration', () => {
  it('should return overview metrics successfully', async () => {
    const request = createRequest('/api/analytics/overview')
    const response = await overviewHandler(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

**Focus Areas**:
- API endpoint functionality
- Database interactions
- Service integrations
- Error handling
- Data consistency

### 4. End-to-End Tests

Test complete user workflows in a real browser environment.

**Location**: `e2e/`

**Example**:
```typescript
test('should load dashboard with analytics', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Overview Dashboard')
  await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4)
})
```

**Focus Areas**:
- User workflows
- Navigation
- Form submissions
- Real-time updates
- Cross-browser compatibility
- Mobile responsiveness

### 5. Performance Tests

Test system performance and scalability.

**Location**: `src/__tests__/performance/`

**Example**:
```typescript
it('should create 100 bots within acceptable time', async () => {
  const startTime = performance.now()
  await Promise.all(Array.from({ length: 100 }, () => 
    botPersonaService.createBot()
  ))
  const duration = performance.now() - startTime
  expect(duration).toBeLessThan(5000)
})
```

**Focus Areas**:
- Response times
- Memory usage
- Concurrent operations
- Load testing
- Scalability

### 6. Validation Tests

Test data integrity and business rule enforcement.

**Location**: `src/__tests__/validation/`

**Example**:
```typescript
it('should validate bot persona data structure', async () => {
  const bot = await botPersonaService.createBot()
  expect(typeof bot.id).toBe('string')
  expect(bot.demographics.age).toBeGreaterThan(0)
  expect(bot.demographics.age).toBeLessThan(120)
})
```

**Focus Areas**:
- Data validation
- Business rules
- Constraints
- Data consistency
- Type safety

## Writing Tests

### Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should clearly describe what is being tested
3. **Test One Thing**: Each test should focus on a single behavior
4. **Use Test Data Factories**: Create reusable mock data generators
5. **Mock External Dependencies**: Isolate units under test
6. **Test Error Cases**: Include negative test cases
7. **Keep Tests Independent**: Tests should not depend on each other

### Test Utilities

Use the custom test utilities in `src/__tests__/utils/test-utils.tsx`:

```typescript
import { render, screen, fireEvent } from '@/utils/test-utils'
import { createMockBotPersona, createMockContent } from '@/utils/test-utils'

// Custom render with providers
render(<MyComponent />)

// Mock data factories
const mockBot = createMockBotPersona()
const mockContent = createMockContent()
```

### Mock Service Worker (MSW)

API mocking is handled by MSW. Handlers are defined in `src/__tests__/mocks/handlers.ts`:

```typescript
// Override default handler for specific test
beforeEach(() => {
  server.use(
    http.get('/api/analytics/overview', () => {
      return HttpResponse.json({ data: customMockData })
    })
  )
})
```

### Accessibility Testing

Include accessibility checks in component tests:

```typescript
import { getAccessibilityViolations } from '@/utils/test-utils'

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const violations = await getAccessibilityViolations(container)
  expect(violations).toHaveLength(0)
})
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Exclusions

The following are excluded from coverage:
- Type definition files (*.d.ts)
- Storybook stories (*.stories.*)
- Index files that only export
- Test files themselves

## CI/CD Integration

### GitHub Actions

The project includes GitHub Actions workflow for automated testing:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:e2e
```

### Pre-commit Hooks

Use Husky for pre-commit testing:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run test:component"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Jest Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- --updateSnapshot

# Run with verbose output
npm test -- --verbose
```

#### Playwright Tests Failing

```bash
# Install browsers
npx playwright install

# Run with debug mode
npm run test:e2e -- --debug

# Generate test report
npx playwright show-report
```

#### Memory Issues

For memory-intensive tests:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm test
```

#### Mock Issues

Check MSW server setup:

```typescript
// Verify handlers are registered
import { server } from './mocks/server'
console.log(server.listHandlers())
```

### Debugging Tests

1. **Use `debugger` statements** in tests for breakpoints
2. **Add `console.log`** for debugging test data
3. **Use `screen.debug()`** to inspect DOM in component tests
4. **Check test output** for detailed error messages
5. **Run individual tests** to isolate issues

### Performance Issues

For slow tests:

1. **Use `--detectSlowTests`** flag to identify slow tests
2. **Mock heavy operations** (database, API calls)
3. **Parallelize test execution** with `--maxWorkers`
4. **Profile test execution** with `--logHeapUsage`

## Test Data Management

### Factories

Use test data factories for consistent mock data:

```typescript
const mockBot = createMockBotPersona({
  engagementStyle: 'analytical',
  interests: ['technology', 'AI']
})
```

### Database Seeding

For integration tests requiring database state:

```typescript
beforeEach(async () => {
  await seedTestDatabase()
})

afterEach(async () => {
  await cleanupTestDatabase()
})
```

### Environment Variables

Set test-specific environment variables:

```bash
# .env.test
DATABASE_URL=postgres://test:test@localhost/test_db
GEMINI_API_KEY=test_key_do_not_use_in_production
```

## Continuous Testing

### Watch Mode

For development, use watch mode:

```bash
# Watch all tests
npm run test:watch

# Watch specific test pattern
npm test -- --watch --testNamePattern="Bot"
```

### Real-time Feedback

Configure your IDE for real-time test feedback:

1. **VS Code**: Install Jest extension
2. **WebStorm**: Enable Jest integration
3. **Vim**: Use vim-test plugin

## Reporting and Metrics

### Test Results

Tests generate multiple report formats:

- **Console**: Real-time feedback
- **HTML**: Detailed coverage reports
- **JUnit**: CI/CD integration
- **JSON**: Programmatic analysis

### Metrics Tracking

Track testing metrics:

- Test execution time
- Coverage trends
- Flaky test identification
- Performance regression detection

## Contributing

When contributing tests:

1. **Follow naming conventions**
2. **Include both positive and negative cases**
3. **Add performance tests for new features**
4. **Update documentation** for new test patterns
5. **Ensure tests are deterministic**

For questions about testing, please refer to the main project README or create an issue in the repository.