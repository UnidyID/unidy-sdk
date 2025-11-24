# Unidy Auth SDK

The Unidy Auth SDK provides a convenient way to integrate Unidy authentication into your web application. It is built with a web component and can be used with or without a front-end framework.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Advanced Usage](#advanced-usage)
  - [Custom Token Storage](#custom-token-storage)
  - [Inline Mode](#inline-mode)
  - [Silent Authentication](#silent-authentication)
  - [Handling Third-Party Cookies](#handling-third-party-cookies)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Methods](#methods)
  - [Properties](#properties)
  - [Events](#events)
- [Styling](#styling)

## Prerequisites

Before using the SDK, you must configure an OAuth application in your Unidy instance:

1.  **Scope**: Ensure your application has the `openid` scope at a minimum. You will likely need `email` and `profile` for user information.
2.  **External Embed Domain**: Add the domain where you will host your application to the `External Embed Domain` list.
3.  **Redirect URL**: Whitelist the URL that Unidy should redirect back to after authentication.

## Installation

```bash
npm install @unidy.io/auth
```

## Quick Start

This example shows the recommended approach where the SDK manages the authentication token in the browser's session storage.

```typescript
import { UnidyAuth } from '@unidy.io/auth';

// side effect import to avoid tree shaking
import "../node_modules/@unidy.io/auth/dist/esm/unidy-login";

// 1. Initialize the SDK
const unidyAuth = new UnidyAuth().init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email"
});

// 2. Check authentication status on page load
if (await unidyAuth.isAuthenticated()) {
  const userData = unidyAuth.userTokenData();
  console.log('User is authenticated. User data:', userData);
} else {
  console.log('User is not authenticated.');
}

// 3. Handle login
document.getElementById('login-button').addEventListener('click', async () => {
  const result = await unidyAuth.auth();
  if (result.success) {
    console.log('Welcome back,', result.userTokenData.name || result.userTokenData.email);
  } else {
    console.error('Login failed:', result.error);
  }
});

// 4. Handle logout
document.getElementById('logout-button').addEventListener('click', async () => {
  const result = await unidyAuth.logout();
  if (result.success) {
    console.log('Logged out successfully!');
  }
});
```

## Advanced Usage

### Inline Mode

To embed the login form directly into your page instead of a modal, set `mode` to `'inline'`.

```typescript
const unidyAuth = new UnidyAuth().init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  mode: 'inline',
  mountTarget: '#login-container' // Specify where to embed the form
});
```

-   **Mount Target**: Can be an element ID, a CSS selector, or an `HTMLElement`. Defaults to `document.body`.
-   In inline mode, `show()` and `hide()` methods have no effect.

### Silent Authentication

You can attempt to authenticate a user without any interaction, which is useful for checking for an active session on page load.

**Note:** It's best practice to first check `isAuthenticated()` to avoid unnecessary network requests.

```typescript
const result = await unidyAuth.auth({ silent: true });

if (result.success) {
  console.log('Silent auth successful. User data:', result.userTokenData);
  // If storeTokenInSession: false, remember to store result.token
} else {
  console.log('Silent auth failed. User needs to log in manually.');
}
```

### Handling Third-Party Cookies

Some browsers, like Safari, block third-party cookies, which can interfere with the login flow. The SDK handles this by redirecting the user to the Unidy authentication server.

In **inline mode**, a login button is rendered to initiate this redirect flow. You can style this button using the `login-button` part.

```css
unidy-login::part(login-button) {
  background-color: #0a2463;
  color: #ffffff;
  /* ... other styles */
}
```

### Custom Token Storage

If you need to manage the token yourself, set `storeTokenInSession` to `false`.

**Note:** When `storeTokenInSession` is `false`, the methods `isAuthenticated()` and `userTokenData()` will not work as expected, as they rely on session storage.

```typescript
import { UnidyAuth } from '@unidy.io/auth';

const unidyAuth = new UnidyAuth().init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email",
  storeTokenInSession: false // Disable automatic token storage
});

// Implement your own token storage
const myAppTokenStore = {
  set: (token) => localStorage.setItem('auth_token', token),
  get: () => localStorage.getItem('auth_token'),
  remove: () => localStorage.removeItem('auth_token')
};

// Handle login
document.getElementById('login-button').addEventListener('click', async () => {
  const result = await unidyAuth.auth();
  if (result.success) {
    myAppTokenStore.set(result.token); // Store the token
    console.log('Welcome back,', result.userTokenData.name);
  }
});

// Handle logout
document.getElementById('logout-button').addEventListener('click', async () => {
  await unidyAuth.logout();
  myAppTokenStore.remove(); // Remove the token
});
```

## Configuration

### Required

-   `baseUrl` (`string`): The base URL of the Unidy authentication server.
-   `clientId` (`string`): Your application's client ID.

### Optional

| Property                                    | Type                                                     | Description                                                                                                                            | Default                  |
| ------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `scope`                                     | `string`                                                 | OAuth scopes.                                                                                                                          | `"openid email"`         |
| `responseType`                              | `"id_token"` \| `"token"` \| `"code"`                    | The response type for the OAuth flow.                                                                                                  | `"id_token"`             |
| `prompt`                                    | `'none'` \| `'login'` \| `'consent'` \| `'select_account'` | The `prompt` parameter for the authentication request.                                                                                 | `null`                   |
| `storeTokenInSession`                       | `boolean`                                                | If `true`, the SDK manages the token in session storage.                                                                               | `true`                   |
| `fallbackToSilentAuthRequest`               | `boolean`                                                | If `true`, `isAuthenticated()` will attempt a silent login if no token is found.                                                       | `false`                  |
| `onAuth`                                    | `(token: string) => void`                                | A callback function executed on successful authentication.                                                                             | `undefined`              |
| `enableLogging`                             | `boolean`                                                | Enables SDK logging to the console.                                                                                                    | `true`                   |
| `mode`                                      | `'dialog'` \| `'inline'`                                 | Renders the component as a modal dialog or embedded in the page.                                                                       | `'dialog'`               |
| `mountTarget`                               | `string` \| `HTMLElement`                                | The element where the component will be mounted in `inline` mode.                                                                      | `document.body`          |
| `redirectFlowForLimitedThirdPartyCookieAccess` | `boolean`                                                | Set to `false` if your app and Unidy run on the same second-level domain.                                                              | `true`                   |
| `redirectFlowLoginButtonLabel`              | `string`                                                 | The label for the login button in inline mode when a redirect is needed.                                                               | `"Login"`                |

## API Reference

### Methods

-   `mountComponent()`: Mounts the `<unidy-login>` component to the DOM. Called automatically on `init()`.
-   `auth(options: { silent: boolean })`: Returns a `Promise`. Initiates authentication.
-   `logout()`: Returns a `Promise`. Logs the user out.
-   `show()`: Returns a `Promise<void>`. Shows the login dialog (in `dialog` mode).
-   `hide()`: Returns a `Promise<void>`. Hides the login dialog (in `dialog` mode).
-   `parseToken(token: string)`: Returns `object | null`. Decodes a JWT token.
-   `validateToken(token: string)`: Returns `boolean`. Validates a JWT token's expiration.
-   `isAuthenticated()`: Returns a `Promise<boolean>`. Checks for a valid session token.
-   `userTokenData()`: Returns `object | null`. Retrieves user data from the session token.

### Properties

-   `idToken`: Returns `string | null`. The current ID token from session storage.
-   `isInitialized`: Returns `boolean`. `true` if the component is mounted to the DOM.

### Events

Listen for events on the `<unidy-login>` element.

-   `onAuthSuccess`: Fired on successful authentication.
    -   `event.detail`: `{ token: string }`
-   `onAuthError`: Fired on authentication failure.
    -   `event.detail`: `{ error: string }`
-   `onLogout`: Fired on logout.
-   `onClose`: Fired when the login dialog is closed.

## Styling

Customize the component with CSS Custom Properties and Shadow Parts.

### Custom Properties

```css
unidy-login {
  --unidy-login-z-index: 1000;
  --unidy-login-backdrop-bg: rgba(0, 0, 0, 0.5);
  --unidy-login-dialog-bg: #fff;
  /* ... and more */
}
```

### Shadow Parts (`::part`)

-   `dialog`: The main dialog container.
-   `backdrop`: The backdrop behind the dialog.
-   `content`: The content area within the dialog.
-   `close-button`: The close button.
-   `iframe`: The iframe that loads the login page.
-   `login-button`: The login button (in inline/redirect mode).

Example:

```css
unidy-login::part(dialog) {
  border: 2px solid #0a2463;
}
```
