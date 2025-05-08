# Unidy Login SDK Integration Guide

This document provides detailed instructions on how to integrate the Unidy Login SDK into your web application to enable Single Sign-On (SSO) functionality.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Basic Integration](#basic-integration)
- [Advanced Configuration](#advanced-configuration)
- [Authentication Events](#authentication-events)
- [Session Management](#session-management)
- [Cross-Origin Authentication](#cross-origin-authentication)
- [Styling](#styling)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Overview

The Unidy Login SDK is a lightweight JavaScript library that enables seamless authentication via an iframe in web applications. It handles the complete authentication flow, including login, logout, session management, and token refresh, while maintaining a consistent user experience.

Key features:
- Cross-origin authentication support
- Customizable UI
- Secure token handling
- Session management
- Event-based architecture

## Prerequisites

Before integrating the Unidy Login SDK, you need:

1. A Unidy account with SSO enabled
2. OAuth client credentials (client ID) for your application
3. The base URL of your Unidy service

## Installation

### Option 1: Direct Script Include

Add the SDK script and CSS to your HTML:

```html
<script src="https://cdn.unidy.com/login-sdk/unidy-login-0.0.1.js"></script>
```

### Option 2: NPM Installation

```bash
npm install @unidy.io/login-sdk
```

Then import in your JavaScript:

```javascript
import { Auth } from '@unidy.io/login-sdk';
// CSS is automatically bundled with the JavaScript.
```

## Basic Integration

### 1. Initialize the SDK

```javascript
const Auth = new UnidyLoginSDK.Auth('https://your-unidy-instance.com', {
  clientId: 'your-client-id',
  scope: 'openid profile email',
  responseType: 'id_token'
})
.onAuth(handleAuth)
.onLogout(handleLogout)
.init();

function handleAuth(idToken) {
  console.log('User authenticated:', idToken);
  // Update UI or redirect user
}

function handleLogout() {
  console.log('User logged out');
  // Update UI or redirect user
}
```

### 2. Add Login Button

```html
<button id="login-button">Login</button>

<script>
  document.getElementById('login-button').addEventListener('click', function() {
    Auth.show();
  });
</script>
```

### 3. Add Logout Button

```html
<button id="logout-button">Logout</button>

<script>
  document.getElementById('logout-button').addEventListener('click', function() {
    Auth.logout();
  });
</script>
```

## Advanced Configuration

The SDK accepts several configuration options:

```javascript
const Auth = new UnidyLoginSDK.Auth('https://your-unidy-instance.com', {
  clientId: 'your-client-id',
  scope: 'openid profile email', // Space-separated OAuth scopes
  responseType: 'id_token', // OAuth response type
  prompt: 'login', // Force login prompt even if already authenticated
  maxAge: 0 // Force re-authentication
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| clientId | string | (required) | Your OAuth client ID |
| scope | string | "openid" | Space-separated OAuth scopes |
| responseType | string | "id_token" | OAuth response type |
| prompt | string | "login" | Controls the login prompt behavior |
| maxAge | number | 0 | Maximum authentication age in seconds |

## Authentication Events

The SDK uses an event-based architecture to handle authentication state changes.

### Authentication Success

```javascript
Auth.onAuth(function(idToken) {
  // idToken contains the JWT token
  console.log('User authenticated with token:', idToken);
  
  // You can decode the token to access user information
  const tokenParts = idToken.split('.');
  if (tokenParts.length === 3) {
    const payload = JSON.parse(atob(tokenParts[1]));
    console.log('User info:', payload);
  }
  
  // Update UI to show authenticated state
  showUserInfo();
});
```

### Logout

```javascript
Auth.onLogout(function() {
  console.log('User logged out');
  
  // Update UI to show logged out state
  showLoginButton();
});
```

## Session Management

The SDK provides methods to check authentication status and manage the session:

```javascript
// Check if user is authenticated
if (Auth.isAuthenticated()) {
  showUserInfo();
} else {
  showLoginButton();
}

// Get the current ID token
const idToken = Auth.getIdToken();
```

## Cross-Origin Authentication

The SDK is designed to work across different domains, which is common in SSO scenarios. For example, your application might be hosted on `app.example.com` while the Unidy service is on `auth.unidy.com`.

To enable cross-origin authentication:

1. Ensure your Unidy service has CORS configured to allow requests from your domain
2. Use the full URL including protocol when initializing the SDK
3. Make sure cookies are properly handled with SameSite and Secure attributes

Example:

```javascript
const Auth = new UnidyLoginSDK.Auth('https://auth.unidy.com', {
  clientId: 'your-client-id'
});
```

## Styling

The SDK includes default styling for the authentication iframe, but you can customize it by overriding the CSS classes:

```css
/* Customize the overlay background */
#unidyAuthFrameWrapper { /* ID defined in packages/login-sdk/src/modules/constants.js */
  background-color: rgba(0, 0, 0, 0.8);
}

/* Customize the iframe */
#unidyAuthFrame { /* ID defined in packages/login-sdk/src/modules/constants.js */
  width: 400px;
  height: 500px;
  border-radius: 10px;
}
```

## Security Considerations

### Token Storage

The SDK stores the ID token in sessionStorage by default, which means it's cleared when the browser tab is closed. This is a security best practice for SPAs (Single Page Applications).

### HTTPS

Always use HTTPS in production to ensure secure communication between your application and the Unidy service.

### Cross-Origin Resource Sharing (CORS)

Ensure your Unidy service has proper CORS configuration to allow requests only from trusted domains.

## Troubleshooting

### Common Issues

1. **Authentication iframe doesn't appear**
   - Check browser console for errors
   - Verify that the Unidy URL is correct and accessible
   - Ensure the SDK JavaScript file is properly loaded (CSS is bundled)

2. **Cross-origin errors in console**
   - Verify CORS configuration on the Unidy service
   - Check that the origin URL matches exactly (including protocol and port)

3. **Authentication succeeds but user appears logged out after refresh**
   - Check that sessionStorage is available and not disabled
   - Verify that the token is being properly stored

## API Reference

### Initialization

```javascript
const Auth = new UnidyLoginSDK.Auth(unidyUrl, options);
```

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Initializes the authentication frame |
| `show(options)` | Shows the authentication frame with specified target |
| `close()` | Closes the authentication frame |
| `onAuth(handler)` | Sets up a handler for authentication events |
| `onLogout(handler)` | Sets up a handler for logout events |
| `isAuthenticated()` | Checks if the user is authenticated |
| `getIdToken()` | Gets the current ID token |
| `on(event, handler)` | Subscribes to an event |
| `off(event, handler)` | Unsubscribes from an event |
| `emit(event, data)` | Emits an event |

### Options for `show()`

```javascript
Auth.show({ target: 'login' }); // Shows login page
```

### Event Handlers

```javascript
// Authentication handler
Auth.onAuth(function(idToken) {
  // Handle authentication
});

// Logout handler
Auth.onLogout(function() {
  // Handle logout
});
```

---

For more information, visit the [Unidy Documentation](https://docs.unidy.com) or contact [support@unidy.com](mailto:support@unidy.com).
