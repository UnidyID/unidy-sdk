# Unidy SDK for integrating Unidy authentication into your web

## Installation

```bash
npm install @unidy.io/auth
```

## Basis usage

```typescript
import { UnidyAuth } from '@unidy.io/auth';

// Initialize the SDK
const auth = UnidyAuth.init("https://your-auth-server.com", {
  clientId: "your-client-id",
  scope: "openid profile email",
  storeTokenInSession: true
});

// Mount the login component
auth.mountComponent();

// Init login on button click
const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', async () => {
  const result = await auth.auth();
  if (result.success) {
    console.log('Logged in successfully!');
    // Access the token
    const token = result.token;
  } else {
    console.error('Login failed:', result.error);
  }
});

// Check if user is authenticated
if (auth.isAuthenticated()) {
  // User is logged in
  const payload = auth.parseTokenPayload();
  console.log('User info:', payload);
}

// Handle logout
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', () => {
  auth.logout();
});
```

## Silent Authentication

You can start silent authentication when your app loads:

```typescript
// Try silent authentication
const result = await auth.auth(true);
if (result.success) {
  // User was silently authenticated
  console.log('Silent auth successful');
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
  - Returns a Promise with `{ success: boolean, token?: string, error?: string }`
  - Set `silentAuth` to true for silent authentication attempt

- `logout()`: Logs out the user

- `show()`: Shows the login dialog

- `hide()`: Hides the login dialog

- `isAuthenticated()`: Checks if the user is currently authenticated

- `parseTokenPayload()`: Returns the decoded JWT token payload
