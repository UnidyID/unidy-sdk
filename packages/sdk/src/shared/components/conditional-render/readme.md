# u-conditional-render

A flexible component for conditional rendering based on application state (auth, newsletter, profile).

## Basic Syntax

```html
<u-conditional-render when="namespace.condition">
  <!-- Content to show when condition is met -->
</u-conditional-render>
```

## Authentication Conditions

### Login Options

```html
<!-- Show passkey login button -->
<u-conditional-render when="auth.passkeyEnabled">
  <button>Login with Passkey</button>
</u-conditional-render>

<!-- Show password field -->
<u-conditional-render when="auth.passwordEnabled">
  <input type="password" placeholder="Password" />
</u-conditional-render>

<!-- Show magic link option -->
<u-conditional-render when="auth.magicCodeEnabled">
  <button>Send Magic Code</button>
</u-conditional-render>

<!-- Show social login buttons -->
<u-conditional-render when="auth.socialLoginsEnabled">
  <div class="social-logins">
    <!-- Social login buttons -->
  </div>
</u-conditional-render>
```

### Auth State

```html
<!-- Show loading spinner -->
<u-conditional-render when="auth.loading">
  <div class="loading-indicator">
    <u-spinner></u-spinner>
    <span>Loading...</span>
  </div>
</u-conditional-render>

<!-- Show when authenticated -->
<u-conditional-render when="auth.authenticated">
  <div>Welcome back!</div>
</u-conditional-render>

<!-- Show when NOT authenticated -->
<u-conditional-render when="auth.authenticated" not>
  <div>Please log in</div>
</u-conditional-render>
```

### Magic Code & Password Reset

```html
<!-- Show when magic code is sent -->
<u-conditional-render when="auth.magicCodeSent">
  <div>Magic code was sent to your email!</div>
</u-conditional-render>

<!-- Show when magic code is requested but not yet sent -->
<u-conditional-render when="auth.magicCodeRequested">
  <div>Sending magic code...</div>
</u-conditional-render>

<!-- Show when password reset email is sent -->
<u-conditional-render when="auth.resetPasswordSent">
  <div>Password reset email sent!</div>
</u-conditional-render>

<!-- Show when password reset is requested but not yet sent -->
<u-conditional-render when="auth.resetPasswordRequested">
  <div>Sending password reset email...</div>
</u-conditional-render>
```

## Newsletter Conditions

```html
<!-- Show when user has checked at least one newsletter -->
<u-conditional-render when="newsletter.hasCheckedNewsletters">
  <button>Subscribe to selected newsletters</button>
</u-conditional-render>

<!-- Show when user has a preference token -->
<u-conditional-render when="newsletter.hasPreferenceToken">
  <div>Manage your subscriptions</div>
</u-conditional-render>

<!-- Show when user is logged in (authenticated or has preference token) -->
<u-conditional-render when="newsletter.loggedIn">
  <div>Your newsletter preferences</div>
</u-conditional-render>

<!-- Check if subscribed to specific newsletter -->
<u-conditional-render when="newsletter.subscribed" is="weekly-digest">
  <span>✓ Subscribed</span>
</u-conditional-render>

<!-- Check if subscription is confirmed -->
<u-conditional-render when="newsletter.confirmed" is="weekly-digest">
  <span>✓ Confirmed</span>
</u-conditional-render>
```

## Profile Conditions

```html
<!-- Show when profile is loading -->
<u-conditional-render when="profile.loading">
  <u-spinner></u-spinner>
</u-conditional-render>

<!-- Show when profile has errors -->
<u-conditional-render when="profile.hasErrors">
  <div class="error">Please fix the errors below</div>
</u-conditional-render>

<!-- Show when profile has flash errors (temporary errors) -->
<u-conditional-render when="profile.hasFlashErrors">
  <div class="flash-error">An error occurred</div>
</u-conditional-render>

<!-- Show when phone number is valid -->
<u-conditional-render when="profile.phoneValid">
  <span class="validation-success">✓ Valid phone number</span>
</u-conditional-render>

<!-- Show when profile has data -->
<u-conditional-render when="profile.hasData">
  <div>Profile loaded successfully</div>
</u-conditional-render>
```

