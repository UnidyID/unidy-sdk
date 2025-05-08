'use strict';

module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/e2e/',
    '/__tests__/performance/'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  verbose: true
};