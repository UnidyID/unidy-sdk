# Login SDK Testing Guide

This document provides an overview of the testing infrastructure for the Unidy Login SDK, including what the tests cover and how to run them.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End (E2E) Tests](#end-to-end-e2e-tests)
  - [Performance Tests](#performance-tests)
- [Running Tests](#running-tests)
  - [Running All Tests](#running-all-tests)
  - [Running Specific Test Types](#running-specific-test-types)
  - [Running Tests in Watch Mode](#running-tests-in-watch-mode)
  - [Generating Coverage Reports](#generating-coverage-reports)
- [E2E Testing Architecture](#e2e-testing-architecture)
  - [Dual-Server Setup](#dual-server-setup)
  - [Cross-Origin Testing](#cross-origin-testing)
- [Continuous Integration](#continuous-integration)
- [Adding New Tests](#adding-new-tests)

## Overview

The Login SDK uses a comprehensive testing strategy that includes unit tests, integration tests, and end-to-end tests to ensure the SDK functions correctly across different environments and use cases.

The testing infrastructure uses:
- **Jest**: For unit and integration tests
- **Playwright**: For end-to-end browser tests
- **Express**: For test servers that simulate real-world environments

## Test Types

### Unit Tests

Unit tests focus on testing individual modules and functions in isolation. They are located in the `tests/modules/` directory (e.g., `tests/modules/token-manager.test.js` for `src/modules/token-manager.js`).

**What they test:**
- Token management functionality
- Authentication state handling
- Event handling
- Error handling
- Utility functions

**Example unit tests:**
- `tests/modules/token-manager.test.js`: Tests token parsing, refresh timers, and token refresh functionality for `src/modules/token-manager.js`.
- Other module-specific test files

### Integration Tests

Integration tests verify that different modules work together correctly. They are located in the `tests/` directory with a `.integration.test.js` suffix (e.g., `tests/auth-flow.integration.test.js`).

**What they test:**
- Interaction between modules
- API client functionality
- Event propagation between components

### End-to-End (E2E) Tests

E2E tests simulate real user interactions in a browser environment. They are located in the `tests/e2e/` directory and use Playwright to automate browser testing.

**What they test:**
- Complete authentication flows
- Cross-origin authentication
- UI interactions
- Session management
- Token refresh in real browser environments

**Key E2E test files:**
- `tests/e2e/auth-flow.e2e.js`: Tests basic authentication flows (login, logout, session expiry)
- `tests/e2e/cross-origin-auth.e2e.js`: Tests authentication across different origins

### Performance Tests

Performance tests measure the SDK's performance characteristics. They are located in the `tests/performance/` directory.

**What they test:**
- Load time
- Memory usage
- Execution speed of critical operations

## Running Tests

### Running All Tests

To run all tests:

```bash
npm run test
```

To run all tests including E2E tests:

```bash
npm run test && npm run test:e2e
```

### Running Specific Test Types

To run only unit tests:

```bash
npm run test:unit
(Note: this script now directly invokes jest with the path `tests/modules`)
```

To run only integration tests:

```bash
npm run test:integration
(Note: this script now directly invokes jest with the path pattern `tests/.*\\.integration\\.test\\.js$`)
```

To run only E2E tests:

```bash
npm run test:e2e
```

To run only performance tests:

```bash
npm run test:performance
(Note: this script now directly invokes jest with `performance-jest.config.js`)
```

### Running Tests in Watch Mode

For development, you can run tests in watch mode, which will automatically re-run tests when files change:

```bash
npm run test:watch
```

### Generating Coverage Reports

To generate test coverage reports:

```bash
npm run test:coverage
```

This will create a coverage report in the `coverage/` directory, which you can view in your browser by opening `coverage/lcov-report/index.html`.

## E2E Testing Architecture

### Dual-Server Setup

The E2E tests use a dual-server setup to simulate a real-world environment where the API server and client application are hosted on different domains.

**API Server (http://localhost:4000)**
- Simulates the Unidy API server
- Provides authentication endpoints
- Handles token issuance and validation
- Implements CORS to allow cross-origin requests

**Client Server (http://localhost:4001)**
- Serves the test application
- Hosts the login SDK
- Makes cross-origin requests to the API server

To start both servers manually (useful for development):

```bash
npm run test:dual-server
(Note: this script now uses the path `tests/e2e/setup/start-servers.js`)
```

### Cross-Origin Testing

The E2E tests specifically test cross-origin scenarios, which are common in real-world applications. This includes:

- Cross-origin authentication flows
- CORS handling
- Cookie-based authentication
- Token refresh across domains
- Security implications of cross-origin communication

For more details on the cross-origin testing setup, see the [E2E README](../tests/e2e/README.md).

## Continuous Integration

The SDK uses GitHub Actions for continuous integration. The CI workflow runs:

1. Unit and integration tests on multiple Node.js versions (16.x, 18.x, 20.x)
2. E2E tests using Playwright
3. Performance tests
4. Linting checks
5. Build verification

Test coverage reports are uploaded to Codecov for tracking code coverage over time.

## Adding New Tests

When adding new functionality to the SDK, follow these guidelines for adding tests:

1. **Unit Tests**: Add unit tests for new modules or functions in the `tests/modules/` directory, mirroring the `src/modules/` structure. For files directly in `src/`, place tests in `tests/` (e.g., `tests/auth.test.js` for `src/auth.js`).
2. **Integration Tests**: Add integration tests for interactions between modules in the `tests/` directory, typically suffixed with `.integration.test.js`.
3. **E2E Tests**: Add E2E tests for new authentication flows or user interactions in the `tests/e2e/` directory.

Each test file should follow the naming convention:
- Unit tests: `tests/modules/[module-name].test.js` or `tests/[file-name].test.js`
- Integration tests: `tests/[feature-name].integration.test.js`
- E2E tests: `tests/e2e/[feature-name].e2e.js`
- Performance tests: `tests/performance/[feature-name].test.js`

For each feature, aim to include:
- Tests for expected use cases
- Tests for edge cases
- Tests for error handling