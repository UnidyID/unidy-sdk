# Unidy Login SDK Integration

This README provides a quick guide on how to integrate and use the Unidy Login SDK in your web application, based on the provided HTML example.

-----

## Overview

The Unidy Login SDK simplifies the process of authenticating users with the Unidy platform. It handles the OAuth 2.0/OpenID Connect flow, including displaying the login interface (lightbox/modal) and managing tokens.

-----

## Integration Steps

Follow these steps to integrate the Unidy Login SDK into your project:

### 1\. Include the SDK Script

Add the Unidy Login SDK script to the `<head>` or before the closing `</body>` tag of your HTML file. It's recommended to place it at the end of `<body>` for better performance.

```html
<script src="/login-sdk/unidy-login.min.js"></script>
```

**Note:** The path `/login-sdk/unidy-login.min.js` assumes the SDK is hosted at this relative path on your server. Adjust this path if your `unidy-login.min.js` file is located elsewhere.

### 2\. Initialize the SDK

Instantiate the `UnidyLoginSDK.Auth` object with your Unidy server URL and client configuration. This should be done in a `<script>` block after including the SDK script.

```javascript
const Auth = new UnidyLoginSDK.Auth('YOUR_UNIDY_SERVER_URL', {
  clientId: 'YOUR_CLIENT_ID',
  scope: 'openid profile email', // Define the scopes you need
  responseType: 'id_token',
  prompt: 'login', // Optional: 'login' forces re-authentication
  maxAge: 0 // Optional: controls re-authentication prompt based on session age
})
.onAuth(handleAuth); // Define your authentication callback function
```

  * **`YOUR_UNIDY_SERVER_URL`**: Replace this with the actual URL of your Unidy authentication server (e.g., `https://qa2.staging.unidy.de`).
  * **`YOUR_CLIENT_ID`**: This is a unique identifier for your application, provided by Unidy. In the example, it's `M6MzQFuRXlSNLOos1Bcn3S5V9w0e2b209pi0c3QSkho`.
  * **`scope`**: Specifies the type of user information your application wants to access. `openid`, `profile`, and `email` are common OpenID Connect scopes.
  * **`responseType`**: Determines the type of credential returned. `id_token` is used for implicit flow.
  * **`.onAuth(handleAuth)`**: This registers a callback function (`handleAuth` in the example) that will be executed when the authentication process is complete and an ID token is received.

### 3\. Trigger the Login Flow

Attach an event listener to your login button (or any element that initiates login) to call `Auth.show()`.

```javascript
const loginButton = document.getElementById('login-button');

loginButton.addEventListener('click', () => {
  // Optional: Initialize the SDK if not already initialized (e.g., on first click)
  if (!Auth.isInitialized) {
    Auth.init();
  }
  Auth.show(); // Displays the Unidy login lightbox
});
```

### 4\. Handle Authentication Callback

Implement the `handleAuth` function (or whatever you named your callback) to process the received ID token. This is where you would typically store the token and update your UI.

```javascript
function handleAuth(idToken) {
  if (idToken) {
    // Store the ID token (e.g., in sessionStorage, localStorage, or a secure cookie)
    sessionStorage.setItem('idToken', idToken);

    // Update your UI to reflect the authenticated state
    showUserView(); // Example: hides login button, shows user info
    updateUserInfo(idToken); // Example: parses token and displays user name
    updateStatus('Authentication successful', 'success');
  } else {
    // Handle authentication failure
    updateStatus('Authentication failed: No token received', 'error');
  }
}
```

### 5\. Check Authentication Status on Load

You can check if a user is already authenticated when the page loads using `Auth.isAuthenticated()`.

```javascript
if (Auth.isAuthenticated()) {
  showUserView();
  updateStatus('Already authenticated', 'success');
  updateUserInfo(Auth.getIdToken()); // Retrieve and use the existing token
} else {
  showLoginView();
  updateStatus('Not authenticated', 'info');
}
```

-----

## Example Usage (from provided code)

The provided HTML demonstrates these steps:

  * It includes the SDK via `<script src="/login-sdk/unidy-login.min.js"></script>`.
  * It initializes the SDK with a specific `clientId` and `scope`.
  * The "Login" button triggers `Auth.show()`.
  * The `handleAuth` function processes the `idToken` and updates the UI.
  * Helper functions like `showLoginView`, `showUserView`, `updateUserInfo`, and `updateStatus` manage the display based on authentication state.
  * A `parseJwt` utility function is included to decode the ID token payload.

