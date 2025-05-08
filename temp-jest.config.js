/**
 * Simplified Jest configuration for the login-sdk package
 */

module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Mock CSS imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/e2e/',
    '/__tests__/performance/'
  ],
  
  // Setup files that will be executed before each test file
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Indicates whether each individual test should be reported during the run
  verbose: true
};