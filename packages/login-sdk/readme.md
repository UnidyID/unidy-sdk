# Unidy Auth SDK

The Unidy Auth SDK provides a convenient way to integrate Unidy authentication into your web application. It is built with a web component and can be used with or without a front-end framework,

## Installation

```bash
npm install @unidy.io/auth
```

## Requirements
It is necessary to properly configure the OAuth application in Unidy to be used in the SDK. At least `openid` scope is needed. `External Embed Domain` must be configured so that SDK could be embedded in your app. Also, `Redirect URL` must be whitelisted to allow redirection back to your app.

## Basic Usage

### Example: SDK-managed token storage (suggested approach)

When `storeTokenInSession` is `true` (the default), the SDK automatically handles token storage in the browser's session storage.

```typescript
import { UnidyAuth } from '@unidy.io/auth';

const unidyAuth = new UnidyAuth().init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email"
});

// Example of how to handle login, logout, and check authentication status

// check if user is authenticated
if (await unidyAuth.isAuthenticated()) {
  try {
    const userData = unidyAuth.userTokenData();
    console.log('User is authenticated. User data:', userData);
  } catch (error) {
    console.log('Error getting user data:', error);
  }
} else {
    console.log('User is not authenticated.');
}

// Handle login button click
const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', async () => {
  const result = await unidyAuth.auth();  // `auth` method handles the oidc flow (and returns with token when it finishes if succefull)

  if (result.success) {
    console.log('Welcome back,', result.userTokenData.name || result.userTokenData.email);
  } else {
    console.error('Login failed:', result.error);
  }
});

// Handle logout
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', async () => {
  const result = await unidyAuth.logout();

  if (result.success) {
    console.log('Logged out successfully!');
    // Token is automatically removed from session storage
  }
});
```

### Example: User managed token storage (custom approach)

When `storeTokenInSession` is set to `false`, you are responsible for handling token storage.

The SDK provides helper methods like `validateToken()` and `parseToken()` for this purpose so you can easily handle the authentication (example below).

**Important note:** Methods `isAuthenticated` and `userTokenData` in this case always return false and null since they rely on the session storage for token management, which is disabled when `storeTokenInSession` is set to `false`.

```typescript
import { UnidyAuth } from '@unidy.io/auth';

// Initialize the SDK without the token session storage
const unidyAuth = new UnidyAuth().init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email",
  storeTokenInSession: false
});

// Mount the login component
unidyAuth.mountComponent();

// Custom token storage example
const storeToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

const getToken = () => {
  return localStorage.getItem('auth_token');
};

const removeToken = () => {
  localStorage.removeItem('auth_token');
};

// Check if user is authenticated
const token = getToken();
const userData = token ? unidyAuth.parseToken(token) : null;
if (userData) {
    console.log('User is authenticated. User data:', userData);
} else {
    // Token is invalid or expired
    removeToken();
    console.log('User is not authenticated.');
}

// Init login on button click
const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', async () => {
  const result = await unidyAuth.auth();
  if (result.success) {
    console.log('Logged in successfully!');

    // Store the token yourself
    storeToken(result.token);

    // User data is already available in the result
    const userName = result.userTokenData.name || result.userTokenData.email || 'User';
    console.log('Welcome back,', userName);
  } else {
    console.error('Login failed:', result.error);
  }
});

// Handle logout
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', async () => {
  const result = await unidyAuth.logout();
  if (result.success) {
    console.log('Logged out successfully!');
    // Remove the token yourself
    removeToken();
  }
});
```

### Example: Inline Mode (embedded in page)

You can embed the login component directly in your page instead of using a modal dialog by setting the `mode` property to `'inline'`:

```typescript
import { UnidyAuth } from '@unidy.io/auth';

const unidyAuth = new UnidyAuth().init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email",
  mode: 'inline', // This embeds the login form directly in the page
  mountTarget: '#login-container' // Optional: specify where to mount the component
});

// The component will be rendered inline instead of in a modal
// You can style the container div to control the size and appearance
```

**Note:** In inline mode, the `show()` and `hide()` methods have no effect since the component is always visible.

**Mount Target Options:**
- **Element ID**: `mountTarget: 'login-container'` - mounts to element with ID "login-container"
- **CSS Selector**: `mountTarget: '.auth-section .login-form'` - mounts to element matching the selector
- **HTMLElement**: `mountTarget: document.querySelector('#login')` - mounts to the specified element
- **Default**: If not specified, mounts to `document.body`

### Special handling for third-party cookies

