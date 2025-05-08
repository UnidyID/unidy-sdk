# Unidy Login SDK

A lightweight SDK for handling authentication via iframe in web applications.

## Overview

The Unidy Login SDK is a JavaScript library that enables seamless authentication via an iframe in web applications. It handles the complete authentication flow, including login, logout, session management, and token refresh, while maintaining a consistent user experience.

## Features

- Cross-origin authentication support
- Secure token handling
- Session management
- Event-based architecture

## Installation

### NPM

```bash
npm install @unidy.io/login-sdk
```

### Yarn

```bash
yarn add @unidy.io/login-sdk
```

## Basic Usage

```javascript
import { Auth } from '@unidy.io/login-sdk';

// Initialize the SDK
const auth = new Auth('https://your-unidy-instance.com', {
  clientId: 'your-client-id',
  scope: 'openid profile email',
  responseType: 'id_token'
})
.onAuth(handleAuth)
.onLogout(handleLogout)
.init();

// Handle authentication
function handleAuth(idToken) {
  console.log('User authenticated:', idToken);
  // Update UI or redirect user
}

// Handle logout
function handleLogout() {
  console.log('User logged out');
  // Update UI or redirect user
}

// Show login dialog
document.getElementById('login-button').addEventListener('click', function() {
  auth.show();
});

// Logout
document.getElementById('logout-button').addEventListener('click', function() {
  auth.logout();
});
```

## Documentation

For detailed documentation, please refer to the following guides:

- [Integration Guide](./docs/INTEGRATION.md) - How to integrate the SDK into your application
- [Planning Document](./docs/PLANNING.md) - Architecture and design decisions
- [Testing Guide](./docs/TESTING.md) - How to run tests and add new ones
- [Task Tracking](./docs/TASK.md) - Current tasks and backlog

## API Reference

### Initialization

```javascript
const auth = new Auth(unidyUrl, options);
```

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Initializes the authentication frame |
| `show(options)` | Shows the authentication frame. `options.target` (e.g., "login") determines the page; defaults to login. |
| `close()` | Closes the authentication frame |
| `onAuth(handler)` | Sets up a handler for authentication events |
| `onLogout(handler)` | Sets up a handler for logout events |
| `isAuthenticated()` | Checks if the user is authenticated |
| `getIdToken()` | Gets the current ID token |
| `on(event, handler)` | Subscribes to an event |
| `off(event, handler)` | Unsubscribes from an event |
| `emit(event, data)` | Emits an event |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientId` | string | (required) | Your OAuth client ID |
| `scope` | string | "openid" | Space-separated OAuth scopes |
| `responseType` | string | "id_token" | OAuth response type |
| `prompt` | string | "login" | Controls the login prompt behavior |
| `maxAge` | number | 0 | Maximum authentication age in seconds |
| `autoRefresh` | boolean | false | Whether to automatically refresh tokens |
| `refreshInterval` | number | 300 | Seconds before expiry to refresh token |
| `sessionCheckInterval` | number | 60 | Seconds between session validity checks |

## License

MIT
