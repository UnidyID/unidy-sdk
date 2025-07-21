# Unidy Newsletter Component

The Unidy Newsletter component provides a web component to easily embed newsletter subscription forms into your web application.

## Installation

```bash
npm install @unidy.io/components
```

## Basic Usage

To use the component, you need to add the `unidy-newsletter` element to your HTML and configure it with the necessary properties.

```html
<unidy-newsletter
  api-url="https://your-unidy-instance-url.com"
  api-key="your-api-key"
  header="Subscribe to our Newsletter"
  submit-button-text="Subscribe"
  newsletters-config-json='[{"internalName": "default", "label": "General Updates"}]'
></unidy-newsletter>

<script type="module" src="node_modules/@unidy.io/components/dist/unidy-components/unidy-components.esm.js"></script>
```

### Example with multiple newsletters and preferences

```html
<unidy-newsletter
  api-url="https://your-unidy-instance-url.com"
  api-key="your-api-key"
  header="Newsletter Subscriptions"
  newsletters-config-json='[
    {
      "internalName": "tech_updates",
      "label": "Tech Updates",
      "checked": true
    },
    {
      "internalName": "marketing_news",
      "label": "Marketing News",
      "preferences": [
        { "internalName": "weekly_digest", "label": "Weekly Digest" },
        { "internalName": "monthly_wrapup", "label": "Monthly Wrap-up" }
      ]
    }
  ]'
></unidy-newsletter>
```

## Properties

The component is configured through properties on the `unidy-newsletter` element.

| Property                      | Type                  | Description                                                                                             | Default                                |
| ----------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `apiUrl`                      | `string`              | **Required.** The base URL of your Unidy instance.                                                      | `undefined`                            |
| `apiKey`                      | `string`              | **Required.** Your Unidy API key.                                                                       | `undefined`                            |
| `header`                      | `string`              | The header text displayed above the form.                                                               | `undefined`                            |
| `newslettersConfig`           | `NewsletterConfig[]`  | An array of newsletter configurations. See the `NewsletterConfig` type below.                           | `[]`                                   |
| `newslettersConfigJson`       | `string`              | A JSON string representation of the `newslettersConfig` array. Use this for declarative HTML usage.     | `undefined`                            |
| `submitButtonText`            | `string`              | The text for the submit button.                                                                         | `"Subscribe"`                          |
| `emailLabel`                  | `string`              | The label for the email input field.                                                                    | `"Email"`                              |
| `emailPlaceholder`            | `string`              | The placeholder text for the email input field.                                                         | `"Email"`                              |
| `returnToAfterConfirmation`   | `string`              | A URL to redirect the user to after they confirm their subscription via email.                          | Current page URL without query params. |
| `renderErrorMessages`         | `boolean`             | Set to `true` to display inline error messages for each newsletter.                                     | `false`                                |
| `errorUnconfirmedText`        | `string`              | Text for "unconfirmed" error.                                                                           | `"Email not confirmed"`                |
| `errorAlreadySubscribedText`  | `string`              | Text for "already_subscribed" error.                                                                    | `"Already subscribed"`                 |
| `errorInvalidEmailText`       | `string`              | Text for "invalid_email" error.                                                                         | `"Invalid email address"`              |
| `errorNewsletterNotFoundText` | `string`              | Text for "newsletter_not_found" error.                                                                  | `"Newsletter not found"`               |
| `errorPreferenceNotFoundText` | `string`              | Text for "preferences_not_found" error.                                                                 | `"Preference not found"`               |
| `errorUnknownText`            | `string`              | Text for any other unknown error.                                                                       | `"Unknown error occured"`              |
| `successConfirmationText`     | `string`              | Message shown after a user successfully confirms their subscription via the link in their email.        | `"You have successfully confirmed your newsletter subscription."` |
| `confirmationErrorText`       | `string`              | Message shown if the confirmation link is invalid or expired.                                           | `"Your preference token could not be assigned. Enter your e-mail address to receive a new link."` |

### `NewsletterConfig` Type

```typescript
type NewsletterConfig = {
  internalName: string;
  label: string;
  checked?: boolean; // Whether the newsletter is pre-selected
  preferences?: {
    internalName: string;
    label: string;
    checked?: boolean; // Whether the preference is pre-selected
  }[];
};
```

## Events

The component emits custom events to notify your application of success or failure.

-   **`on:success`**: Fired when a subscription request is successfully submitted.
    -   `event.detail`: `NewsletterSubscription[]` - An array of the successful subscriptions.

-   **`on:error`**: Fired when there is an error with the subscription.
    -   `event.detail`: `NewsletterSubscriptionError[]` - An array of errors.

### Listening to Events

```javascript
const newsletterElement = document.querySelector('unidy-newsletter');

newsletterElement.addEventListener('on:success', (event) => {
  console.log('Successfully subscribed:', event.detail);
  // Show a success message to the user
});

newsletterElement.addEventListener('on:error', (event) => {
  console.error('Subscription error:', event.detail);
  // Handle errors, e.g., display a generic error message
});
```

## Slots

You can inject your own content into the component using slots.

-   `header`: Replaces the default header (`h1` tag).
-   `description`: Add content between the header and the form.
-   `success-container`: Content to show when a subscription is successfully submitted.
-   `confirm-success-container`: Content to show after a user confirms their subscription via email. Replaces the default text.
-   `confirmation-error-container`: Content to show if the email confirmation fails. Replaces the default text.
-   `footer`: Add content below the form.

### Slot Usage Example

```html
<unidy-newsletter ...>
  <h2 slot="header">Join Our Community</h2>
  <p slot="description">
    Sign up to receive the latest news and updates from our team.
  </p>
  <div slot="success-container">
    <h3>Thank you!</h3>
    <p>Please check your email to confirm your subscription.</p>
  </div>
</unidy-newsletter>
```

## Styling

You can customize the component's appearance using CSS Shadow Parts.

| Part                               | Description                                       |
| ---------------------------------- | ------------------------------------------------- |
| `container`                        | The main container div for the whole component.   |
| `heading`                          | The `h1` header element.                          |
| `email-input-group`                | The container for the email label and input.      |
| `email-input-label`                | The `label` for the email input.                  |
| `email-input`                      | The `input` field for the email address.          |
| `newsletter-container`             | The container for a single newsletter and its preferences. |
| `newsletter-label`                 | The `label` for a newsletter checkbox.            |
| `newsletter-checkbox`              | The `input[type=checkbox]` for a newsletter.      |
| `newsletter-preferences-container` | The container for a newsletter's preferences.     |
| `newsletter-preference-label`      | The `label` for a preference checkbox.            |
| `newsletter-preference-checkbox`   | The `input[type=checkbox]` for a preference.      |
| `submit-button`                    | The `button` to submit the form.                  |
| `error-message`                    | A container for an error message.                 |
| `confirm-success-text`             | The paragraph for the success confirmation message. |
| `confirmation-error-text`          | The paragraph for the confirmation error message. |

### Styling Example

```css
unidy-newsletter::part(submit-button) {
  background-color: #0a2463;
  color: white;
  border-radius: 8px;
  padding: 10px 20px;
}

unidy-newsletter::part(email-input) {
  border: 2px solid #ccc;
  padding: 8px;
}

unidy-newsletter::part(error-message) {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}
```