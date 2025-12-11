# Unidy SDK

The Unidy SDK provides a set of framework-agnostic web components to integrate Unidy newsletters, tickets and subscriptions, authentication and profile management into your web application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start: Examples](#quick-start-examples)
  - [Quick Start: Authentication Flow](#quick-start-authentication-flow)
  - [Quick Start: Newsletter implementation](#quick-start-newsletter-implementation)
  - [Quick Start: Ticket implementation](#quick-start-ticket-implementation)
- [Components](#components)
  - [Core Components](#core-components)
  - [Login Flow Components](#login-flow-components)
  - [Profile Components](#profile-components)
  - [Newsletter Components](#newsletter-components)
  - [Ticket Components](#ticket-components)
- [API Reference](#api-reference)
  - [Auth Class](#auth-class)
  - [Types](#types)
- [Styling](#styling)
- [Internationalization (i18n)](#internationalization-i18n)
- [Advanced Usage: `<u-raw-field>`](#advanced-usage-u-raw-field)

## Prerequisites

Before using the SDK, you must obtain an SDK API key, which is currently available as a self-service option:
Go to the Super-Admin and select the "SDK Clients" option and create a new client. If you already have an
SDK client open it by clicking on it's name, the view will show the API key as last element.

If you don't have access to the Super-Admin in Unidy, please contact your Unidy representative and request
an API key, Unidy will create an SDK client for you and communicate the resulting API key securely.

## Installation

The SDK can be included directly in your HTML via a CDN or installed via a package manager like npm or yarn.

### Using a CDN

The SDK consists of two main parts: the web components and a helper `Auth` class. You need to include both in your project.

Add the following scripts to your HTML file:

```html
<!-- 1. Loads the web components (e.g., <u-signin-root>) -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.css"></link>

<!-- 2. Makes the Auth helper class available for use in your scripts -->
<script type="module">
  import { Auth } from 'https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/index.esm.js';
  // ... use Auth class
</script>
```

### Using a Package Manager

If you are using a build system like Webpack or Rollup, you can install the SDK via npm or yarn:

```bash
npm install @unidy.io/sdk
# or
yarn add @unidy.io/sdk
```

Then, you can import the necessary parts into your application:

```javascript
// 1. Import and define the web components
import { defineCustomElements } from '@unidy.io/sdk/loader';
defineCustomElements();

// 2. Import the Auth helper class
import { Auth } from '@unidy.io/sdk/auth';

// Now you can use the components in your HTML and the Auth class in your scripts.
```

## Quick Start: Examples


### Quick Start: Authentication Flow

This example demonstrates a complete authentication flow. The SDK automatically shows the correct interface based on the user's authentication status.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unidy Auth Demo</title>
  <!-- Load Components -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@1.0.0-alpha.1/dist/sdk/sdk.esm.js"></script>
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
    <div class="flex flex-col w-full space-y-4">
      <div class="flex items-center my-4">
        <div class="flex-1 border-t border-gray-300"></div>
        <h3 class="px-3 text-gray-600 font-medium">OR</h3>
        <div class="flex-1 border-t border-gray-300"></div>
      </div>

      <u-social-login-button text="Continue with Google" provider="google" theme="dark"></u-social-login-button>
      <u-social-login-button text="Continue with LinkedIn" provider="linkedin"></u-social-login-button>
      <u-social-login-button text="Continue with Unidy" provider="unidy" theme="dark" icon-only="true">
        <img slot="icon" src="https://www.unidy.io/unidy-logo-white.svg" alt="Unidy Logo" class="w-20 h-6" />
      </u-social-login-button>
    </div>
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

  <!-- These are alternative implementations of the profile: -->

  <!-- 3.1 Full Profile Component: You can define specific fields. -->
  <u-auth-provider>
    <div class="mb-6">
      <u-logout-button text="Logout"
        class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
      </u-logout-button>
      <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
      <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
    </div>
    <u-full-profile language="en" fields="first_name,last_name,custom_attributes.your_custom_attribute_name" country-code-display-option="icon"></u-full-profile>
  </u-auth-provider>

  <!-- 3.2  If no fields are provided, the entire profile will be displayed. -->
   <u-auth-provider>
    <div class="mb-6">
      <u-logout-button text="Logout"
        class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
      </u-logout-button>
      <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
      <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
    </div>
    <u-full-profile language="en" country-code-display-option="icon"></u-full-profile>
   </u-auth-provider>

</body>
</html>
```
### Quick Start: Newsletter implementation

This example demonstrates how to implement a newsletter subscription form using the Unidy SDK.

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
  <title>Newsletter Signup</title>

  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@1.0.0-alpha.1/dist/sdk/sdk.esm.js"></script>
  <script nomodule src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@1.0.0-alpha.1/dist/sdk/sdk.js"></script>
</head>

<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
  <div class="bg-white/90 shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
    <div class="flex flex-col items-center gap-2">
      <h1 class="text-3xl font-bold text-indigo-700">Subscribe to our Newsletter</h1>
    </div>

    <email-field placeholder="Enter your email" class-name="px-4 py-2 border border-gray-300 rounded-lg"></email-field>

    <div class="flex flex-col gap-2">
      <label class="text-gray-500 text-sm">Select newsletters</label>
      <newsletter-checkbox label="Newsletter" internal-name="internal-name-for-newsletter" checked="true"
        class-name="flex items-center gap-2"></newsletter-checkbox>
      <submit-button api-key="your-api-key" api-url="https://your-unidy-instance.com"
        class-name="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow transition border border-indigo-600 mt-4">
        <span>Subscribe</span>
      </submit-button>

      <div id="message-container" class="mt-4 text-center text-sm"></div>
    </div>
</body>
</html>
```
### Quick Start: Ticket implementation

Ticket implementation documentation is under development and will be available in a future release.

## Components

### Core Components

#### `<u-config>`

This required component configures the SDK with your Unidy instance details.

**Attributes:**

-   `base-url` (required): The base URL of your Unidy instance.
-   `api-key` (required): Your application's API key.
-   `mode`: The mode of the SDK. Can be `production` or `development`. Defaults to `production`.
-   `locale`: The language to use for the SDK. Defaults to `en`.
-   `fallback-locale`: The fallback language to use if a translation is not available in the current locale. Defaults to `en`.
-   `custom-translations`: A JSON string or object containing custom translations. See the [Internationalization (i18n)](#internationalization-i18n) section for more details.

#### `<u-auth-provider>`

This component acts as a gatekeeper for authenticated content. It automatically renders its child elements if the user has a valid session, and hides them otherwise. All components that require an authenticated context, such as `<u-profile>`, must be placed inside it.

**Attributes:**

- `class-name`: A string of classes to pass to the host element.

#### `<u-signin-root>`

Renders a complete sign-in and registration flow. This component is automatically displayed for logged-out users and hidden once a session is established.

**Attributes:**

- `class-name`: A string of classes to pass to the host element.

**Events:**

-   `authEvent`: Fired on successful authentication. `event.detail` contains the authentication payload.
-   `errorEvent`: Fired on authentication failure. `event.detail.error` contains the error code.

#### `<u-flash-message>`

Displays a temporary message to the user, such as success, error, or informational messages.

**Attributes:**

-   `message` (required): The text content of the message to display.
-   `variant`: The type of message, which affects its styling. Can be `error`, `success`, or `info`. Defaults to `info`.

#### `<u-spinner>`

A flexible, reusable spinner component for indicating loading states. It is designed to be used inside other components (e.g., a submit button) to show that an action is in progress.

The spinner's size and colors can be customized via CSS Custom Properties.

**CSS Custom Properties:**

-   `--u-spinner-font-size`: The size of the spinner (e.g., `20px`).
-   `--spinner-color-primary`: The color of the main rotating part of the spinner.
-   `--spinner-color-secondary`: The color of the track (the non-moving part).

### Login Flow Components

These components are used within `<u-signin-root>` to construct the login experience.

#### `<u-signin-step>`

Defines a distinct step in the sign-in process (e.g., entering an email, entering a password).

**Attributes:**

-   `name` (required): The name of the step (e.g., `email`, `verification`, `missing-fields`).
-   `always-render`: If set to `true`, the step will always render its content regardless of the current authentication step.

#### `<u-passkey>`

Renders a button that initiates passkey authentication.

**Attributes:**
-   `text`: The text to display on the button. Defaults to "Sign in with Passkey".
-   `loading-text`: The text to display on the button while authenticating. Defaults to "Authenticating..."
-   `class-name`: A string of classes to pass to the button.

#### `<u-signin-strategy>`

Defines a specific authentication method within a `verification` step.

**Attributes:**

-   `type` (required): The strategy type (`password` or `magic-code`).
-   `class-name`: A string of classes to pass to the host element.

#### `<u-email-field>`

Renders a pre-configured input for the user's email address.

**Attributes:**

- `placeholder`: The placeholder text for the input field. Defaults to "Enter your email".
- `class-name`: A string of classes to pass to the input field.

#### `<u-password-field>`

Renders a pre-configured input for the user's password.

**Attributes:**

- `placeholder`: The placeholder text for the input field. Defaults to "Enter your password".
- `class-name`: A string of classes to pass to the input field.

#### `<u-magic-code-field>`

Renders a specialized input for the one-time magic code.

**Attributes:**

- `class-name`: A string of classes to pass to the input field.

#### `<u-missing-field>`

Renders a list of input fields for collecting additional required fields during sign-in. It must be placed inside a `<u-signin-step name="missing-fields">` element.

**Note:**

`<u-missing-field>` renders one or more `<u-field>` components internally. To style the input fields, use the styling options and shadow parts available for `<u-field>`. See the [Styling](#styling) section and the [`<u-field>`](#u-field) documentation for details.

#### `<u-missing-fields-submit-button>`

Renders a button to submit changes made in the `<u-missing-field>` component. It must be placed below a `<u-missing-field>` element.

#### `<u-error-message>`

Displays validation errors for a specific field or for general errors.

**Attributes:**

-   `for` (required): The name of the field this message is for (e.g., `email`, `password`, `magicCode`, `general`).
- `class-name`: A string of classes to pass to the error message container.
- `error-messages`: A JSON object mapping error codes to custom error messages.

#### `<u-send-magic-code-button>`

Renders a button that triggers sending a magic code to the user's email. After a code is sent, the button enters a countdown state, preventing the user from requesting another code until the timer finishes, the duration of this timer is controlled by the backend.

**Attributes:**

-   `disabled`: If set to `true`, the button will be disabled.
-   `text`: The text to display on the button. Defaults to "Send Magic Code".
-   `already-sent-text`: The text to display after the magic code has been sent. Defaults to "Magic code already sent to your email".
-   `class-name`: A string of classes to pass to the button.

#### `<u-reset-password-button>`

Renders a button that initiates the password reset flow.

**Attributes:**

-   `text`: The text to display on the button. Defaults to "Reset Password".
-   `success-message`: The message to display after the password reset email has been sent. Defaults to "Password reset email sent. Please check your inbox".
-   `class-name`: A string of classes to pass to the button.

#### `<u-social-login-button>`

Renders a button for logging in with a social provider.

**Attributes:**

-   `provider` (required): The social provider to use (`google`, `linkedin`, `apple`, `facebook`, `discord`, `unidy`).
-   `text`: The text to display on the button.
-   `theme`: The theme of the button (`light` or `dark`). Defaults to `light`.
-   `icon-only`: If set to `true`, the button will only display the provider's icon.
-   `redirectUri`: location to with redirect after successful login (default: current page)

**Slots:**

-   `icon`: Allows you to provide a custom SVG or `<img>` tag to be used as the button's icon. This is useful for custom providers.

#### `<u-auth-submit-button>`

Renders a button to submit the current sign-in step.

**Attributes:**

- `for` (required): The step the button is for (`email` or `password`).
- `text`: The text to display on the button.
- `disabled`: If set to `true`, the button will be disabled.
- `class-name`: A string of classes to pass to the button.

#### `<u-conditional-render>`

A utility component that renders its children only when a specific condition is met. You can use either the `when` attribute with predefined states or a custom `conditionFunction` for more complex logic.

**Attributes:**

- `when`: The name of a predefined state to check. Available states:
  - `passkeyEnabled` - True if passkey login is enabled
  - `passwordEnabled` - True if password login is enabled
  - `magicCodeEnabled` - True if magic code login is enabled
  - `socialLoginsEnabled` - True if any social login providers are enabled
  - `loading` - True while an auth operation is in progress
  - `authenticated` - True if the user is authenticated
  - `magicCodeSent` - True if a magic code has been sent or requested
  - `magicCodeRequested` - True if a magic code has been requested
  - `resetPasswordSent` - True if a password reset has been sent or requested
  - `resetPasswordRequested` - True if a password reset has been requested
- `is`: Optional value the state variable should have for the content to be rendered. Accepts `"true"`, `"enabled"`, `"false"`, `"disabled"`, or an exact value to compare.
- `not`: If set to `true`, inverts the condition result. Defaults to `false`.
- `conditionFunction`: A custom function assigned **as a JavaScript property** (not as an HTML attribute) that receives the full `AuthState` and returns a boolean. Use this for custom conditional logic.

> **Note:** Either `when` or `conditionFunction` must be provided.

**Slots:**

- The default slot allows you to provide the content to be rendered conditionally.

**Example: Using predefined states**

```html
<u-conditional-render when="authenticated">
  <p>Welcome back!</p>
</u-conditional-render>

<u-conditional-render when="magicCodeSent" is="false">
  <u-send-magic-code-button text="Send Magic Code"></u-send-magic-code-button>
</u-conditional-render>

<u-conditional-render when="loading" not>
  <p>Content shown when not loading</p>
</u-conditional-render>
```

**Example: Using conditionFunction**

```html
<u-conditional-render id="valid-email-indicator">
  <span class="text-green-600">✓ Valid email entered</span>
</u-conditional-render>

<script>
  // Use 'appload' event - fired by Stencil when components are fully hydrated
  window.addEventListener("appload", () => {
    const el = document.getElementById('valid-email-indicator');
    if (el) {
      el.conditionFunction = (state) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(state.email);
      };
    }
  });
</script>
```

### Profile Components

#### `<u-full-profile>`

This component renders a complete profile form that allows users to view and edit their profile data. It also includes the `<u-submit-button>`. The component must be placed inside a `<u-auth-provider>`. Internally, it renders one or more `<u-field>` components. To style the input fields, use the styling options and shadow parts available for `<u-field>`. See the [Styling](#styling) section and the [`<u-field>`](#u-field) documentation for details.

**Attributes:**

- `language`: The language to use for profile data.
- `country-code-display-option`: How to display country codes in a select field. Can be `icon` or `label`. Defaults to `label`.
- `fields`: A comma-separated string specifying which fields should be returned instead of the full profile.
- `submit-button-text`: The button text for the button.


#### `<u-profile>`

This component renders a form for users to view and edit their profile data. It must be placed inside a `<u-auth-provider>`.

**Attributes:**

-   `profileId`: An optional ID for the profile.
-   `initialData`: Initial profile data, either as a JSON string or a JavaScript object.
-   `apiUrl`: The API URL for profile operations.
-   `apiKey`: The API key for profile operations.
-   `language`: The language to use for profile data.

**Slots:**

- The default slot allows you to provide the content to be rendered within the profile component.

#### `<u-field>`

Used within `<u-profile>` to render a field for a specific user attribute. This component automatically handles rendering the correct input type (e.g., text input, select, radio) based on the attribute's definition in Unidy.

**Attributes:**

-   `field` (required): The name of the user attribute (e.g., `first_name` or even `custom_attributes.my_attr`).
-   `render-default-label`: Set to `false` to display a custom label which you need to provide.
-   `required`: If set to `true`, the field will be marked as required.
-   `readonly-placeholder`: The text to display for a readonly field that has no value.
-   `country-code-display-option`: How to display country codes in a select field. Can be `icon` or `label`. Defaults to `label`.
-   `invalid-phone-message`: The error message to display for an invalid phone number.
-   `class-name`: A string of classes to pass to the input field.
-   `empty-option`: If set to `true`, an empty option will be added to select fields.
-   `placeholder`: The placeholder text for the input field.
-   `pattern`: A custom regular expression (string) used to validate the field value.
-   `patternErrorMessage`: A custom message shown when the `pattern` validation fails.
-   `validationFunc`:   A custom validation function that you assign **as a JavaScript property** on the element instance (not as an HTML attribute).
  This allows you to implement field-specific validation logic (e.g. age checks, cross-field validation, external business rules).
  The function must return `{ valid: boolean, message: string }`.
  If it throws an error, the component logs it but does not block the user.

**Example: Custom validation**

```html
  <script>
    // Custom validation function for date_of_birth
    function dateOfBirthValidation(value) {
      // logic

      return age >= 18
        ? { valid: true, message: "" }
        : { valid: false, message: "You must be at least 18 years old." };
    }

    window.addEventListener("DOMContentLoaded", () => {
      const field = document.querySelector('u-field[field="date_of_birth"]');
      if (field) {
        field.validationFunc = dateOfBirthValidation;
      }
    });
  </script>
```

**Slots:**

-   `label`: Allows you to provide a custom label for the field.

#### `<u-profile-submit-button>`

Renders a button to submit changes made in the parent `<u-profile>` component. It must be placed inside a `<u-profile>` element.

**Attributes:**

- `disabled`: If set to `true`, the button will be disabled.

**Slots:**

- The default slot allows you to provide the button's text content.

#### `<u-logout-button>`

This component renders a button that, when clicked, logs the user out.

**Attributes:**

- `text`: The text to display on the button. Defaults to "Logout".
- `class-name`: A string of classes to pass to the button.
- `reload-on-success`: If set to `true`, the page will reload after a successful logout. Defaults to `true`.

**Events:**

- `logout`: Fired on successful logout.

### Newsletter Components

#### `<email-field>`

Renders a pre-configured input for the user's email address.

**Attributes:**
-   `placeholder`: The placeholder text for the input field. Defaults to `Enter your email`.
-   `class-name`: A string of classes to pass to the input field.

#### `<newsletter-checkbox>`

Renders a checkbox for subscribing to a specific newsletter.

**Attributes:**
-   `label` (required): The label to display next to the checkbox.
-   `internal-name` (required): The internal name of the newsletter in Unidy.
-   `checked` (required): If set to `true`, the checkbox will be checked by default.
-   `class-name`: A string of classes to pass to the checkbox container.


#### `<submit-button>`

Renders a button to submit the newsletter subscription form.

**Attributes**
-   `api-url` (required): `"https://your-unidy-instance.com"`
-   `api-key` (required): `"your-api-key"`
-   `class-name`: A string of classes to pass to the button.

### Ticket Components

Ticket component documentation is under development and will be available in a future release.

## API Reference

### Auth Class

The `Auth` class provides programmatic access to authentication state and methods.

#### `Auth.getInstance(): Promise<Auth>`

Returns a singleton promise-based instance of the `Auth` class.

#### `Auth.Errors`

A static object containing constants for known error codes that can be returned during the sign-in process. This is useful for handling specific failures.

The available error codes are:

-   `email`:
    -   `NOT_FOUND`: "account_not_found"
-   `magicCode`:
    -   `RECENTLY_CREATED`: "magic_code_recently_created"
    -   `NOT_VALID`: "magic_code_not_valid"
    -   `EXPIRED`: "magic_code_expired"
    -   `USED`: "magic_code_used"
-   `password`:
    -   `INVALID`: "invalid_password"
    -   `NOT_SET`: "password_not_set"
    -   `RESET_PASSWORD_ALREADY_SENT`: "reset_password_already_sent"
-   `general`:
    -   `ACCOUNT_LOCKED`: "account_locked"
    -   `SIGN_IN_EXPIRED`: "sign_in_expired"

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

### Available CSS Shadow Parts

| Component                   | Part                              | Description                                                            |
|-----------------------------|-----------------------------------|------------------------------------------------------------------------|
| `<u-field>`                 | `field-container`                 | The main container for the field.                                      |
|                             | `field-container--<field-name>`   | A field-specific container. e.g. `field-container--email`              |
|                             | `field_label`                     | The label for the field.                                               |
|                             | `field_label--<field-name>`       | A field-specific label. e.g. `field_label--email`                      |
|                             | `field-error-message`             | The error message for the field.                                       |
|                             | `input_field`                     | The `<input>` element.                                                 |
|                             | `multi-select-group_field`        | The fieldset for a multi-select group.                                 |
|                             | `multi-select-item_checkbox`      | A checkbox in a multi-select group.                                    |
|                             | `multi-select-item_label`         | The label for a checkbox.                                              |
|                             | `multi-select-readonly-container` | The container for readonly multi-select fields.                        |
|                             | `multi-select-readonly-field`     | An individual readonly multi-select field.                             |
|                             | `radio-group_field`               | The fieldset for a radio group.                                        |
|                             | `radio-group-item_label`          | The label for a radio button.                                          |
|                             | `radio-group-item_radio`          | A radio button in a radio group.                                       |
|                             | `radio_checked`                   | A checked radio button.                                                |
|                             | `readonly-indicator`              | The text displayed for readonly fields.                                |
|                             | `required-indicator`              | The asterisk for required fields.                                      |
|                             | `select_field`                    | The `<select>` element.                                                |
|                             | `select_field--<field-name>`      | A field-specific `<select>` element. e.g. `select_field--country_code` |
|                             | `textarea_field`                  | The `<textarea>` element.                                              |
| `<u-magic-code-field>`      | `digit-input`                     | An individual digit input field.                                       |
| `<u-profile-submit-button>` | `unidy-button`                    | The button element itself.                                             |
| `<u-social-login-button>`   | `social-login-button`             | The button element itself.                                             |
|                             | `social-login-button-content`     | The container for the button's content.                                |
|                             | `social-login-button-text`        | The text within the button.                                            |
| `<u-spinner>`               | `spinner`                         | The inner rotating `<div>` element of the spinner.                     |

## Internationalization (i18n)

The SDK uses `i18next` for internationalization. You can provide your own translations for any text in the SDK by using the `custom-translations` attribute on the `<u-config>` component.

The value of this attribute can be a JSON string or a JavaScript object. The keys of the object should be language codes (e.g., "en", "de"), and the values should be nested objects representing the translation keys.

**Example:**

```html
<u-config
  base-url="http://localhost:3000"
  api-key="public-newsletter-api-key"
  custom-translations='{
    "de": {
      "fields": {
        "custom_attributes.favorite_nut": {
          "label": "Lieblingsnuss",
          "options": {
            "peanut": "Erdnuss",
            "hazelnut": "Haselnuss",
            "walnut": "Walnuss"
          }
        }
      }
    },
    "en": {
      "fields": {
        "custom_attributes.favorite_nut": {
          "label": "Favorite Nut",
          "options": {
            "peanut": "Peanut",
            "hazelnut": "Hazelnut",
            "walnut": "Walnut"
          }
        }
      }
    }
  }'
></u-config>
```

## Advanced Usage: `<u-raw-field>`

While the `<u-field>` component is recommended for most use cases, the `<u-raw-field>` component is available for situations that require complete control over the form field's layout and styling. It renders a bare, unstyled input element (`<input>`, `<select>`, etc.) without a label or any surrounding structure.

This component is best used when you need to integrate with a design system or achieve a custom layout that `<u-field>` cannot accommodate.

**Attributes:**

-   `field` (required): The name of the user attribute.
-   `type` (required): The input type (`text`, `email`, `tel`, `password`, `number`, `date`, `radio`, `textarea`, `select, checkbox`).
-   `required`: If set to `true`, the field will be marked as required.
-   `readonly-placeholder`: The text to display for a readonly field that has no value.
-   `country-code-display-option`: How to display country codes in a select field. Can be `icon` or `label`. Defaults to `label`.
-   `invalid-phone-message`: The error message to display for an invalid phone number.
-   `class-name`: A string of classes to pass to the input field.
-   `value`: The value of the input.
-   `checked`: If set to `true`, the radio or checkbox will be checked.
-   `disabled`: If set to `true`, the input will be disabled.
-   `tooltip`: The tooltip text to display on hover.
-   `placeholder`: The placeholder text for the input field.
-   `options`: An array of options for a select field. Can be a JSON string or an array of objects with `value` and `label` properties.
-   `empty-option`: If set to `true`, an empty option will be added to select fields.
-   `attr-name`: The name of the attribute.
-   `radio-options`: An array of options for a radio group.
-   `multi-select-options`: An array of options for a multi-select group.
-   `specificPartKey`: A key used for styling specific parts of the component.
-   `pattern`: A custom regular expression (string) used to validate the field value.
-   `patternErrorMessage`: A custom message shown when the `pattern` validation fails.
-   `validationFunc`: A custom validation function that you can assign directly to the element instance. This allows you to implement field-specific validation logic (e.g. age checks, cross-field logic, external rules, etc.).

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
