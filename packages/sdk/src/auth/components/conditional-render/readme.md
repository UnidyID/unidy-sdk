# conditional-render

A simple component for conditional rendering based on auth state properties.

## Basic Syntax

```html
<conditional-render when="propertyName" is="value">
  <!-- Content to show when condition is met -->
</conditional-render>
```

## Step Conditions

```html
<!-- Show only during email step -->
<conditional-render when="step" is="email">
  <div>Enter your email</div>
</conditional-render>

<!-- Show only during verification step -->
<conditional-render when="step" is="verification">
  <div>Verify your identity</div>
</conditional-render>

<!-- Alternative helper properties -->
<conditional-render when="emailStep" is="true">
  <div>We're in email step</div>
</conditional-render>

<conditional-render when="verificationStep" is="true">
  <div>We're in verification step</div>
</conditional-render>
```

## Boolean State Conditions

```html
<!-- Show when magic code is sent -->
<conditional-render when="magicCodeSent" is="true">
  <div>Magic code was sent!</div>
</conditional-render>

<!-- Hide when magic code is sent (show OR separator) -->
<conditional-render when="magicCodeSent" is="false">
  <h3>OR</h3>
</conditional-render>

<!-- Show loading spinner -->
<conditional-render when="loading" is="true">
  <div class="loading-indicator"><u-spinner /> Loading...</div>
</conditional-render>

<!-- Show when authenticated -->
<conditional-render when="authenticated" is="true">
  <div>Welcome back!</div>
</conditional-render>
```

## Presence Conditions

```html
<!-- Show when email is entered -->
<conditional-render when="email" is="present">
  <div>Email: {authState.email}</div>
</conditional-render>

<!-- Show placeholder when password is empty -->
<conditional-render when="password" is="blank">
  <div>Please enter your password</div>
</conditional-render>

<!-- Show error message when error exists -->
<conditional-render when="error" is="present">
  <div class="error">{authState.error}</div>
</conditional-render>

<!-- Show success when token exists -->
<conditional-render when="token" is="present">
  <div class="success">Logged in successfully!</div>
</conditional-render>
```

## Using the NOT operator

```html
<!-- Invert any condition -->
<conditional-render when="loading" is="true" not>
  <button>Not loading, so show button</button>
</conditional-render>

<!-- Show when NOT authenticated -->
<conditional-render when="authenticated" is="true" not>
  <div>Please log in</div>
</conditional-render>
```

## Available Properties

**when** can be any of:
- `step` - Current auth step ("email" | "verification")
- `emailStep` - Boolean: true when in email step
- `verificationStep` - Boolean: true when in verification step
- `magicCodeSent` - Boolean: magic code sent status
- `loading` - Boolean: loading state
- `authenticated` - Boolean: authentication status
- `email` - String: email value
- `password` - String: password value
- `magicCode` - String: magic code value
- `error` - String: error message
- `sid` - String: sign-in ID
- `token` - String: JWT token
- `refreshToken` - String: refresh token

**is** can be:
- `"true"` - Property equals true (default if not specified)
- `"false"` - Property equals false
- `"present"` - Property has a value (not null/undefined/empty)
- `"blank"` - Property is null/undefined/empty
- Any string - Direct string comparison (useful for step values)

<!-- Auto Generated Below -->


## Properties

| Property            | Attribute | Description | Type                | Default     |
| ------------------- | --------- | ----------- | ------------------- | ----------- |
| `is` _(required)_   | `is`      |             | `"false" \| "true"` | `undefined` |
| `when` _(required)_ | `when`    |             | `string`            | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
