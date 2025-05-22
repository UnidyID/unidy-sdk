# unidy-newsletter

foobar

<!-- Auto Generated Below -->


## Properties

| Property                        | Attribute                          | Description | Type                                                             | Default                   |
| ------------------------------- | ---------------------------------- | ----------- | ---------------------------------------------------------------- | ------------------------- |
| `apiKey`                        | `api-key`                          |             | `string`                                                         | `undefined`               |
| `apiUrl`                        | `api-url`                          |             | `string`                                                         | `undefined`               |
| `defaultNewsletterInternalName` | `default-newsletter-internal-name` |             | `string`                                                         | `undefined`               |
| `emailLabel`                    | `email-label`                      |             | `string`                                                         | `"E-mail"`                |
| `emailPlaceholder`              | `email-placeholder`                |             | `string`                                                         | `"E-mail"`                |
| `errorAlreadySubscribedText`    | `error-already-subscribed-text`    |             | `string`                                                         | `"Already subscribed"`    |
| `errorInvalidEmailText`         | `error-invalid-email-text`         |             | `string`                                                         | `"Invalid email address"` |
| `errorUnconfirmedText`          | `error-unconfirmed-text`           |             | `string`                                                         | `"Email not confirmed"`   |
| `errorUnknownText`              | `error-unknown-text`               |             | `string`                                                         | `"Unknown error occured"` |
| `header`                        | `header`                           |             | `string`                                                         | `undefined`               |
| `newslettersConfig`             | `newsletters-config`               |             | `{ internal_name: string; label: string; checked?: boolean; }[]` | `[]`                      |
| `renderErrorMessages`           | `render-error-messages`            |             | `boolean`                                                        | `false`                   |
| `submitButtonText`              | `submit-button-text`               |             | `string`                                                         | `"Subscribe"`             |


## Events

| Event        | Description | Type                                                                                                                                                                      |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `on:error`   |             | `CustomEvent<{ newsletter_internal_name?: string; error_identifier?: string; }[]>`                                                                                        |
| `on:success` |             | `CustomEvent<{ email?: string; id?: number; newsletter_internal_name?: string; preference_identifiers?: string[]; preference_token?: string; confirmed_at?: string; }[]>` |


## Shadow Parts

| Part                         | Description |
| ---------------------------- | ----------- |
| `"container"`                |             |
| `"email-input"`              |             |
| `"email-input-group"`        |             |
| `"email-input-label"`        |             |
| `"error-messages-container"` |             |
| `"heading"`                  |             |
| `"submit-button"`            |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
