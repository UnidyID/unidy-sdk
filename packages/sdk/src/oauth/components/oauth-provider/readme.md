# u-oauth-provider



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute       | Description                                                                                            | Type      | Default     |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------ | --------- | ----------- |
| `autoRedirect`          | `auto-redirect` | If true, automatically redirects to the authorization URL after successful consent.                    | `boolean` | `true`      |
| `clientId` _(required)_ | `client-id`     | The OAuth application client ID.                                                                       | `string`  | `undefined` |
| `newtab`                | `newtab`        | If true, opens the OAuth flow in a new tab instead of the current window.                              | `boolean` | `false`     |
| `redirectUri`           | `redirect-uri`  | The URL to redirect to after authorization. Must match one of the application's allowed redirect URIs. | `string`  | `undefined` |
| `scopes`                | `scopes`        | Comma-separated list of OAuth scopes to request (e.g., "openid,profile,email").                        | `string`  | `undefined` |


## Events

| Event          | Description                                                                                           | Type                             |
| -------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| `oauthCancel`  | Fired when the user cancels the OAuth consent flow.                                                   | `CustomEvent<void>`              |
| `oauthError`   | Fired when an error occurs during the OAuth flow. Contains the error message and optional identifier. | `CustomEvent<OAuthErrorEvent>`   |
| `oauthSuccess` | Fired on successful OAuth authorization. Contains the token, application details, and redirect URL.   | `CustomEvent<OAuthSuccessEvent>` |


## Methods

### `cancel() => Promise<void>`

Cancels the OAuth consent flow and emits the oauthCancel event.

#### Returns

Type: `Promise<void>`



### `connect() => Promise<void>`

Initiates the OAuth consent flow by fetching application details and displaying the consent UI.

#### Returns

Type: `Promise<void>`



### `submit() => Promise<void>`

Submits the OAuth consent form, granting authorization to the application.

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
