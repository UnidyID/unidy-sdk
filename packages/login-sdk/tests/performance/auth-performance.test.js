/**
 * Performance tests for the authentication flow
 */

import Auth from '../../src/auth';

// Mock the DOM elements and browser APIs
global.document = {
  getElementsByTagName: jest.fn(() => [{ appendChild: jest.fn() }]),
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    style: {},
    addEventListener: jest.fn(),
    appendChild: jest.fn()
  })),
  getElementById: jest.fn(() => ({
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    style: {}
  }))
};

global.window = {
  addEventListener: jest.fn(),
  location: {
    protocol: 'https:',
    hostname: 'example.com',
    port: ''
  },
  getComputedStyle: jest.fn(() => ({ transitionDuration: '0.3s' }))
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

describe('Authentication Performance', () => {
  let auth;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize the Auth instance
    auth = Auth('https://auth.example.com', {
      clientId: 'test-client-id',
      scope: 'openid profile',
      responseType: 'id_token'
    });
  });
  
  test('should initialize quickly', () => {
    const startTime = performance.now();
    
    auth.init();
    
    const endTime = performance.now();
    const initTime = endTime - startTime;
    
    console.log(`Initialization time: ${initTime.toFixed(2)}ms`);
    
    // Initialization should be fast (under 50ms)
    expect(initTime).toBeLessThan(50);
  });
  
  test('should handle multiple rapid show/close operations efficiently', () => {
    auth.init();
    
    const iterations = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      auth.show();
      auth.close();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    console.log(`Average show/close cycle time: ${averageTime.toFixed(2)}ms`);
    
    // Each show/close cycle should be fast (under 5ms)
    expect(averageTime).toBeLessThan(5);
  });
  
  test('should parse tokens efficiently', () => {
    // Create a sample JWT token with a known payload
    const payload = { sub: 'user123', name: 'Test User', exp: 1609459200 };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    // Set up the auth handler
    const mockAuthHandler = jest.fn();
    auth.onAuth(mockAuthHandler);
    
    // Get the auth listener from the listeners object
    const authListener = window.unidyLoginListeners.auth;
    
    // Measure token parsing performance
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      authListener({ idToken: token });
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    console.log(`Average token processing time: ${averageTime.toFixed(2)}ms`);
    
    // Token processing should be fast (under 1ms per token)
    expect(averageTime).toBeLessThan(1);
  });
  
  test('should check authentication status efficiently', () => {
    // Mock sessionStorage.getItem to return a token
    sessionStorage.getItem.mockReturnValue('test-id-token');
    
    const iterations = 10000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      auth.isAuthenticated();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    console.log(`Average authentication check time: ${averageTime.toFixed(2)}ms`);
    
    // Authentication checks should be very fast (under 0.1ms)
    expect(averageTime).toBeLessThan(0.1);
  });
});