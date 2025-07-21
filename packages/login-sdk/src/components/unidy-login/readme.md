# unidy-login

<!-- Auto Generated Below -->


## Properties

| Property                                       | Attribute                                             | Description                                                                                                                                                                                                  | Type                                                         | Default          |
| ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---------------- |
| `baseUrl` _(required)_                         | `base-url`                                            | The base URL of the Unidy authentication server, example: https://your-domain.unidy.de                                                                                                                       | `string`                                                     | `undefined`      |
| `clientId` _(required)_                        | `client-id`                                           | The client ID for the application                                                                                                                                                                            | `string`                                                     | `undefined`      |
| `enableLogging`                                | `enable-logging`                                      | Whether to enable logging, defaults to true                                                                                                                                                                  | `boolean`                                                    | `true`           |
| `mode`                                         | `mode`                                                | The rendering mode - 'dialog' for modal popup, 'inline' for embedded in page                                                                                                                                 | `"dialog" \| "inline"`                                       | `"dialog"`       |
| `prompt`                                       | `prompt`                                              | The prompt option for authentication, can be "none", "login", "consent", "select_account" or null                                                                                                            | `"consent" \| "login" \| "none" \| "select_account" \| null` | `null`           |
| `redirectFlowForLimitedThirdPartyCookieAccess` | `redirect-flow-for-limited-third-party-cookie-access` | Whether to use the special redirect behavior, for browsers limitation access to third party cookies. This should be disabled, when the Unidy instance runs on the same second level domain. Defaults to true | `boolean`                                                    | `true`           |
| `redirectFlowLoginButtonLabel`                 | `redirect-flow-login-button-label`                    | When in inline mode and the browser has no access to third-party cookies, a login button is rendered with this label. Defaults to "Login"                                                                    | `string`                                                     | `"Login"`        |
| `responseType`                                 | `response-type`                                       | The OAuth response type, defaults to "id_token"                                                                                                                                                              | `"code" \| "id_token" \| "token"`                            | `"id_token"`     |
| `scope`                                        | `scope`                                               | The OAuth scopes to request, defaults to "openid email"                                                                                                                                                      | `string`                                                     | `"openid email"` |


## Events

| Event       | Description | Type                              |
| ----------- | ----------- | --------------------------------- |
| `authEvent` |             | `CustomEvent<{ token: string; }>` |


## Methods

### `auth({ trySilentAuth }?: { trySilentAuth?: boolean; }) => Promise<AuthResult>`

Initiates the authentication process

#### Parameters

| Name  | Type                                        | Description                              |
| ----- | ------------------------------------------- | ---------------------------------------- |
| `__0` | `{ trySilentAuth?: boolean \| undefined; }` | - Options for the authentication process |

#### Returns

Type: `Promise<AuthResult>`

Promise that resolves with authentication result containing success status and token or error

### `hide() => Promise<void>`

Hides the authentication dialog modal.

#### Returns

Type: `Promise<void>`

Promise that resolves when the dialog is hidden

### `logout() => Promise<LogoutResult>`

Logs out the current user and clears any stored session data.

#### Returns

Type: `Promise<LogoutResult>`

Promise that resolves with logout result indicating success status

### `show() => Promise<void>`

Shows the authentication dialog modal to the user.

#### Returns

Type: `Promise<void>`

Promise that resolves when the dialog is shown


## Shadow Parts

| Part             | Description |
| ---------------- | ----------- |
| `"login-button"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
