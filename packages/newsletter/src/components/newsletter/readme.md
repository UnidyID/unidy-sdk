# unidy-newsletter

<!-- Auto Generated Below -->


## Properties

| Property                             | Attribute                                | Description | Type                                                                   | Default                                                                                           |
| ------------------------------------ | ---------------------------------------- | ----------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `additionalFields`                   | `additional-fields`                      |             | `{ name: string; label: string; type: string; required?: boolean; }[]` | `[]`                                                                                              |
| `additionalFieldsConfigJson`         | `additional-fields-config-json`          |             | `string`                                                               | `undefined`                                                                                       |
| `apiKey`                             | `api-key`                                |             | `string`                                                               | `undefined`                                                                                       |
| `apiUrl`                             | `api-url`                                |             | `string`                                                               | `undefined`                                                                                       |
| `confirmationErrorText`              | `confirmation-error-text`                |             | `string`                                                               | `"Your preference token could not be assigned. Enter your e-mail address to receive a new link."` |
| `emailLabel`                         | `email-label`                            |             | `string`                                                               | `"Email"`                                                                                         |
| `emailPlaceholder`                   | `email-placeholder`                      |             | `string`                                                               | `"Email"`                                                                                         |
| `errorAlreadySubscribedText`         | `error-already-subscribed-text`          |             | `string`                                                               | `"Already subscribed"`                                                                            |
| `errorInvalidEmailText`              | `error-invalid-email-text`               |             | `string`                                                               | `"Invalid email address"`                                                                         |
| `errorNewsletterNotFoundText`        | `error-newsletter-not-found-text`        |             | `string`                                                               | `"Newsletter not found"`                                                                          |
| `errorPreferenceNotFoundText`        | `error-preference-not-found-text`        |             | `string`                                                               | `"Preference not found"`                                                                          |
| `errorResendConfirmationActionText`  | `error-resend-confirmation-action-text`  |             | `string`                                                               | `"Resend confirmation email"`                                                                     |
| `errorResendConfirmationSuccessText` | `error-resend-confirmation-success-text` |             | `string`                                                               | `"Please check your inbox for the confirmation email."`                                           |
| `errorUnconfirmedText`               | `error-unconfirmed-text`                 |             | `string`                                                               | `"Your email is not confirmed."`                                                                  |
| `errorUnknownText`                   | `error-unknown-text`                     |             | `string`                                                               | `"Unknown error occured"`                                                                         |
| `header`                             | `header`                                 |             | `string`                                                               | `undefined`                                                                                       |
| `newslettersConfig`                  | `newsletters-config`                     |             | `NewsletterConfig[]`                                                   | `[]`                                                                                              |
| `newslettersConfigJson`              | `newsletters-config-json`                |             | `NewsletterConfig[] \| string`                                         | `undefined`                                                                                       |
| `renderErrorMessages`                | `render-error-messages`                  |             | `boolean`                                                              | `false`                                                                                           |
| `returnToAfterConfirmation`          | `return-to-after-confirmation`           |             | `string`                                                               | `undefined`                                                                                       |
| `submitButtonText`                   | `submit-button-text`                     |             | `string`                                                               | `"Subscribe"`                                                                                     |
| `successConfirmationText`            | `success-confirmation-text`              |             | `string`                                                               | `"You have successfully confirmed your newsletter subscription."`                                 |


## Events

| Event         | Description | Type                                                                                                                                                                 |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`       |             | `CustomEvent<{ newsletter_internal_name: string; error_identifier: string; }[]>`                                                                                     |
| `resetStatus` |             | `CustomEvent<void>`                                                                                                                                                  |
| `success`     |             | `CustomEvent<{ id: number; email: string; newsletter_internal_name: string; preference_identifiers: string[]; preference_token: string; confirmed_at?: string; }[]>` |


## Shadow Parts

| Part                                 | Description |
| ------------------------------------ | ----------- |
| `"additional-field-input"`           |             |
| `"additional-field-input-group"`     |             |
| `"additional-field-label"`           |             |
| `"confirm-success-text"`             |             |
| `"confirmaton-error-text"`           |             |
| `"container"`                        |             |
| `"email-input"`                      |             |
| `"email-input-group"`                |             |
| `"email-input-label"`                |             |
| `"heading"`                          |             |
| `"newsletter-checkbox"`              |             |
| `"newsletter-container"`             |             |
| `"newsletter-label"`                 |             |
| `"newsletter-preference-checkbox"`   |             |
| `"newsletter-preference-label"`      |             |
| `"newsletter-preferences-container"` |             |
| `"resend-doi-button"`                |             |
| `"resending-doi-text"`               |             |
| `"submit-button"`                    |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
