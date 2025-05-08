# End-to-End Testing for Unidy Login SDK

This directory contains end-to-end (E2E) tests for the Unidy Login SDK using Playwright.

## Overview

The E2E tests simulate real user interactions in a browser environment to verify that the SDK functions correctly in real-world scenarios. These tests are particularly important for the Login SDK because it relies heavily on browser-specific features like iframes, postMessage communication, and session storage.

## Test Architecture

### Dual-Server Setup

The E2E tests use a dual-server setup to simulate a real-world environment where the API server and client application are hosted on different domains:

- **API Server (http://localhost:4000)**
  - Simulates the Unidy API server
  - Provides authentication endpoints
  - Handles token issuance and validation
  - Implements CORS to allow cross-origin requests

- **Client Server (http://localhost:4001)**
  - Serves the test application
  - Hosts the login SDK
  - Makes cross-origin requests to the API server

### Test Application

The test application is a simple HTML page that includes the Login SDK and provides UI elements for testing various features:

- Login button
- Logout button
- User info display
- Session expiry simulation
- Error handling

## Running the Tests

To run the E2E tests:

```bash
npm run test:e2e
```

To run the E2E tests with the Playwright UI:

```bash
npm run test:e2e:ui
```

To view the test report:

```bash
npm run test:e2e:report
```

To start the dual-server setup manually (useful for development):

```bash
npm run test:dual-server
```

## Test Files

- **auth-flow.e2e.js**: Tests basic authentication flows (login, logout, session expiry)
- **cross-origin-auth.e2e.js**: Tests authentication across different origins

## Adding New Tests

When adding new E2E tests:

1. Create a new file with the `.e2e.js` extension in this directory
2. Use the Playwright test API to simulate user interactions
3. Verify the expected behavior using assertions

Example:

```javascript
import { test, expect } from '@playwright/test';

test('should log in successfully', async ({ page }) => {
  await page.goto('http://localhost:4001/test-app');
  await page.click('#login-button');
  
  // Test login flow
  // ...
  
  // Verify the user is logged in
  const userInfo = await page.textContent('#user-info');
  expect(userInfo).toContain('User: test-user');
});
```

## Debugging Tests

To debug E2E tests:

1. Run the tests with the UI: `npm run test:e2e:ui`
2. Use the Playwright UI to step through the tests
3. Inspect the page state at each step
4. View the console logs and network requests

## Cross-Origin Testing

The E2E tests specifically test cross-origin scenarios, which are common in real-world applications. This includes:

- Cross-origin authentication flows
- CORS handling
- Cookie-based authentication
- Token refresh across domains
- Security implications of cross-origin communication