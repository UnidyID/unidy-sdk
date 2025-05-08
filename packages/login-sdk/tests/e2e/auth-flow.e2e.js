/**
 * End-to-End tests for the authentication flow
 */

import { test, expect } from '@playwright/test';

// Test the basic authentication flow
test('should complete the authentication flow', async ({ page }) => {
  // Navigate to the test application
  await page.goto('http://localhost:4001/test-app');
  
  // Click the login button
  await page.click('#login-button');
  
  // Wait for the iframe to appear
  const iframe = await page.waitForSelector('#unidyAuthFrame');
  expect(iframe).toBeTruthy();
  
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
  
  // Test logout
  await page.click('#logout-button');
  
  // Verify that the user is logged out
  const loginButton = await page.waitForSelector('#login-button');
  expect(loginButton).toBeTruthy();
});

// Test authentication error handling
test('should handle authentication errors', async ({ page }) => {
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
  
  // Wait for the error message
  const errorMessage = await frameContext.waitForSelector('.error-message');
  const errorText = await errorMessage.textContent();
  expect(errorText).toContain('Invalid credentials');
});

// Test session expiry
test('should handle session expiry', async ({ page }) => {
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
  
  // Simulate session expiry by clicking a test button
  await page.click('#expire-session-button');
  
  // Verify that the user is prompted to log in again
  const loginPrompt = await page.waitForSelector('#session-expired-message');
  const promptText = await loginPrompt.textContent();
  expect(promptText).toContain('Your session has expired');
  
  // Verify that the login button is visible again
  const loginButton = await page.waitForSelector('#login-button');
  expect(loginButton).toBeTruthy();
});