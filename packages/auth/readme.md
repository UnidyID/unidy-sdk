# Unidy Auth SDK

The Unidy Auth SDK provides a set of framework-agnostic web components to integrate Unidy authentication and profile management into your web application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start: Authentication Flow](#quick-start-authentication-flow)
- [Components](#components)
  - [Core Components](#core-components)
  - [Login Flow Components](#login-flow-components)
  - [Profile Components](#profile-components)
- [API Reference](#api-reference)
  - [Auth Class](#auth-class)
  - [Types](#types)
- [Styling](#styling)
- [Advanced Usage: `<u-raw-field>`](#advanced-usage-u-raw-field)

## Prerequisites

Before using the SDK, you must obtain a SDK API key, which currently available as a self-service option: 
Go to the Super-Admin and select the Sdk Clients option and create a new client. If you already have a
SDK client open it by clicking on it's name, the view will show the API key as last element.

If you don't have access to the Super-Admin in Unidy, please contact your Unidy representative and request
an API key, Unidy will create a SDK client for you and communicate the resulting API key securely.

## Installation

The SDK consists of two main parts: the web components and a helper `Auth` class. You need to include both in your project.

Add the following scripts to your HTML file:

```html
<!-- 1. Loads the web components (e.g., <u-signin-root>) -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/auth@latest/dist/auth/auth.esm.js"></script>

<!-- 2. Makes the Auth helper class available for use in your scripts -->
<script type="module">
  import { Auth } from 'https://cdn.jsdelivr.net/npm/@unidy.io/auth@latest/dist/index.esm.js';
  // ... use Auth class
</script>
```

## Quick Start: Authentication Flow

This example demonstrates a complete authentication flow. The SDK automatically shows the correct interface based on the user's authentication status.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unidy Auth Demo</title>
  <!-- Load Components -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/auth@latest/dist/auth/auth.esm.js"></script>
</head>
<body>

  <!-- Configure the SDK -->
  <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

  <!-- This sign-in form is automatically shown to logged-out users -->
  <u-signin-root>
    <u-signin-step name="email">
      <u-email-field placeholder="Enter your email"></u-email-field>
      <u-auth-submit-button for="email" text="Continue"></u-auth-submit-button>
    </u-signin-step>
    <u-signin-step name="verification">
      <u-signin-strategy type="password">
        <u-password-field placeholder="Enter your password"></u-password-field>
        <u-auth-submit-button for="password" text="Sign In"></u-auth-submit-button>
      </u-signin-strategy>
    </u-signin-step>
  </u-signin-root>

  <!-- 3. This profile view is automatically shown to logged-in users -->
  <u-auth-provider>
    <h2>Welcome!</h2>
    <u-profile>
      <u-field field="first_name" render-default-label="true"></u-field>
      <u-field field="last_name" render-default-label="true"></u-field>
      <u-profile-submit-button>Save Changes</u-profile-submit-button>
    </u-profile>
    <u-logout-button>Sign Out</u-logout-button>
  </u-auth-provider>

</body>
</html>
```

## Components

### Core Components

#### `<u-config>`

This required component configures the SDK with your Unidy instance details.

**Attributes:**

-   `base-url` (required): The base URL of your Unidy instance.
-   `api-key` (required): Your application's API key.

#### `<u-auth-provider>`

This component acts as a gatekeeper for authenticated content. It automatically renders its child elements if the user has a valid session, and hides them otherwise. All components that require an authenticated context, such as `<u-profile>`, must be placed inside it.

#### `<u-signin-root>`

Renders a complete sign-in and registration flow. This component is automatically displayed for logged-out users and hidden once a session is established.

**Events:**

-   `authEvent`: Fired on successful authentication. `event.detail` contains the authentication payload.
-   `errorEvent`: Fired on authentication failure. `event.detail.error` contains the error code.

### Login Flow Components

These components are used within `<u-signin-root>` to construct the login experience.

#### `<u-signin-step>`

Defines a distinct step in the sign-in process (e.g., entering an email, entering a password).

**Attributes:**

-   `name` (required): The name of the step (e.g., `email`, `verification`).

#### `<u-signin-strategy>`

Defines a specific authentication method within a `verification` step.

**Attributes:**

-   `type` (required): The strategy type (`password` or `magic-code`).

#### `<u-email-field>`

Renders a pre-configured input for the user's email address.

#### `<u-password-field>`

Renders a pre-configured input for the user's password.

#### `<u-magic-code-field>`

Renders a specialized input for the one-time magic code.

#### `<u-error-message>`

Displays validation errors for a specific field or for general errors.

**Attributes:**

-   `for` (required): The name of the field this message is for (e.g., `email`, `password`, `magicCode`, `general`).

#### `<u-send-magic-code-button>`

Renders a button that triggers sending a magic code to the user's email.

#### `<u-reset-password-button>`

Renders a button that initiates the password reset flow.

#### `<u-conditional-render>`

A utility component that renders its children only when a specific condition is met.

**Attributes:**

-   `when` (required): The name of the state variable to check (e.g., `magicCodeSent`).
-   `is` (required): The value the state variable should have for the content to be rendered (e.g., `true` or `false`).

### Profile Components

#### `<u-profile>`

This component renders a form for users to view and edit their profile data. It must be placed inside a `<u-auth-provider>`.

#### `<u-field>`

Used within `<u-profile>` to render a field for a specific user attribute. This component automatically handles rendering the correct input type (e.g., text input, select, radio) based on the attribute's definition in Unidy.

**Attributes:**

-   `field` (required): The name of the user attribute (e.g., `first_name`, `custom_attributes.my_attr`).
-   `render-default-label`: Set to `true` to automatically display a label based on the attribute's name.

#### `<u-profile-submit-button>`

Renders a button to submit changes made in the parent `<u-profile>` component. It must be placed inside a `<u-profile>` element.

#### `<u-logout-button>`

This component renders a button that, when clicked, logs the user out.

## API Reference

### Auth Class

The `Auth` class provides programmatic access to authentication state and methods.

#### `Auth.getInstance(): Promise<Auth>`

Returns a singleton promise-based instance of the `Auth` class.

#### `Auth.Errors`

A static object containing constants for known error codes that can be returned during the sign-in process. This is useful for handling specific failures, such as `Auth.Errors.email.NOT_FOUND`.

#### `auth.isAuthenticated(): Promise<boolean>`

Checks if the user has a valid, non-expired token. If the token is expired, it will automatically attempt to refresh it using the stored refresh token. Returns `true` if a valid token exists or was successfully refreshed.

#### `auth.getToken(): Promise<string | AuthError>`

Retrieves the current JWT access token. If the token is expired, it automatically attempts to refresh it. This ensures that any backend request made with this token is always using a valid token if a refresh is possible.

#### `auth.userData(): Promise<TokenPayload | null>`

Retrieves the decoded user data from the JWT. This method also benefits from the automatic token refresh, ensuring the data is from a valid session.

#### `auth.getEmail(): string | null`

Returns the email address that was used during the sign-in flow.

#### `auth.logout(): Promise<boolean | AuthError>`

Logs the user out by invalidating the session and clearing all stored tokens.

### Types

#### `TokenPayload`

An object representing the decoded JWT payload. It contains standard claims like `sub` (the Unidy user ID), `exp` (expiration time), and `email`, as well as any custom claims configured in your Unidy instance.

#### `AuthError`

An error object returned on failed authentication operations. It includes a `code` property with a specific error identifier (e.g., `REFRESH_FAILED`) and a `requiresReauth` boolean indicating if the user needs to sign in again.

## Styling

The components are designed to be styled with utility-first CSS frameworks like Tailwind CSS. You can pass classes directly to the components using the `class-name` attribute.

For more advanced customization, you can target internal elements using CSS Shadow Parts (`::part`).

**Example using `class-name`:**

```html
<u-email-field 
  placeholder="Enter your email"
  class-name="px-4 py-2 border border-gray-300 rounded-lg w-full">
</u-email-field>
```

**Example using `::part`:**

```css
u-field::part(input_field) {
  border-color: #0055fe;
  background: #f0f8ff;
}
```

## Advanced Usage: `<u-raw-field>`

While the `<u-field>` component is recommended for most use cases, the `<u-raw-field>` component is available for situations that require complete control over the form field's layout and styling. It renders a bare, unstyled input element (`<input>`, `<select>`, etc.) without a label or any surrounding structure.

This component is best used when you need to integrate with a design system or achieve a custom layout that `<u-field>` cannot accommodate.

**Attributes:**

-   `field` (required): The name of the user attribute.
-   `type`: The input type (e.g., `text`, `tel`, `radio`, `checkbox`, `select`).

**Example:**

```html
<label for="phone_number" class="my-custom-label-class">
  Phone Number
</label>
<u-raw-field
  field="phone_number"
  type="tel"
  placeholder="Enter your phone number"
  class-name="my-custom-input-class">
</u-raw-field>
```
