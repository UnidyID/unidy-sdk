/**
 * End-to-End tests for cross-origin authentication
 */

import { test, expect } from '@playwright/test';

// Test cross-origin authentication flow
test('should handle cross-origin authentication', async ({ page }) => {
  // Navigate to the test application
  await page.goto('http://localhost:4001/test-app');
  
  // Click the login button
  await page.click('#login-button');
  
  // Wait for the iframe to appear
  const iframe = await page.waitForSelector('#unidyAuthFrame');
  expect(iframe).toBeTruthy();
  
  // Verify that the iframe is loading from a different origin
  const iframeSrc = await iframe.getAttribute('src');
  expect(iframeSrc).toContain('http://localhost:4000');
  
  // Switch to the iframe context
  const frameContext = await iframe.contentFrame();
  
  // Fill in the login form
  await frameContext.fill('#username', 'test-user');
  await frameContext.fill('#password', 'test-password');
  await frameContext.click('#login-submit');
  
  // Wait for the authentication to complete and iframe to close
  await page.waitForSelector('#unidyAuthFrame', { state: 'hidden' });
  
  // Verify that the user is authenticated
  const userInfoElement = await page.waitForSelector('#user-info');
  const userInfo = await userInfoElement.textContent();
  expect(userInfo).toContain('test-user');
  
  // Verify that the token is stored in sessionStorage
  const isAuthenticated = await page.evaluate(() => {
    return !!sessionStorage.getItem('idToken');
  });
  expect(isAuthenticated).toBe(true);
});

// Test cross-origin session validation
test('should validate session across origins', async ({ page }) => {
  // Navigate to the test application
  await page.goto('http://localhost:4001/test-app');
  
  // Click the login button
  await page.click('#login-button');
  
  // Wait for the iframe to appear and complete login
  const iframe = await page.waitForSelector('#unidyAuthFrame');
  const frameContext = await iframe.contentFrame();
  await frameContext.fill('#username', 'test-user');
  await frameContext.fill('#password', 'test-password');
  await frameContext.click('#login-submit');
  
  // Wait for the authentication to complete
  await page.waitForSelector('#unidyAuthFrame', { state: 'hidden' });
  
  // Wait for a moment to allow session check to occur
  await page.waitForTimeout(5000);
  
  // Verify that the session is still valid
  const userInfoElement = await page.waitForSelector('#user-info');
  expect(userInfoElement).toBeTruthy();
  
  // Simulate session expiry on the API server by clearing cookies
  await page.evaluate(() => {
    // This would normally be done by the API server
    document.cookie = 'id_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
  
  // Trigger a session check
  await page.click('#expire-session-button');
  
  // Verify that the session expired message is shown
  const sessionExpiredMessage = await page.waitForSelector('#session-expired-message', { 
    state: 'visible' 
  });
  expect(sessionExpiredMessage).toBeTruthy();
});

// Test cross-origin error handling
test('should handle cross-origin errors', async ({ page }) => {
  // Navigate to the test application
  await page.goto('http://localhost:4001/test-app');
  
  // Click the login button
  await page.click('#login-button');
  
  // Wait for the iframe to appear
  const iframe = await page.waitForSelector('#unidyAuthFrame');
  
  // Switch to the iframe context
  const frameContext = await iframe.contentFrame();
  
  // Fill in the login form with invalid credentials
  await frameContext.fill('#username', 'invalid-user');
  await frameContext.fill('#password', 'invalid-password');
  await frameContext.click('#login-submit');
  
  // Wait for the error message in the iframe
  const errorMessage = await frameContext.waitForSelector('.error-message');
  const errorText = await errorMessage.textContent();
  expect(errorText).toContain('Invalid credentials');
  
  // Verify that the iframe is still visible
  const iframeVisible = await iframe.isVisible();
  expect(iframeVisible).toBe(true);
});