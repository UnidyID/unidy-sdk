/**
 * Jest setup file
 * 
 * This file is executed before each test file.
 */

// Mock the global objects that are used in the SDK
global.document = global.document || {
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
  })),
  body: {
    appendChild: jest.fn(),
    contains: jest.fn(() => true),
    removeChild: jest.fn()
  },
  cookie: ''
};

global.window = global.window || {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    protocol: 'https:',
    hostname: 'example.com',
    port: '',
    href: 'https://example.com'
  },
  getComputedStyle: jest.fn(() => ({ transitionDuration: '0.3s' })),
  setInterval: jest.fn(() => 123),
  clearInterval: jest.fn(),
  setTimeout: jest.fn(() => 456),
  clearTimeout: jest.fn()
};

global.sessionStorage = global.sessionStorage || {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

global.Image = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }
};

global.XMLHttpRequest = class {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.responseText = '';
    this.onload = null;
    this.onerror = null;
    this.withCredentials = false;
  }
  
  open() {}
  send() {}
};

// Mock the atob and btoa functions
global.atob = global.atob || ((str) => Buffer.from(str, 'base64').toString('binary'));
global.btoa = global.btoa || ((str) => Buffer.from(str, 'binary').toString('base64'));

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});

// Silence console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('[Unidy Login SDK]')) {
    return; // Silence SDK error logs during tests
  }
  originalConsoleError(...args);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});