When using the Unidy SDK in a browser environment, you may encounter limitations with third-party cookies, especially in Safari and other browsers with strict privacy settings. In that case, the SDK will redirect the user to the Unidy authentication server for login, which is necessary when third-party cookies are blocked. In **inline mode**, a login button is rendered that allows the user to initiate the login process. You can customize the button label using the `redirectFlowLoginButtonLabel` configuration and CSS pseudo-classes to style the button.

```css
unidy-login::part(login-button) {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: #0a2463;
  color: #ffffff;
  font-family: sans-serif;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

unidy-login::part(login-button):hover {
  background-color: #1e3a8a;
  transform: translateY(-1px);
}
```

## Silent Authentication

You can attempt to authenticate a user silently (without user interaction) when your application loads. This is useful for checking if a user has an active session with the authentication server. However you should first check if there is existing valid token with `isAuthenticated()` method so you don't ping Unidy authentication server unnecessarily

**Note:** Silent authentication happens in the background without showing any UI to the user.

```typescript
const result = await unidyAuth.auth({ silent: true })

if (result.success) {
  // User was silently authenticated
  console.log('Silent auth successful');
  // If storeTokenInSession is true, the token is already stored.

  // User data is available directly in the result:
  console.log('User data:', result.userTokenData);

  // If storeTokenInSession is false, you should store the token yourself:
  storeToken(result.token);
} else {
  // Silent auth failed, user needs to log in manually (click on the button)
  console.log('Silent auth failed:', result.error);
}
```

## Configuration Options

```typescript
interface UnidyAuthConfig {
  // Required: The base URL of the Unidy authentication server
  baseUrl: string;

  // Required: Your application's client ID
  clientId: string;

  // Optional: OAuth scopes (default: "openid email")
  scope?: string;

  // Optional: Response type, 'id_token' | 'token' | 'code' (default: "id_token")
  responseType?: "id_token" | "token" | "code";

  // Optional: Prompt parameter for auth, 'none' | 'login' | 'consent' | 'select_account' | null
  prompt?: 'none' | 'login' | 'consent' | 'select_account' | null;

  // Optional: Whether to store token in session storage (default: true)
  storeTokenInSession?: boolean;

  // Optional: Fallback to silent auth request in 'isAuthenticated' if no token is found (default: false)
  fallbackToSilentAuthRequest?: boolean;

  // Optional: Callback function called when authentication is successful
  onAuth?: (token: string) => void;

  // Optional: Whether to enable logging (default: true)
  enableLogging?: boolean;

  // Optional: Rendering mode - 'dialog' for modal popup, 'inline' for embedded in page (default: 'dialog')
  mode?: 'dialog' | 'inline';

  // Optional: Mount target for inline mode - element ID, CSS selector, or HTMLElement (default: document.body)
  mountTarget?: string | HTMLElement;

  // Whether to use the special redirect behavior, for browsers limitation access to third party cookies.
  // This should be disabled, when the Unidy instance runs on the same second level domain as the application using the SDK.
  redirectFlowForLimitedThirdPartyCookieAccess?: boolean;

  // When in inline mode and the browser has no access to third-party cookies,
  // a login button is rendered with this label. Defaults to "Login"
  redirectFlowLoginButtonLabel?: string;
}
```

## Methods

- `mountComponent()`: Mounts the `<unidy-login>` web component to the DOM. This should be called once when your application loads. This is automatically called when you initialize the Auth instance.

- `auth({ silent: boolean })`: Initiates the authentication process. If `silent` is true, it attempts to authenticate without user interaction.
  - Returns a `Promise` with `{ success: true, token: string, userTokenData: object } | { success: false, error: string }`

- `logout()`: Logs the user out by clearing the session token and performing a logout request to the Unidy authentication server.
  - Returns a `Promise` with `{ success: boolean }`

- `show()`: Shows the login dialog.
  - Returns a `Promise<void>`

- `hide()`: Hides the login dialog.
  - Returns a `Promise<void>`

- `parseToken(token: string)`: Decodes a JWT token and returns its payload. Returns `null` if parsing fails.

- `validateToken(token: string)`: Validates a JWT token by decoding it and checking its expiration time.
  - Returns `boolean`

- `isAuthenticated()`: Checks if the user is currently authenticated by validating the token from session storage. If no token is found and `fallbackToSilentAuthRequest` is true, it attempts a silent login. Always returns false if storeTokenInSession is disabled.
  - Returns a `Promise<boolean>`

- `userTokenData()`: Returns the decoded user data from the token stored in session storage. Returns `null` if the token is not present or invalid. Always returns false if storeTokenInSession is disabled.

## Properties

- `idToken`: Retrieves the ID token from session storage. Returns `null` if not found or if `storeTokenInSession` is disabled.
- `isInitialized`: Returns `true` if the component is initialized (mounted with `mountComponent` to the DOM), `false` otherwise.

## Styling

