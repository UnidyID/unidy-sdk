# Unidy SDK

The Unidy SDK provides a set of framework-agnostic web components to integrate Unidy newsletters, tickets and subscriptions, authentication and profile management into your web application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start: Examples](./quick-start-examples.md#quick-start-examples)
- [Swagger API Docs](https://demo.unidy.io/swagger/sdk/html?urls.primaryName=SDK+API+V1)
- [Components](#components)
  - [Core Components](#core-components)
  - [Login Flow Components](#login-flow-components)
  - [Navigation Components](#navigation-components)
  - [Profile Components](#profile-components)
  - [Newsletter Components](#newsletter-components)
  - [Ticket & Subscription Components](#ticket--subscription-components)
- [API Reference](#api-reference)
  - [Auth Class](#auth-class)
  - [UnidyClient](#unidyclient)
  - [ProfileService](#profileservice)
  - [NewsletterService](#newsletterservice)
  - [Ticketable API](#ticketable-api)
  - [Flash Messages](#flash-messages)
  - [State Stores](#state-stores)
  - [Standalone Client](#standalone-client)
  - [Types](#types)
- [Styling](#styling)
- [Internationalization (i18n)](#internationalization-i18n)
- [Advanced Usage: `<u-raw-field>`](#advanced-usage-u-raw-field)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Token Management & Session Handling](#token-management--session-handling)
- [Newsletter Preference Token Flow](#newsletter-preference-token-flow)
- [Complete State Management Reference](#complete-state-management-reference)
- [Utility Functions](#utility-functions)
- [Authentication Step Transitions](#authentication-step-transitions)
- [Browser Compatibility](#browser-compatibility)
- [Accessibility (a11y)](#accessibility-a11y)
- [Security Best Practices](#security-best-practices)

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
-   `check-signed-in`: If set to `true`, automatically checks if the user is signed in on initialization. Defaults to `false`.

**Events:**

-   `unidyInitialized`: Fired when the SDK is successfully initialized. `event.detail` contains the config object with `apiKey`, `baseUrl`, `locale`, and `mode`.
-   `configChange`: Fired when the configuration changes. `event.detail` contains `{ key, value, previousValue }`.

#### `<u-signed-in>`

This component acts as a gatekeeper for authenticated content. It automatically renders its child elements if the user has a valid session, and hides them otherwise. All components that require an authenticated context, such as `<u-profile>`, must be placed inside it.

**Attributes:**

- `class-name`: A string of classes to pass to the host element.
- `not`: If set to `true`, inverts the behavior - shows content only when the user is NOT signed in. Defaults to `false`.

#### `<u-signin-root>`

Renders a complete sign-in and registration flow. This component is automatically displayed for logged-out users and hidden once a session is established.

**Attributes:**

- `class-name`: A string of classes to pass to the host element.

**Events:**

-   `authEvent`: Fired on successful authentication. `event.detail` contains the authentication payload.
-   `errorEvent`: Fired on authentication failure. `event.detail.error` contains the error code.

#### `<u-flash-message>`

Displays temporary messages to the user, such as success, error, or informational messages. This component automatically displays messages from the internal flash message store and is typically used to show feedback after form submissions or API operations.

**Attributes:**

-   `class-name`: A string of classes to pass to the host element.
-   `remove-after-seconds`: Optional number of seconds after which messages are automatically removed. If not set, messages persist until manually dismissed.

**Message Variants:**

Messages displayed by this component can have one of three variants that affect styling:
-   `error` - Red styling for error messages
-   `success` - Green styling for success messages
-   `info` - Blue styling for informational messages

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

-   `name` (required): The name of the step (e.g., `email`, `verification`, `magic-code`, `reset-password`, `single-login`, `missing-fields`, `registration`).
-   `always-render`: If set to `true`, the step will always render its content regardless of the current authentication step.

**Methods:**

-   `isActive()`: Returns `Promise<boolean>` indicating whether this step is currently active.
-   `submit()`: Programmatically submit the current step. Returns `Promise<void>`.

#### `<u-passkey>`

Renders a button that initiates passkey authentication. This component only renders if passkey authentication is available and the browser supports WebAuthn.

**Attributes:**
-   `text`: The text to display on the button. Defaults to "Sign in with Passkey".
-   `loading-text`: The text to display on the button while authenticating. Defaults to "Authenticating..."
-   `class-name`: A string of classes to pass to the button.
-   `disabled`: If set to `true`, the button will be disabled. Defaults to `false`.
-   `aria-described-by`: ID of an element that describes the button for accessibility.

#### `<u-email-field>`

Renders a pre-configured input for the user's email address.

**Attributes:**

- `placeholder`: The placeholder text for the input field. Defaults to "Enter your email".
- `class-name`: A string of classes to pass to the input field.

#### `<u-password-field>`

Renders a pre-configured input for the user's password.

**Attributes:**

- `for`: The type of password field. Can be `"login"` (for sign-in), `"new-password"` (for setting a new password), or `"password-confirmation"` (for confirming a new password). Defaults to `"login"`.
- `placeholder`: The placeholder text for the input field. Defaults to "Enter your password".
- `class-name`: A string of classes to pass to the input field.
- `aria-label`: Custom ARIA label for accessibility. Auto-generated based on `for` prop if not provided.

#### `<u-magic-code-field>`

Renders a specialized input for the one-time magic code.

**Attributes:**

- `class-name`: A string of classes to pass to the input field.

#### `<u-missing-field>`

Renders a list of input fields for collecting additional required fields during sign-in. It must be placed inside a `<u-signin-step name="missing-fields">` element.

**Note:**

`<u-missing-field>` renders one or more `<u-field>` components internally. To style the input fields, use the styling options and shadow parts available for `<u-field>`. See the [Styling](#styling) section and the [`<u-field>`](#u-field) documentation for details.

#### `<u-missing-fields-submit-button>`

Renders a button to submit changes made in the `<u-missing-field>` component. It must be placed inside a `<u-signin-step name="missing-fields">` element below a `<u-missing-field>` element.

**Slots:**

-   The default slot allows you to provide custom button content.

**CSS Shadow Parts:**

-   `button`: The submit button element.

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

#### `<u-registration-button>`

Renders a button that redirects users to the Unidy registration page. This button is automatically shown when an email is not found in Unidy (i.e., when the `account_not_found` error is triggered).

**Attributes:**

-   `for` (required): The step the button is for. Currently only supports `email`.
-   `redirect-uri`: The URL to redirect to after successful registration. Defaults to the current page URL.
-   `class-name`: A string of classes to pass to the button.

**Slots:**

-   `registration-content`: A slot for displaying content before the registration button (e.g., explanatory text).

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


#### `<u-conditional-render>`

A utility component that renders its children only when a specific condition is met. You can use either the `when` attribute with predefined states or a custom `conditionFunction` for more complex logic.

**Attributes:**

- `when`: The name of a predefined state to check. Available states:
  - **Auth conditions:**
    - `auth.passkeyEnabled` - True if passkey login is enabled
    - `auth.passwordEnabled` - True if password login is enabled
    - `auth.magicCodeEnabled` - True if magic code login is enabled
    - `auth.socialLoginsEnabled` - True if any social login providers are enabled
    - `auth.hasSocialLogin(provider)` - True if a specific social provider is enabled
    - `auth.loading` - True while an auth operation is in progress
    - `auth.authenticated` - True if the user is authenticated
    - `auth.magicCodeSent` - True if a magic code has been sent or requested
    - `auth.magicCodeRequested` - True if a magic code has been requested
    - `auth.resetPasswordSent` - True if a password reset has been sent or requested
    - `auth.resetPasswordRequested` - True if a password reset has been requested
  - **Newsletter conditions:**
    - `newsletter.hasCheckedNewsletters` - True if any newsletters are checked
    - `newsletter.hasPreferenceToken` - True if a preference token exists
    - `newsletter.hasEmail` - True if an email is entered
    - `newsletter.subscribed(internalName)` - True if subscribed to a specific newsletter
    - `newsletter.confirmed(internalName)` - True if subscription is confirmed
    - `newsletter.loggedIn` - True if authenticated or has preference token
  - **Profile conditions:**
    - `profile.loading` - True while profile is loading
    - `profile.hasErrors` - True if profile has validation errors
    - `profile.hasFlashErrors` - True if there are flash error messages
    - `profile.phoneValid` - True if phone number is valid
    - `profile.hasData` - True if profile data is loaded
- `is`: Optional value the state variable should have for the content to be rendered. Accepts `"true"`, `"enabled"`, `"false"`, `"disabled"`, or an exact value to compare.
- `not`: If set to `true`, inverts the condition result. Defaults to `false`.
- `conditionFunction`: A custom function assigned **as a JavaScript property** (not as an HTML attribute) that receives the full `AuthState` and returns a boolean. Use this for custom conditional logic.

> **Note:** Either `when` or `conditionFunction` must be provided.

**Slots:**

- The default slot allows you to provide the content to be rendered conditionally.

**Example: Using predefined states**

```html
<u-conditional-render when="auth.authenticated">
  <p>Welcome back!</p>
</u-conditional-render>

<u-conditional-render when="auth.magicCodeSent" is="false">
  <u-send-magic-code-button text="Send Magic Code"></u-send-magic-code-button>
</u-conditional-render>

<u-conditional-render when="auth.loading" not>
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

### Navigation Components

These components allow authenticated users to navigate to external services or the Unidy platform with single sign-on (SSO).

#### `<u-jump-to-service>`

Renders a button that redirects authenticated users to an external OAuth application (service) with SSO. The user must be authenticated to use this component.

**Attributes:**

-   `service-id` (required): The OAuth Application ID of the service to redirect to.
-   `redirect-uri`: The OAuth redirect URI. If not provided, the service's default redirect URI is used.
-   `scopes`: Comma-separated OAuth scopes to request. Defaults to `"openid"`.
-   `newtab`: If set to `true`, opens the service in a new browser tab. Defaults to `false`.
-   `skip-oauth-authorization`: If set to `true`, skips the OAuth authorization step if the user has already authorized the application. Defaults to `false`.
-   `class-name`: A string of classes to pass to the button.

**Slots:**

-   The default slot allows you to provide custom button content. If not provided, displays "Jump to Service".

**Example:**

```html
<u-signed-in>
  <u-jump-to-service service-id="your-oauth-app-id" newtab="true">
    Open External App
  </u-jump-to-service>
</u-signed-in>
```

#### `<u-jump-to-unidy>`

Renders a button that redirects authenticated users to a specific path on the Unidy platform with SSO. This allows seamless navigation to Unidy pages without requiring the user to log in again.

**Attributes:**

-   `path` (required): The Unidy path to redirect to. Must start with `/` (e.g., `/profile`, `/settings`).
-   `newtab`: If set to `true`, opens the Unidy page in a new browser tab. Defaults to `false`.
-   `no-auth`: If set to `true`, redirects without authentication (for public Unidy pages). Defaults to `false`.
-   `class-name`: A string of classes to pass to the button.

**Slots:**

-   The default slot allows you to provide custom button content. If not provided, displays "Jump to Unidy".

**Example:**

```html
<u-signed-in>
  <u-jump-to-unidy path="/profile" newtab="true">
    Edit Profile on Unidy
  </u-jump-to-unidy>
</u-signed-in>
```

### Profile Components

#### `<u-full-profile>`

This component renders a complete profile form that allows users to view and edit their profile data. It also includes the `<u-submit-button>`. The component must be placed inside a `<u-signed-in>`. Internally, it renders one or more `<u-field>` components. To style the input fields, use the styling options and shadow parts available for `<u-field>`. See the [Styling](#styling) section and the [`<u-field>`](#u-field) documentation for details.

**Attributes:**

- `country-code-display-option`: How to display country codes in a select field. Can be `icon` or `label`. Defaults to `label`.
- `fields`: A comma-separated string specifying which fields should be returned instead of the full profile.


#### `<u-profile>`

This component renders a form for users to view and edit their profile data. It must be placed inside a `<u-signed-in>`.

**Attributes:**

-   `profileId`: An optional ID for the profile.
-   `initialData`: Initial profile data, either as a JSON string or a JavaScript object.

**Methods:**

-   `submitProfile()`: Programmatically submit the profile form. Returns `Promise<void>`. Validates required fields before submission.

**Events:**

-   `uProfileSuccess`: Fired when profile update is successful. `event.detail` contains `{ message: string, payload: ProfileRaw }`.
-   `uProfileError`: Fired when profile update fails. `event.detail` contains `{ error: string, details: { fieldErrors?: Record<string, string>, httpStatus?: number, responseData?: unknown } }`.

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

**Note:** To submit profile changes, use the `<u-submit-button>` component within the `<u-profile>` element. See the [`<u-submit-button>`](#u-submit-button) documentation for details.

#### `<u-logout-button>`

This component renders a button that, when clicked, logs the user out. It works with authenticated sessions created via the auth flow.

**Attributes:**

- `class-name`: A string of classes to pass to the button.
- `reload-on-success`: If set to `true`, the page will reload after a successful logout. Defaults to `true`.

**Events:**

- `logout`: Fired on successful logout.

**Slots:**

-   The default slot allows you to provide custom button text. If not provided, default translation will be used

### Newsletter Components

Newsletter components allow you to create newsletter subscription and preference management forms. All newsletter components must be placed inside a `<u-newsletter-root>` component.

#### `<u-newsletter-root>`

The root component for newsletter subscription forms. This component handles initialization, authentication, and subscription management. It must wrap all other newsletter components.

**Attributes:**
-   `class-name`: A string of classes to pass to the host element.

**Methods:**
-   `submit()`: Programmatically submit the newsletter form. This is called internally by `<u-submit-button>` or `<u-email-field>` when used within the newsletter context.

**Events:**
-   `uNewsletterSuccess`: Fired when newsletter subscription is successful. `event.detail` contains `{ email: string, newsletters: string[] }`.
-   `uNewsletterError`: Fired when newsletter subscription fails. `event.detail` contains `{ email: string, error: string }`.

**Slots:**
-   The default slot allows you to provide the newsletter form content.

#### `<u-email-field>`

Renders a pre-configured input for the user's email address. This component works in both auth and newsletter contexts, automatically detecting its parent container.

**Attributes:**
-   `placeholder`: The placeholder text for the input field. Defaults to `Enter your email`.
-   `class-name`: A string of classes to pass to the input field.
-   `disabled`: If set to `true`, the input will be disabled. Defaults to `false`.
-   `aria-label`: The aria-label for accessibility. Defaults to `Email`.

#### `<u-newsletter-checkbox>`

Renders a checkbox for subscribing to a specific newsletter. When checked, the newsletter is added to the subscription list for submission.

**Attributes:**
-   `internal-name` (required): The internal name of the newsletter in Unidy.
-   `checked`: If set to `true`, the checkbox will be checked by default. Defaults to `false`.
-   `class-name`: A string of classes to pass to the checkbox.

**Methods:**
-   `toggle()`: Toggles the checkbox state programmatically. Returns `Promise<void>`. Disabled if already subscribed.
-   `setChecked(checked: boolean)`: Sets the checkbox state programmatically. Returns `Promise<void>`. Disabled if already subscribed.

#### `<u-newsletter-preference-checkbox>`

Renders a checkbox for managing newsletter preferences. Used within a newsletter to subscribe to specific topics or preferences. If the user is already subscribed and confirmed, changes are persisted immediately.

**Attributes:**
-   `internal-name` (required): The internal name of the newsletter in Unidy.
-   `preference-identifier` (required): The preference identifier for this checkbox.
-   `checked`: If set to `true`, the checkbox will be checked by default. Defaults to `false`.
-   `class-name`: A string of classes to pass to the checkbox.

**Methods:**
-   `toggle()`: Toggles the preference checkbox state programmatically. Returns `Promise<void>`. If subscribed and confirmed, persists changes immediately.
-   `setChecked(checked: boolean)`: Sets the preference checkbox state programmatically. Returns `Promise<void>`. If subscribed and confirmed, persists changes immediately.

#### `<u-newsletter-toggle-subscription-button>`

Renders a button that toggles subscription status for a specific newsletter. The button text and behavior change based on whether the user is already subscribed.

**Attributes:**
-   `internal-name` (required): The internal name of the newsletter in Unidy.
-   `class-name`: A string of classes to pass to the button.
-   `subscribe-class-name`: Additional classes to apply when the user is not subscribed.
-   `unsubscribe-class-name`: Additional classes to apply when the user is subscribed.

#### `<u-newsletter-resend-doi-button>`

Renders a button to resend the double opt-in (DOI) confirmation email. This button only appears for subscribed but unconfirmed newsletters.

**Attributes:**
-   `internal-name` (required): The internal name of the newsletter in Unidy.
-   `class-name`: A string of classes to pass to the button.

#### `<u-newsletter-logout-button>`

Renders a logout button for newsletter preference management sessions. This button is only visible when the user is logged in via preference token (not authenticated users).

**Attributes:**
-   `class-name`: A string of classes to pass to the button.

**Slots:**
-   The default slot allows you to provide custom button content. If not provided, defaults to "x".

**CSS Shadow Parts:**
-   `button`: The logout button element.

#### `<u-newsletter-consent-checkbox>`

Renders a checkbox for collecting GDPR consent before newsletter subscription. This checkbox is required when consent collection is enabled for the newsletter form.

**Attributes:**
-   `class-name`: A string of classes to pass to the checkbox input.

**Methods:**
-   `toggle()`: Toggles the checkbox state programmatically. Returns `Promise<void>`.
-   `setChecked(checked: boolean)`: Sets the checkbox state programmatically. Returns `Promise<void>`.

**Example:**

```html
<u-newsletter-root>
  <u-email-field placeholder="Enter your email"></u-email-field>
  <u-newsletter-checkbox internal-name="weekly-digest"></u-newsletter-checkbox>

  <label>
    <u-newsletter-consent-checkbox class-name="mr-2"></u-newsletter-consent-checkbox>
    I agree to the terms and conditions
  </label>

  <u-submit-button>Subscribe</u-submit-button>
</u-newsletter-root>
```

#### `<u-submit-button>`

A universal submit button that works across different contexts (auth, newsletter, profile). The button automatically adapts its behavior based on its parent container (`<u-signin-root>`, `<u-newsletter-root>`, or `<u-profile>`).

**Attributes:**
-   `for`: The step or context the button is for (e.g., `email`, `password` for auth context). Optional for newsletter and profile contexts.
-   `text`: The text to display on the button.
-   `disabled`: If set to `true`, the button will be disabled. Defaults to `false`.
-   `class-name`: A string of classes to pass to the button.

**Slots:**
-   The default slot allows you to provide custom button content.

**Note:** In the newsletter context, the button is automatically disabled if no email is entered or no newsletters are selected.

### Ticket & Subscription Components

The `ticketable` components and API allow you to fetch and display lists of tickets and subscriptions.

#### `<u-ticketable-list>`

This component fetches and renders a list of tickets or subscriptions. It requires a `<template>` element as a child to define the layout for each item in the list.

**Attributes:**

-   `ticketable-type` (required): The type of item to fetch. Can be `ticket` or `subscription`.
-   `limit`: The number of items to fetch per page. Defaults to `10`.
-   `page`: The current page to fetch. Defaults to `1`.
-   `filter`: A string to filter the results. The format is `key=value;key2=value2`.
-   `container-class`: A string of classes to pass to the container element.
-   `target`: A CSS selector for an element to render the list into. If provided, the component will render the list into the target element instead of its own host.
-   `skeleton-count`: The number of skeleton loaders to display while loading. Defaults to the `limit`.
-   `skeleton-all-text`: If set to `true`, all text nodes in the template will be replaced with skeleton loaders.

**Slots:**

-   The default slot should contain a `<template>` element that defines the layout for each item.
-   `pagination`: A slot for pagination components.

**Events:**

-   `uTicketableListSuccess`: Fired when data is successfully loaded. `event.detail` contains `{ ticketableType: "ticket" | "subscription", items: Ticket[] | Subscription[], paginationMeta: PaginationMeta | null }`.
-   `uTicketableListError`: Fired when loading fails. `event.detail` contains `{ ticketableType?: "ticket" | "subscription", error: string }`.

**Inside the template:**

-   `<ticketable-value>`: This component is used inside the template to display a value from the ticket or subscription object.
    -   `name` (required): The name of the attribute to display. Supports nested paths using dot notation (e.g., `title`, `starts_at`, `metadata.foo.bar`, `metadata.items.[0].name`).
    -   `date-format`: A format string for date values (e.g., `dd.MM.yyyy`, `yyyy-MM-dd HH:mm`). Supported locales: `en`, `de`, `fr`, `nl_be`, `ro`, `sv`.
    -   `format`: A string to format the value (e.g., `Price: {{value}}`).
    -   `default`: A default value to display if the attribute is not present.

-   `<ticketable-conditional>`: A conditional element that shows or hides its children based on whether a property is truthy.
    -   `when` (required): The property path to check. Supports nested paths (e.g., `metadata.vip`, `wallet_export`).
    -   If the property value is truthy, the children are rendered. If falsy, the entire element is removed.

-   `unidy-attr`: A special attribute that can be applied to any HTML element within the template to dynamically set attributes based on ticket/subscription data.
    -   Add `unidy-attr` to the element
    -   Use `unidy-attr-{attributeName}` to specify which attribute to set (e.g., `unidy-attr-href`, `unidy-attr-src`)
    -   Use `{{propertyPath}}` in the attribute value to reference ticket/subscription properties. Supports nested paths (e.g., `{{metadata.link}}`, `{{wallet_export.[0].url}}`).

**Nested Property Access:**

Both `<ticketable-value>` and `unidy-attr` support accessing nested properties using dot notation:
-   `metadata.foo` - Access the `foo` property inside `metadata`
-   `metadata.foo.bar` - Access deeply nested properties
-   `metadata.items.[0]` - Access array elements by index
-   `metadata.items.[0].name` - Combine array access with property access

**Example:**

```html
<u-ticketable-list ticketable-type="ticket">
  <template>
    <div>
      <h2><ticketable-value name="title"></ticketable-value></h2>
      <p>
        <ticketable-value name="starts_at" date-format="yyyy-MM-dd HH:mm"></ticketable-value>
      </p>
      <p>
        <ticketable-value name="price" format="Price: {{value}}"></ticketable-value>
      </p>

      <!-- Nested metadata access -->
      <p>
        <ticketable-value name="metadata.category" default="No category"></ticketable-value>
      </p>

      <!-- Conditional rendering based on metadata -->
      <ticketable-conditional when="metadata.vip">
        <span class="vip-badge">VIP</span>
      </ticketable-conditional>

      <ticketable-conditional when="wallet_export">
        <u-ticketable-export format="pkpass">Add to Wallet</u-ticketable-export>
      </ticketable-conditional>

      <!-- Dynamic href using unidy-attr with nested path -->
      <a unidy-attr unidy-attr-href="{{button_cta_url}}" class="button">
        View Details
      </a>
    </div>
  </template>
</u-ticketable-list>
```

#### `<u-pagination-page>`

Displays the current page and the total number of pages.

**Attributes:**

-   `class-name`: A string of classes to pass to the span element.

#### `<u-pagination-button>`

Renders a button to navigate to the previous or next page.

**Attributes:**

-   `direction` (required): The direction of the button. Can be `prev` or `next`.
-   `class-name`: A string of classes to pass to the button element.

**Slots:**

-   `icon`: Allows you to provide a custom icon for the button.

#### `<u-ticketable-export>`

Renders a button to export a ticket or subscription to a file format (e.g., PDF or Apple Wallet pass). This component must be placed inside the `<template>` element within a `<u-ticketable-list>` component.

**Attributes:**

-   `format` (required): The export format. Can be `"pdf"` or `"pkpass"` (Apple Wallet).
-   `class-name`: A string of classes to pass to the button element.
-   `exportable`: Whether the export is available. Defaults to `true`. Set to `false` to disable the export button.

**Events:**

-   `uTicketableExportSuccess`: Fired when the export is successful. `event.detail` contains `{ url: string, format: string }`.
-   `uTicketableExportError`: Fired when the export fails. `event.detail` contains `{ error: string }`.

**Slots:**

-   The default slot allows you to provide custom button content.

**Example:**

```html
<u-ticketable-list ticketable-type="ticket">
  <template>
    <div class="ticket-card">
      <h2><ticketable-value name="title"></ticketable-value></h2>
      <p><ticketable-value name="starts_at" date-format="dd.MM.yyyy HH:mm"></ticketable-value></p>

      <div class="export-buttons">
        <u-ticketable-export format="pdf" class-name="btn btn-primary">
          Download PDF
        </u-ticketable-export>
        <u-ticketable-export format="pkpass" class-name="btn btn-secondary">
          Add to Wallet
        </u-ticketable-export>
      </div>
    </div>
  </template>
</u-ticketable-list>
```

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

### UnidyClient

The `UnidyClient` class provides access to all SDK services. Use `getUnidyClient()` to get a configured instance.

#### `getUnidyClient(): UnidyClient`

Returns a singleton instance of the `UnidyClient`. This function requires `<u-config>` to be initialized first.

```javascript
import { getUnidyClient } from '@unidy.io/sdk';

const client = getUnidyClient();
const [error, profile] = await client.profile.get();
```

#### `UnidyClient` Properties

| Property | Type | Description |
|----------|------|-------------|
| `auth` | `AuthService` | Authentication service for sign-in flows |
| `profile` | `ProfileService` | User profile management |
| `newsletters` | `NewsletterService` | Newsletter subscription management |
| `tickets` | `TicketsService` | Ticket management |
| `subscriptions` | `SubscriptionsService` | Subscription management |

### ProfileService

The `ProfileService` provides methods for fetching and updating user profiles.

#### `profile.get(): Promise<ProfileGetResult>`

Fetches the current user's profile data. Requires authentication.

```javascript
const [error, profile] = await getUnidyClient().profile.get();
if (!error) {
  console.log(profile.first_name.value);
}
```

#### `profile.update(args: { payload: object }): Promise<ProfileUpdateResult>`

Updates the current user's profile. Returns the updated profile data.

```javascript
const [error, updatedProfile] = await getUnidyClient().profile.update({
  payload: { first_name: 'John', last_name: 'Doe' }
});
```

### NewsletterService

The `NewsletterService` provides methods for managing newsletter subscriptions.

#### `newsletters.create(args): Promise<NewsletterCreateResult>`

Creates newsletter subscriptions for a user.

```javascript
const [error, result] = await getUnidyClient().newsletters.create({
  payload: { email: 'user@example.com', newsletters: ['weekly-digest'] }
});
```

#### `newsletters.list(args?): Promise<NewsletterListResult>`

Lists all subscriptions for the authenticated user.

#### `newsletters.get(args): Promise<NewsletterGetResult>`

Gets a specific subscription by newsletter internal name.

#### `newsletters.update(args): Promise<NewsletterUpdateResult>`

Updates a subscription's preferences.

#### `newsletters.delete(args): Promise<NewsletterDeleteResult>`

Deletes a subscription.

#### `newsletters.resendDoi(args): Promise<NewsletterResendDoiResult>`

Resends the double opt-in confirmation email.

#### `newsletters.sendLoginEmail(args): Promise<NewsletterSendLoginEmailResult>`

Sends a login email for newsletter preference management.

#### `newsletters.listAll(): Promise<NewsletterListAllResult>`

Lists all available newsletters (public, no auth required).

#### `newsletters.getByName(args): Promise<NewsletterGetByNameResult>`

Gets a newsletter definition by its internal name (public, no auth required).

### Ticketable API

The SDK provides two service classes for interacting with the `ticketable` API: `TicketsService` and `SubscriptionsService`.

#### `TicketsService`

-   `list(args: object, params?: TicketsListParams): Promise<ApiResponse<TicketsListResponse>>`: Fetches a paginated list of tickets.
-   `get(args: { id: string }): Promise<ApiResponse<Ticket>>`: Fetches a single ticket by its ID.
-   `getExportLink(args: { id: string, format: 'pdf' | 'pkpass' }): Promise<ApiResponse<{ url: string }>>`: Gets an export link for the ticket.

#### `SubscriptionsService`

-   `list(args: object, params?: SubscriptionsListParams): Promise<ApiResponse<SubscriptionsListResponse>>`: Fetches a paginated list of subscriptions.
-   `get(args: { id: string }): Promise<ApiResponse<Subscription>>`: Fetches a single subscription by its ID.
-   `getExportLink(args: { id: string, format: 'pdf' | 'pkpass' }): Promise<ApiResponse<{ url: string }>>`: Gets an export link for the subscription.

### Flash Messages

The `Flash` class provides a simple API for displaying temporary messages to users. Messages are automatically displayed by the `<u-flash-message>` component.

```javascript
import { Flash } from '@unidy.io/sdk';

// Add messages
Flash.success.addMessage('Profile saved successfully!');
Flash.error.addMessage('Something went wrong.');
Flash.info.addMessage('Please check your email.');

// Remove a specific message by ID
const id = Flash.success.addMessage('Saved!');
Flash.remove(id);

// Clear all messages of a specific type
Flash.clear('error');

// Clear all messages
Flash.clear();
```

### State Stores

The SDK exposes reactive state stores for advanced use cases. These allow you to subscribe to state changes or access current state directly.

#### Auth State

```javascript
import { authState, authStore, onAuthChange } from '@unidy.io/sdk';

// Read current state
console.log(authState.authenticated);
console.log(authState.email);

// Subscribe to changes
const unsubscribe = onAuthChange('authenticated', (isAuthenticated) => {
  console.log('Auth state changed:', isAuthenticated);
});

// Available state properties:
// - authenticated: boolean
// - email: string
// - step: 'email' | 'verification' | 'magic-code' | 'reset-password' | ...
// - loading: boolean
// - errors: Record<string, string>
```

#### Profile State

```javascript
import { profileState, profileStore, onProfileChange } from '@unidy.io/sdk';

// Read current state
console.log(profileState.data);
console.log(profileState.loading);

// Subscribe to changes
const unsubscribe = onProfileChange('data', (profileData) => {
  console.log('Profile updated:', profileData);
});
```

### Standalone Client

For use outside of browser environments (e.g., Node.js, serverless functions), use the standalone client which has no browser-specific dependencies.

```javascript
import { createStandaloneClient } from '@unidy.io/sdk/standalone';

const client = createStandaloneClient({
  baseUrl: 'https://your-unidy-instance.com',
  apiKey: 'your-api-key',
  // Optional: inject custom dependencies
  deps: {
    logger: console,
    errorReporter: { captureException: (e) => console.error(e) },
    getIdToken: async () => 'user-jwt-token', // For authenticated requests
    getLocale: () => 'en',
  },
});

// Use the same service APIs
const [error, newsletters] = await client.newsletters.listAll();
```

### Types

#### `TokenPayload`

An object representing the decoded JWT payload. It contains standard claims like `sub` (the Unidy user ID), `exp` (expiration time), and `email`, as well as any custom claims configured in your Unidy instance.

#### `AuthError`

An error object returned on failed authentication operations. It includes a `code` property with a specific error identifier (e.g., `REFRESH_FAILED`) and a `requiresReauth` boolean indicating if the user needs to sign in again.

#### `UserProfile`

An object representing a user's profile. Each field in the profile is an object with a `value` property and additional metadata.

| Name | Type | Description |
|---|---|---|
| `salutation` | `object` | The user's salutation (e.g., Mr., Ms.). |
| `first_name` | `object` | The user's first name. |
| `last_name` | `object` | The user's last name. |
| `email` | `object` | The user's email address. |
| `phone_number` | `object` | The user's phone number. |
| `company_name` | `object` | The user's company name. |
| `address_line_1` | `object` | The first line of the user's address. |
| `address_line_2` | `object` | The second line of the user's address. |
| `city` | `object` | The city of the user's address. |
| `postal_code` | `object` | The postal code of the user's address. |
| `country_code` | `object` | The country code of the user's address. |
| `date_of_birth` | `object` | The user's date of birth. |
| `preferred_language` | `object` | The user's preferred language. |
| `custom_attributes` | `Record<string, object>` | A record of custom attributes. |

#### `NewsletterSubscription`

An object representing a newsletter subscription.

| Name | Type | Description |
|---|---|---|
| `id` | `number` | The unique identifier of the subscription. |
| `email` | `string` | The email address of the subscriber. |
| `newsletter_internal_name` | `string` | The internal name of the newsletter. |
| `preference_identifiers` | `string[]` | A list of preference identifiers. |
| `preference_token` | `string` | A token for managing preferences. |
| `confirmed_at` | `string \| null` | The date the subscription was confirmed. |

#### `Subscription`

An object representing a subscription.

| Name | Type | Description |
|---|---|---|
| `id` | `string` | The unique identifier of the subscription. |
| `title` | `string` | The title of the subscription. |
| `text` | `string` | The description of the subscription. |
| `payment_frequency` | `string \| null` | The payment frequency of the subscription. |
| `metadata` | `Record<string, unknown> \| null` | Additional metadata for the subscription. |
| `wallet_export` | `Record<string, unknown> \| null` | Data for exporting the subscription to a wallet. |
| `state` | `string` | The state of the subscription. |
| `reference` | `string` | A reference for the subscription. |
| `payment_state` | `string \| null` | The payment state of the subscription. |
| `currency` | `string \| null` | The currency of the subscription price. |
| `button_cta_url` | `string \| null` | A URL for a call-to-action button. |
| `created_at` | `Date` | The creation date of the subscription. |
| `updated_at` | `Date` | The last update date of the subscription. |
| `starts_at` | `Date \| null` | The start date of the subscription. |
| `ends_at` | `Date \| null` | The end date of the subscription. |
| `next_payment_at` | `Date \| null` | The date of the next payment. |
| `price` | `number` | The price of the subscription. |
| `user_id` | `string` | The ID of the user who owns the subscription. |
| `subscription_category_id` | `string` | The ID of the subscription category. |

#### `Ticket`

An object representing a ticket.

| Name | Type | Description |
|---|---|---|
| `id` | `string` | The unique identifier of the ticket. |
| `title` | `string` | The title of the ticket. |
| `text` | `string \| null` | The description of the ticket. |
| `reference` | `string` | A reference for the ticket. |
| `metadata` | `Record<string, unknown> \| null` | Additional metadata for the ticket. |
| `wallet_export` | `Record<string, unknown> \| null` | Data for exporting the ticket to a wallet. |
| `state` | `string` | The state of the ticket. |
| `payment_state` | `string \| null` | The payment state of the ticket. |
| `button_cta_url` | `string \| null` | A URL for a call-to-action button. |
| `info_banner` | `string \| null` | An informational banner for the ticket. |
| `seating` | `string \| null` | Seating information for the ticket. |
| `venue` | `string \| null` | The venue for the ticket. |
| `currency` | `string \| null` | The currency of the ticket price. |
| `starts_at` | `Date` | The start date of the ticket. |
| `ends_at` | `Date \| null` | The end date of the ticket. |
| `created_at` | `Date` | The creation date of the ticket. |
| `updated_at` | `Date` | The last update date of the ticket. |
| `price` | `number` | The price of the ticket. |
| `user_id` | `string` | The ID of the user who owns the ticket. |
| `ticket_category_id` | `string` | The ID of the ticket category. |

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
| `<u-submit-button>`         | `auth-submit-button`              | The submit button when used in auth context (part attribute).          |
|                             | `profile-submit-button`           | The submit button when used in profile context (part attribute).       |
|                             | `newsletter-submit-button`        | The submit button when used in newsletter context (part attribute).    |
| `<u-social-login-button>`   | `social-login-button`             | The button element itself.                                             |
|                             | `social-login-button-content`     | The container for the button's content.                                |
|                             | `social-login-button-text`        | The text within the button.                                            |
| `<u-spinner>`               | `spinner`                         | The inner rotating `<div>` element of the spinner.                     |
| `<u-missing-fields-submit-button>` | `button`                   | The submit button element.                                             |
| `<u-newsletter-logout-button>` | `button`                       | The logout button element.                                             |

## Internationalization (i18n)

The SDK uses `i18next` for internationalization. You can provide your own translations for any text in the SDK by using the `custom-translations` attribute on the `<u-config>` component.

The value of this attribute can be a JSON string or a JavaScript object. The keys of the object should be language codes (e.g., "en", "de", "fr", "it", "nl_be", "ro"), and the values should be nested objects representing the translation keys.

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

```html
<div class="mb-4">
  <label for="salutation" class="block text-sm font-bold mb-1">Salutation</label>
  <u-raw-field
    field="salutation"
    type="select"
    class-name="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm bg-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    empty-option="false"
    options='[
      { "value": "mr",  "label": "Mr" },
      { "value": "mrs", "label": "Mrs" },
      { "value": "mx",  "label": "Divers" }
    ]'
  ></u-raw-field>
</div>
```

## Troubleshooting & FAQ

### Configuration Issues

#### "baseUrl and apiKey are required"

The `<u-config>` component requires both `base-url` and `api-key` attributes. Ensure they are set correctly:

```html
<u-config
  base-url="https://your-tenant.unidy.io"
  api-key="your-api-key-here"
  locale="en"
></u-config>
```

#### "Only one `<u-config>` element is allowed per page"

The SDK only supports a single `<u-config>` element. If you're using a SPA framework, ensure the config component isn't duplicated across route changes. Place it once at the root level of your application.

#### CORS errors when connecting to the Unidy backend

Ensure your domain is whitelisted in your Unidy SDK client configuration. Contact your Unidy administrator to add your domain to the allowed origins list.

---

### Authentication Problems

#### Session not persisting after page reload

Add `check-signed-in="true"` to your `<u-config>` to automatically restore authentication state:

```html
<u-config
  base-url="https://your-tenant.unidy.io"
  api-key="your-api-key"
  check-signed-in="true"
></u-config>
```

#### Social login redirects to wrong page

Specify the `redirect-uri` attribute on your social login button:

```html
<u-social-login-button
  provider="google"
  redirect-uri="https://your-site.com/auth/callback"
></u-social-login-button>
```

#### Magic code not arriving

- Check your spam folder
- The magic code has a cooldown period (typically 60 seconds) between requests
- Verify the email address is correct in `authState.email`

#### Token refresh failures

Token refresh happens automatically. If you're seeing unauthorized errors:
- Check that your API key is valid
- Ensure the user's session hasn't been revoked server-side
- Use `Auth.getInstance().logout()` and have the user sign in again

---

### Component Visibility Issues

#### Components not rendering

Most SDK components require a parent context. Ensure components are nested correctly:

```html
<!-- Auth components need u-signin-root -->
<u-signin-root>
  <u-signin-step name="email">
    <u-email-field></u-email-field>
    <u-submit-button></u-submit-button>
  </u-signin-step>
</u-signin-root>

<!-- Profile components need u-profile -->
<u-profile>
  <u-field field="first_name"></u-field>
  <u-submit-button></u-submit-button>
</u-profile>

<!-- Newsletter components need u-newsletter-root -->
<u-newsletter-root>
  <u-email-field></u-email-field>
  <u-newsletter-checkbox internal-name="weekly-digest"></u-newsletter-checkbox>
</u-newsletter-root>
```

#### `<u-signin-step>` not showing the expected step

Steps are shown based on `authState.step`. Check the current step value:

```javascript
import { authState } from '@unidy.io/sdk';
console.log('Current step:', authState.step);
// Possible values: 'email', 'verification', 'magic-code', 'reset-password', 'registration', 'missing-fields', 'single-login'
```

#### `<u-signed-in>` content not showing/hiding correctly

- Content shows when authenticated: `<u-signed-in>...</u-signed-in>`
- Content shows when NOT authenticated: `<u-signed-in not>...</u-signed-in>`

```html
<u-signed-in>
  <p>Welcome back!</p>
  <u-logout-button>Sign Out</u-logout-button>
</u-signed-in>

<u-signed-in not>
  <p>Please sign in to continue.</p>
</u-signed-in>
```

---

### Profile & Form Issues

#### Profile fields not loading

Profile data only loads when the user is authenticated:

```html
<u-signed-in>
  <u-profile>
    <u-field field="first_name"></u-field>
  </u-profile>
</u-signed-in>
```

#### Custom attributes not displaying

Use the `custom_attributes.` prefix for custom fields:

```html
<u-field field="custom_attributes.favorite_color"></u-field>
<u-field field="custom_attributes.membership_level"></u-field>
```

#### Form validation errors not displaying

Add `<u-error-message>` components for each field:

```html
<u-field field="email"></u-field>
<u-error-message for="email"></u-error-message>

<u-field field="phone_number"></u-field>
<u-error-message for="phone_number"></u-error-message>
```

---

### Newsletter Subscription Issues

#### "consent_required" error

When using `<u-newsletter-consent-checkbox>`, users must check it before subscribing:

```html
<u-newsletter-root>
  <u-email-field></u-email-field>
  <u-newsletter-checkbox internal-name="weekly-digest"></u-newsletter-checkbox>

  <label>
    <u-newsletter-consent-checkbox></u-newsletter-consent-checkbox>
    I agree to receive newsletters
  </label>

  <u-submit-button></u-submit-button>
</u-newsletter-root>
```

#### Newsletter checkbox disabled after subscription

This is expected behavior. Once subscribed, the checkbox is disabled to prevent accidental unsubscription. Users can manage preferences through the preference center (accessed via the link in newsletter emails).

#### Preference token handling

When users access the preference center via email link, the SDK automatically extracts `preference_token` and `email` from the URL and populates the newsletter state.

---

### Ticketable (Tickets & Subscriptions) Issues

#### Template not rendering any items

Ensure you have a `<template>` element inside `<u-ticketable-list>`:

```html
<u-ticketable-list ticketable-type="ticket">
  <template>
    <div class="ticket-card">
      <ticketable-value name="reference"></ticketable-value>
      <ticketable-value name="state"></ticketable-value>
    </div>
  </template>
</u-ticketable-list>
```

#### `<ticketable-value>` showing empty or wrong data

Check the path syntax:
- Simple fields: `name="reference"`, `name="state"`, `name="price"`
- Nested fields: `name="metadata.custom_field"`
- Array access: `name="wallet_export.[0].address"`

```html
<ticketable-value name="starts_at" date-format="dd MMM yyyy"></ticketable-value>
<ticketable-value name="price"></ticketable-value>
<ticketable-value name="metadata.seat_number" default="N/A"></ticketable-value>
```

#### Export button always disabled

The export button is disabled when `exportable_to_wallet` is `false` on the ticket/subscription. This is controlled by your Unidy backend configuration.

---

### Styling Issues

#### Tailwind CSS classes not working

The SDK's utility classes (prefixed with `u:`) require the SDK's CSS file. For custom Tailwind classes, ensure Tailwind is configured in your project:

```html
<!-- SDK styles (required) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.css">

<!-- Your Tailwind styles (optional, for custom styling) -->
<link rel="stylesheet" href="/your-tailwind-output.css">
```

#### Cannot style shadow DOM components

Some components like `<u-field>` use Shadow DOM. Use CSS `::part()` selectors:

```css
u-field::part(input_field) {
  border: 1px solid #ccc;
  padding: 8px;
}

u-field::part(field_label) {
  font-weight: bold;
}

u-field::part(field-error-message) {
  color: red;
}
```

#### `class-name` vs `class` attribute

SDK components use `class-name` (not `class`) to pass CSS classes:

```html
<!-- Correct -->
<u-submit-button class-name="bg-blue-500 text-white px-4 py-2">Submit</u-submit-button>

<!-- Won't work as expected -->
<u-submit-button class="bg-blue-500 text-white px-4 py-2">Submit</u-submit-button>
```

---

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `connection_failed` | Cannot reach the Unidy backend | Check network connection and `base-url` configuration |
| `unauthorized` | Invalid or expired authentication | User needs to sign in again |
| `account_not_found` | Email not registered | Direct user to registration flow |
| `invalid_password` | Wrong password | User should retry or reset password |
| `password_not_set` | User has no password configured | Use magic code or social login instead |
| `magic_code_expired` | Magic code timed out | Request a new magic code |
| `magic_code_not_valid` | Wrong magic code entered | User should check code and retry |
| `magic_code_used` | Magic code already used | Request a new magic code |
| `magic_code_recently_created` | Magic code requested too soon | Wait for cooldown period (typically 60 seconds) |
| `reset_password_already_sent` | Password reset email already sent | Check email or wait before requesting again |
| `account_locked` | Account has been locked | Contact administrator |
| `sign_in_expired` | Sign-in session timed out | Start the sign-in flow again |
| `sign_in_not_found` | Sign-in session not found | Start the sign-in flow again |
| `consent_required` | Newsletter consent not given | User must check consent checkbox |
| `email_required` | Email field is empty | User must enter email address |
| `schema_validation_error` | Invalid data format | Check field values match expected types |
| `invalid_preference_token` | Newsletter preference token invalid | User should request a new preference link |

## Token Management & Session Handling

The SDK handles authentication tokens automatically, but understanding the underlying mechanism helps with debugging and advanced use cases.

### Token Storage

The SDK uses browser storage to persist authentication state:

| Data | Storage | Reason |
|------|---------|--------|
| Access Token (JWT) | `sessionStorage` | Short-lived, cleared when browser tab closes |
| Refresh Token | `localStorage` | Long-lived, persists across sessions |
| Sign-in ID (`sid`) | `localStorage` | Identifies the current sign-in session |
| Email | `localStorage` | Pre-fills email field on return visits |

**Storage Keys:**
- `unidy_token` - Access token
- `unidy_refresh_token` - Refresh token
- `unidy_signin_id` - Sign-in session ID
- `unidy_email` - Last used email address

### Automatic Token Refresh

The SDK automatically refreshes expired tokens when you call `auth.getToken()` or `auth.isAuthenticated()`:

1. When a token is requested, the SDK checks if it's valid and not expiring within 10 seconds
2. If the token is expired or about to expire, the SDK uses the refresh token to obtain a new access token
3. If refresh fails (e.g., refresh token expired), the user must sign in again

```javascript
import { Auth } from '@unidy.io/sdk';

const auth = await Auth.getInstance();

// This automatically refreshes the token if needed
const token = await auth.getToken();

if (typeof token === 'string') {
  // Token is valid, use it for API calls
  fetch('/api/endpoint', {
    headers: { Authorization: `Bearer ${token}` }
  });
} else {
  // Token refresh failed, user needs to re-authenticate
  console.error('Auth error:', token.code);
  if (token.requiresReauth) {
    // Redirect to login or show sign-in UI
  }
}
```

### Session Recovery with `check-signed-in`

When `check-signed-in="true"` is set on `<u-config>`, the SDK attempts to restore the user's session on page load:

1. The SDK calls the backend to check if the user has an active session (e.g., from SSO)
2. If a valid session exists, the SDK receives new tokens and sets `authState.authenticated = true`
3. If no session exists, the SDK silently continues (no error shown)

This is useful for:
- Single Sign-On (SSO) scenarios where the user logged in on another application
- Restoring sessions after the access token expired but the backend session is still valid

## Newsletter Preference Token Flow

Newsletter preference management uses a special token-based authentication flow that allows users to manage their subscriptions without signing in.

### How It Works

1. **User subscribes to a newsletter** - After subscribing, the user receives confirmation emails containing a preference management link
2. **Preference link format** - Links contain `preference_token` and `email` as URL parameters:
   ```
   https://your-site.com/preferences?preference_token=abc123&email=user@example.com
   ```
3. **SDK auto-detection** - When `<u-newsletter-root>` initializes, it automatically extracts these parameters from the URL and populates the newsletter state
4. **Authenticated session** - With a valid preference token, users can manage their subscriptions without signing in

### Building a Preference Center

```html
<u-newsletter-root>
  <!-- Shows logout button only for preference token users (not authenticated users) -->
  <u-newsletter-logout-button class-name="float-right">×</u-newsletter-logout-button>

  <h2>Manage Your Subscriptions</h2>

  <!-- Email is pre-filled from the URL parameter -->
  <u-email-field disabled></u-email-field>

  <!-- Toggle buttons for each newsletter -->
  <div class="newsletter-option">
    <span>Weekly Digest</span>
    <u-newsletter-toggle-subscription-button
      internal-name="weekly-digest"
      subscribe-class-name="btn-subscribe"
      unsubscribe-class-name="btn-unsubscribe">
    </u-newsletter-toggle-subscription-button>
  </div>

  <!-- Preference checkboxes for granular control -->
  <u-conditional-render when="newsletter.subscribed(weekly-digest)">
    <div class="preferences">
      <label>
        <u-newsletter-preference-checkbox
          internal-name="weekly-digest"
          preference-identifier="tech-news">
        </u-newsletter-preference-checkbox>
        Include tech news
      </label>
      <label>
        <u-newsletter-preference-checkbox
          internal-name="weekly-digest"
          preference-identifier="product-updates">
        </u-newsletter-preference-checkbox>
        Include product updates
      </label>
    </div>
  </u-conditional-render>

  <!-- Resend confirmation for unconfirmed subscriptions -->
  <u-conditional-render when="newsletter.subscribed(weekly-digest)" not>
    <u-newsletter-resend-doi-button internal-name="weekly-digest">
      Resend confirmation email
    </u-newsletter-resend-doi-button>
  </u-conditional-render>
</u-newsletter-root>
```

### Double Opt-In (DOI) Flow

When double opt-in is enabled for a newsletter:

1. User subscribes → `confirmed_at` is `null`
2. User receives confirmation email with a link
3. User clicks link → `confirmed_at` is set
4. Only confirmed subscriptions receive newsletter emails

Use `<u-newsletter-resend-doi-button>` to allow users to request a new confirmation email.

## Complete State Management Reference

The SDK provides reactive state stores that you can use to build custom UIs or integrate with your application's state management.

### Auth State (`authState`)

```javascript
import { authState, authStore, onAuthChange, missingFieldNames } from '@unidy.io/sdk';
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `authenticated` | `boolean` | Whether the user is currently authenticated |
| `email` | `string` | The email address entered or used for sign-in |
| `password` | `string` | The password entered (cleared after use) |
| `step` | `AuthStep` | Current step in the auth flow (see below) |
| `sid` | `string \| null` | Current sign-in session ID |
| `loading` | `boolean` | Whether an auth operation is in progress |
| `errors` | `Record<string, string \| null>` | Field-specific errors (`email`, `password`, `magicCode`, `resetPassword`, `passkey`) |
| `globalErrors` | `Record<string, string \| null>` | Global errors (e.g., `auth`) |
| `token` | `string \| null` | Current JWT access token |
| `refreshToken` | `string \| null` | Current refresh token |
| `magicCodeStep` | `null \| 'requested' \| 'sent'` | Magic code request state |
| `resetPassword` | `object` | Reset password flow state |
| `availableLoginOptions` | `LoginOptions \| null` | Available login methods for the current user |
| `missingRequiredFields` | `object \| undefined` | Fields required to complete registration |
| `backendSignedIn` | `boolean` | Whether user was signed in via backend SSO |

**`LoginOptions` Structure:**

```typescript
interface LoginOptions {
  magic_link: boolean;    // Magic code login available
  password: boolean;      // Password login available
  social_logins: string[]; // Available social providers
  passkey: boolean;       // Passkey login available
}
```

**Helper Functions:**

```javascript
// Get names of missing required fields (useful for custom missing-fields UI)
const fields = missingFieldNames();
// Returns: ['first_name', 'last_name', 'custom_attributes.company']
```

### Profile State (`profileState`)

```javascript
import { profileState, profileStore, onProfileChange } from '@unidy.io/sdk';
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `loading` | `boolean` | Whether profile is being fetched/updated |
| `data` | `ProfileRaw` | Current profile data |
| `configuration` | `ProfileRaw` | Field configuration (types, options, etc.) |
| `errors` | `Record<string, string \| null>` | Field validation errors |
| `phoneValid` | `boolean` | Whether phone number passes validation |

### Newsletter State (`newsletterStore`)

```javascript
import { newsletterStore } from '@unidy.io/sdk';

// Access state
const state = newsletterStore.state;
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `email` | `string` | Email address for subscription |
| `preferenceToken` | `string` | Token for preference management |
| `checkedNewsletters` | `Record<string, string[]>` | Currently checked newsletters and their preferences |
| `existingSubscriptions` | `ExistingSubscription[]` | User's current subscriptions |
| `fetchingSubscriptions` | `boolean` | Whether subscriptions are being loaded |
| `consentGiven` | `boolean` | Whether GDPR consent checkbox is checked |
| `consentRequired` | `boolean` | Whether consent is required for this form |
| `errors` | `Record<string, string>` | Newsletter-specific errors |
| `isAuthenticated` | `boolean` | Whether user is authenticated or has preference token |

### Subscribing to State Changes

All stores support the `onChange` pattern:

```javascript
import { onAuthChange, onProfileChange } from '@unidy.io/sdk';

// Subscribe to auth state changes
const unsubscribeAuth = onAuthChange('authenticated', (isAuthenticated) => {
  console.log('Auth changed:', isAuthenticated);
});

// Subscribe to profile data changes
const unsubscribeProfile = onProfileChange('data', (profileData) => {
  console.log('Profile updated:', profileData);
});

// Clean up when done
unsubscribeAuth();
unsubscribeProfile();
```

## Utility Functions

### `waitForConfig()`

Waits for the `<u-config>` component to be initialized. Useful when you need to ensure the SDK is ready before making API calls.

```javascript
import { waitForConfig, getUnidyClient } from '@unidy.io/sdk';

async function initializeApp() {
  // Wait for <u-config> to be ready
  await waitForConfig();

  // Now safe to use the client
  const client = getUnidyClient();
  const [error, profile] = await client.profile.get();
}
```

### `createPaginationStore()`

Creates an external pagination store for advanced ticketable list scenarios.

```javascript
import { createPaginationStore } from '@unidy.io/sdk';

const paginationStore = createPaginationStore();

// Use with <u-ticketable-list>
document.querySelector('u-ticketable-list').paginationStore = paginationStore;

// Programmatically control pagination
paginationStore.state.page = 2;
paginationStore.state.limit = 20;
```

## Authentication Step Transitions

The `authState.step` property indicates the current stage in the authentication flow. Understanding what triggers each step helps with building custom UIs.

### Step Flow Diagram

```
┌─────────┐
│  email  │ ← Initial step, user enters email
└────┬────┘
     │ Submit email
     ▼
┌─────────────┐
│ verification│ ← User chooses login method (password/magic code)
└──────┬──────┘
       │
       ├──── Password ────► [authenticated]
       │
       ├──── Magic Code ──► ┌────────────┐
       │                    │ magic-code │ ← User enters code
       │                    └─────┬──────┘
       │                          │
       │                          ▼
       │                    [authenticated]
       │
       └──── Reset Password ► ┌────────────────┐
                              │ reset-password │ ← User sets new password
                              └───────┬────────┘
                                      │
                                      ▼
                                ┌─────────┐
                                │  email  │ ← Back to start
                                └─────────┘

Special Steps:
┌────────────────┐
│ missing-fields │ ← Required fields not filled (social login)
└───────┬────────┘
        │ Submit fields
        ▼
  [authenticated]

┌──────────────┐
│ single-login │ ← Only one login method available (typically magic code only)
└──────────────┘

┌──────────────┐
│ registration │ ← Email not found, user needs to register
└──────────────┘
```

### Step Triggers

| Step | Triggered When |
|------|----------------|
| `email` | Initial state, or after password reset completion |
| `verification` | Email submitted and account found |
| `magic-code` | User requests magic code or `sendMagicCode` enabled |
| `reset-password` | User clicks reset password, or visits reset link |
| `missing-fields` | Social login successful but required fields missing |
| `single-login` | Account has only one login method (auto-detected) |
| `registration` | Email not found (`account_not_found` error) |

### Programmatic Step Control

```javascript
import { authStore, authState } from '@unidy.io/sdk';

// Check current step
console.log('Current step:', authState.step);

// Manually set step (use with caution)
authStore.setStep('email');
```

## Browser Compatibility

The SDK is built with modern web standards and supports the following browsers:

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 80+ | Full support |
| Firefox | 78+ | Full support |
| Safari | 14+ | Full support |
| Edge | 80+ | Full support (Chromium-based) |
| iOS Safari | 14+ | Full support |
| Android Chrome | 80+ | Full support |

### Feature Requirements

- **Web Components**: The SDK uses Custom Elements v1, supported in all modern browsers
- **ES Modules**: Required for JavaScript imports
- **`localStorage` / `sessionStorage`**: Required for token persistence
- **Fetch API**: Required for API calls

### Shadow DOM Considerations

Some SDK components use Shadow DOM for style encapsulation:
- `<u-field>` and related input components
- `<u-social-login-button>`
- `<u-spinner>`

To style Shadow DOM components, use CSS `::part()` selectors (see [Styling](#styling)).

### Known Limitations

- **Internet Explorer**: Not supported
- **Legacy Edge (EdgeHTML)**: Not supported
- **Private/Incognito Mode**: Some browsers restrict `localStorage` in private mode, which may affect session persistence

## Accessibility (a11y)

The SDK components are built with accessibility in mind, following WAI-ARIA guidelines.

### Built-in Accessibility Features

- **Form Labels**: `<u-field>` automatically generates accessible labels
- **Error Announcements**: Validation errors are associated with their inputs via `aria-describedby`
- **Loading States**: Buttons indicate loading state to assistive technologies
- **Focus Management**: Focus is managed appropriately during step transitions

### Recommended ARIA Attributes

For custom implementations, use these attributes:

```html
<!-- Password field with description -->
<u-password-field
  aria-label="Enter your password"
  aria-describedby="password-requirements">
</u-password-field>
<p id="password-requirements">Password must be at least 8 characters</p>

<!-- Magic code field -->
<u-magic-code-field
  aria-label="Enter the 6-digit code sent to your email">
</u-magic-code-field>

<!-- Submit button with loading state -->
<u-submit-button aria-busy="true">
  Signing in...
</u-submit-button>
```

### Keyboard Navigation

All interactive components support keyboard navigation:
- **Tab**: Move between form fields
- **Enter**: Submit forms, activate buttons
- **Space**: Toggle checkboxes, activate buttons
- **Escape**: Close modals (if applicable)

### Screen Reader Tips

- Use `<u-error-message>` components to ensure errors are announced
- Provide descriptive labels for social login buttons
- Use `aria-live` regions for dynamic content updates

```html
<div aria-live="polite" aria-atomic="true">
  <u-flash-message></u-flash-message>
</div>
```

## Security Best Practices

### API Key Usage

The SDK API key is designed to be used in client-side code. It identifies your application but does not grant administrative access.

**What the API key allows:**
- Creating sign-in sessions
- Authenticating users
- Accessing user's own profile and subscriptions

**What the API key does NOT allow:**
- Accessing other users' data
- Administrative operations
- Modifying backend configuration

### Token Security

**Access Tokens:**
- Stored in `sessionStorage` (cleared when tab closes)
- Short-lived (typically 15 minutes)
- Contains user claims (ID, email, custom claims)

**Refresh Tokens:**
- Stored in `localStorage` (persists across sessions)
- Long-lived but can be revoked server-side
- Used only to obtain new access tokens

### Recommendations

1. **Use HTTPS**: Always serve your application over HTTPS to protect tokens in transit

2. **Domain Whitelisting**: Ensure only your domains are whitelisted in the Unidy SDK client configuration

3. **Content Security Policy**: Consider adding CSP headers to prevent XSS attacks:
   ```
   Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net;
   ```

4. **Avoid Logging Tokens**: Never log access or refresh tokens to the console in production

5. **Handle Token Errors**: Always check for `requiresReauth` on auth errors and redirect users to sign in again

6. **Secure Custom Attributes**: Be mindful of what data you store in custom profile attributes

### CORS Configuration

The SDK makes requests to your Unidy backend. Ensure your domain is configured in the SDK client's allowed origins. Contact your Unidy administrator if you encounter CORS errors.

### Session Invalidation

To fully log out a user (including backend session):

```javascript
import { Auth } from '@unidy.io/sdk';

const auth = await Auth.getInstance();
await auth.logout(); // Clears local tokens and invalidates backend session
```
