# u-newsletter-root



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Type     | Default     |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `componentClassName` | `class-name`   | CSS classes to apply to the host element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `string` | `""`        |
| `redirectUri`        | `redirect-uri` | Optional URL used as the `redirect_uri` when sending the login email. When provided, overrides the default (current page URL).  The URL is passed as-is to the backend — no client-side substitution is performed. The following placeholders are substituted server-side: - `{preference_token}` — the user's preference token - `{email}` — the subscriber's email address - `{newsletter_internal_name}` — the newsletter's internal name  **Note:** The hostname of this URL must be present in the SDK client's `allowed_hosts` list (configurable in the Unidy dashboard), otherwise the API will return 403. | `string` | `undefined` |


## Events

| Event                | Description                                                                                 | Type                                                     |
| -------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `uNewsletterError`   | Fired on newsletter subscription failure. Contains the email and error code.                | `CustomEvent<{ email: string; error: string; }>`         |
| `uNewsletterSuccess` | Fired on successful newsletter subscription. Contains the email and subscribed newsletters. | `CustomEvent<{ email: string; newsletters: string[]; }>` |


## Methods

### `submit(forType?: NewsletterButtonFor) => Promise<void>`



#### Parameters

| Name      | Type                  | Description |
| --------- | --------------------- | ----------- |
| `forType` | `"login" \| "create"` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