## Using the `is` Attribute

The `is` attribute allows you to specify expected values or comparison modes:

```html
<!-- Boolean comparison (default behavior) -->
<u-conditional-render when="auth.loading" is="true">
  <div>Loading...</div>
</u-conditional-render>

<!-- Inverted boolean -->
<u-conditional-render when="auth.loading" is="false">
  <div>Not loading</div>
</u-conditional-render>

<!-- String comparison (for newsletter/custom values) -->
<u-conditional-render when="newsletter.subscribed" is="weekly-digest">
  <span>Subscribed to Weekly Digest</span>
</u-conditional-render>

<!-- Alternative: using "enabled" or "disabled" -->
<u-conditional-render when="auth.passkeyEnabled" is="enabled">
  <button>Use Passkey</button>
</u-conditional-render>
```

## Using the `not` Attribute

The `not` attribute inverts any condition:

```html
<!-- Show when NOT loading -->
<u-conditional-render when="auth.loading" not>
  <button>Submit</button>
</u-conditional-render>

<!-- Show when NOT authenticated -->
<u-conditional-render when="auth.authenticated" not>
  <div>Please log in to continue</div>
</u-conditional-render>

<!-- Show when passkey is NOT enabled -->
<u-conditional-render when="auth.passkeyEnabled" not>
  <div>Passkey login is not available</div>
</u-conditional-render>
```

## Available Conditions

### Auth Namespace

| Condition | Type | Description |
|-----------|------|-------------|
| `auth.passkeyEnabled` | Boolean | Passkey login is available |
| `auth.passwordEnabled` | Boolean | Password login is available |
| `auth.magicCodeEnabled` | Boolean | Magic code/link login is available |
| `auth.socialLoginsEnabled` | Boolean | Social login options are available |
| `auth.loading` | Boolean | Auth operation in progress |
| `auth.authenticated` | Boolean | User is authenticated |
| `auth.magicCodeSent` | Boolean | Magic code has been sent or requested |
| `auth.magicCodeRequested` | Boolean | Magic code send is in progress |
| `auth.resetPasswordSent` | Boolean | Password reset email has been sent or requested |
| `auth.resetPasswordRequested` | Boolean | Password reset send is in progress |

### Newsletter Namespace

| Condition | Type | Description |
|-----------|------|-------------|
| `newsletter.hasCheckedNewsletters` | Boolean | At least one newsletter is checked |
| `newsletter.hasPreferenceToken` | Boolean | User has a preference token |
| `newsletter.loggedIn` | Boolean | User is authenticated or has preference token |
| `newsletter.subscribed` | Function | Check if subscribed to specific newsletter (requires `is` attribute) |
| `newsletter.confirmed` | Function | Check if subscription is confirmed (requires `is` attribute) |

### Profile Namespace

| Condition | Type | Description |
|-----------|------|-------------|
| `profile.loading` | Boolean | Profile operation in progress |
| `profile.hasErrors` | Boolean | Profile has validation errors |
| `profile.hasFlashErrors` | Boolean | Profile has temporary flash errors |
| `profile.phoneValid` | Boolean | Phone number is valid |
| `profile.hasData` | Boolean | Profile data is loaded |

## Advanced: Custom Condition Functions

For complex logic, you can pass a custom function via the `conditionFunction` prop (programmatic use only):

```typescript
const customCondition = (state: AuthState) => {
  return state.authenticated && state.email?.includes('@company.com');
};

// In JSX/TSX:
<u-conditional-render conditionFunction={customCondition}>
  <div>Company employee detected</div>
</u-conditional-render>
```

<!-- Auto Generated Below -->


## Properties

| Property            | Attribute | Description | Type                            | Default     |
| ------------------- | --------- | ----------- | ------------------------------- | ----------- |
| `conditionFunction` | --        |             | `(state: AuthState) => boolean` | `undefined` |
| `is`                | `is`      |             | `string`                        | `undefined` |
| `not`               | `not`     |             | `boolean`                       | `false`     |
| `when`              | `when`    |             | `string`                        | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*