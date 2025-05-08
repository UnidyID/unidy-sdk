/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  // Directory where tests are located
  testDir: './tests/e2e',
  
  // Pattern for test files
  testMatch: '**/*.e2e.js',
  
  // Maximum time one test can run for
  timeout: 30000,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  // Shared settings for all the projects
  use: {
    // Maximum time each action (like click) can take
    actionTimeout: 5000,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video only when retrying a test for the first time
    video: 'on-first-retry',
    
    // Record screenshots only when retrying a test for the first time
    screenshot: 'only-on-failure',
    
    // Base URL to use in navigation
    baseURL: 'http://localhost:4001',
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
      },
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
      },
    },
  ],
  
  // Web server to start before running tests
  webServer: {
    command: 'npm run test:dual-server',
    port: 4001,
    timeout: 10000,
    reuseExistingServer: !process.env.CI,
  },
};

module.exports = config;