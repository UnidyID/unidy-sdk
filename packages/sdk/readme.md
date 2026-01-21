# Unidy SDK

The Unidy SDK provides a set of framework-agnostic web components to integrate Unidy newsletters, tickets and subscriptions, authentication and profile management into your web application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start: Examples](quick-start-examples.md#quick-start-examples)
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
-   `partialValidation`: When `true`, only validates and submits fields that are rendered as `<u-field>` components. Use this when your form shows only a subset of profile fields to avoid validation errors for required fields not in your UI. Defaults to `false`.
-   `validateFields`: A comma-separated list of field names to validate. Overrides auto-detection when `partialValidation` is `true`.

**Methods:**

-   `submitProfile()`: Programmatically submit the profile form. Returns `Promise<void>`. Validates required fields before submission.

**Events:**

-   `uProfileSuccess`: Fired when profile update is successful. `event.detail` contains `{ message: string, payload: ProfileRaw }`.
-   `uProfileError`: Fired when profile update fails. `event.detail` contains `{ error: string, details: { fieldErrors?: Record<string, string>, httpStatus?: number, responseData?: unknown } }`.

**Slots:**

- The default slot allows you to provide the content to be rendered within the profile component.

**Example: Partial validation**

```html
<!-- Only first_name and email will be validated/submitted -->
<u-profile partial-validation="true">
  <u-field field="first_name"></u-field>
  <u-field field="email"></u-field>
  <u-submit-button>Save</u-submit-button>
</u-profile>
```

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

-   `custom-class`: A string of classes to pass to the span element.

#### `<u-pagination-button>`

Renders a button to navigate to the previous or next page.

**Attributes:**

-   `direction` (required): The direction of the button. Can be `prev` or `next`.
-   `custom-class`: A string of classes to pass to the button element.

**Slots:**

-   `icon`: Allows you to provide a custom icon for the button.

#### `<u-ticketable-export>`

Renders a button to export a ticket or subscription to a file format (e.g., PDF or Apple Wallet pass). This component must be placed inside the `<template>` element within a `<u-ticketable-list>` component.

**Attributes:**

-   `format` (required): The export format. Can be `"pdf"` or `"pkpass"` (Apple Wallet).
-   `custom-class`: A string of classes to pass to the button element.
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
        <u-ticketable-export format="pdf" custom-class="btn btn-primary">
          Download PDF
        </u-ticketable-export>
        <u-ticketable-export format="pkpass" custom-class="btn btn-secondary">
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

### Ticketable API

The SDK provides two service classes for interacting with the `ticketable` API: `TicketsService` and `SubscriptionsService`.

#### `TicketsService`

-   `list(args: object, params?: TicketsListParams): Promise<ApiResponse<TicketsListResponse>>`: Fetches a paginated list of tickets.
-   `get(args: { id: string }): Promise<ApiResponse<Ticket>>`: Fetches a single ticket by its ID.

#### `SubscriptionsService`

-   `list(args: object, params?: SubscriptionsListParams): Promise<ApiResponse<SubscriptionsListResponse>>`: Fetches a paginated list of subscriptions.
-   `get(args: { id: string }): Promise<ApiResponse<Subscription>>`: Fetches a single subscription by its ID.

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
