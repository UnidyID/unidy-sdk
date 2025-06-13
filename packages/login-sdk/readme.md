# Unidy SDK for integrating Unidy authentication into your web

## Installation

```bash
npm install @unidy.io/auth
```

## Basic Usage

### Example: SDK-managed Token Storage

When `storeTokenInSession` is set to `true`, the SDK automatically handles token storage in session storage:

```typescript
import { UnidyAuth } from '@unidy.io/auth';

// Initialize the SDK with automatic token storage
const unidyAuth = UnidyAuth.init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email",
  storeTokenInSession: true
});

// Mount the login component
unidyAuth.mountComponent();

// Init login on button click
const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', async () => {
  const result = await unidyAuth.auth();
  if (result.success) {
    console.log('Logged in successfully!');
    try {
      const userData = unidyAuth.userTokenData();
      const userName = userData.name || userData.email;
      console.log('Welcome back,', userName);
    } catch (error) {
      console.log('Error getting user data:', error);
    }
  } else {
    console.error('Login failed:', result.error);
  }
});

// Check if user is authenticated
if (unidyAuth.isAuthenticated()) {
  try {
    const userData = unidyAuth.userTokenData();
    console.log('User data:', userData);
  } catch (error) {
    console.log('Error getting user data:', error);
  }
}

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

### Example: Custom Token Storage

When `storeTokenInSession` is set to `false`, you can handle token storage yourself:

```typescript
import { UnidyAuth } from '@unidy.io/auth';

// Initialize the SDK without automatic token storage
const auth = UnidyAuth.init("https://your-unidy-instance-url.com", {
  clientId: "your-client-id",
  scope: "openid profile email",
  storeTokenInSession: false
});

// Mount the login component
unidyAuth.mountComponent();

// Custom token storage functions
const storeToken = (token: string) => {
  // Store token in your preferred storage
  localStorage.setItem('auth_token', token);
};

const getToken = () => {
  // Retrieve token from your storage
  return localStorage.getItem('auth_token');
};

const removeToken = () => {
  // Remove token from your storage
  localStorage.removeItem('auth_token');
};

// Init login on button click
const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', async () => {
  const result = await unidyAuth.auth();
  if (result.success) {
    console.log('Logged in successfully!');
    // Store the token yourself
    storeToken(result.token);

    // Get user data from the token
    try {
      const userData = unidyAuth.userTokenData();
      const userName = userData.name || userData.email || 'User';
      console.log('Welcome back,', userName);
    } catch (error) {
      console.log('Error getting user data:', error);
    }
  } else {
    console.error('Login failed:', result.error);
  }
});

// Check if user is authenticated
const token = getToken();
if (token) {
  // Verify token is still valid
  if (unidyAuth.isAuthenticated()) {
    try {
      const userData = unidyAuth.userTokenData();
      console.log('User data:', userData);
    } catch (error) {
      console.log('Error getting user data:', error);
    }
  } else {
    // Token is invalid or expired
    removeToken();
  }
}

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

## Silent Authentication

You can start silent authentication when your app loads:

```typescript
// Try silent authentication
const result = await unidyAuth.auth({ silent: true })
if (result.success) {
  // User was silently authenticated
  console.log('Silent auth successful');
  try {
    const userData = unidyAuth.userTokenData();
    console.log('User data:', userData);
  } catch (error) {
    console.log('Error getting user data:', error);
  }
} else {
  // Silent auth failed, user needs to log in manually
  console.log('Silent auth failed:', result.error);
}
```

## Notes
- The SDK can store the authentication token in the browser's session storage. This is controlled by the `storeTokenInSession` configuration option. If you disable this you can handle token storage on your own if needed.
- Tokens are automatically validated for expiration
- Silent authentication is supported for seamless user experience

## Configuration Options

```typescript
interface UnidyAuthConfig {
  clientId: string;           // Required: Your application's client ID
  scope?: string;             // Optional: OAuth scopes (default: "openid email")
  responseType?: string;      // Optional: Response type (default: "id_token")
  prompt?: string;            // Optional: Prompt parameter for auth
  redirectUrl?: string;       // Optional: Redirect URL (default: window.location.origin)
  storeTokenInSession: boolean; // Required: Whether to store token in session storage
}
```

## Methods

- `auth(silentAuth?: boolean)`: Initiates the authentication process
  - Returns a Promise with `{ success: true, token: string} | { success: false, error: string }`
  - Set `silentAuth` to true for silent authentication attempt

- `logout()`: Logs out the user
  - Returns a Promise with `{ success: boolean }`

- `show()`: Shows the login dialog

- `hide()`: Hides the login dialog

- `isAuthenticated()`: Checks if the user is currently authenticated

- `userTokenData()`: Returns the decoded user data from the token
  - Throws an error if token is invalid or not available

