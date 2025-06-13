# unidy-login

<!-- Auto Generated Below -->


## Properties

| Property                | Attribute       | Description | Type                                                 | Default                  |
| ----------------------- | --------------- | ----------- | ---------------------------------------------------- | ------------------------ |
| `baseUrl` _(required)_  | `base-url`      |             | `string`                                             | `undefined`              |
| `clientId` _(required)_ | `client-id`     |             | `string`                                             | `undefined`              |
| `prompt`                | `prompt`        |             | `"consent" \| "login" \| "none" \| "select_account"` | `null`                   |
| `redirectUrl`           | `redirect-url`  |             | `string`                                             | `window.location.origin` |
| `responseType`          | `response-type` |             | `string`                                             | `"id_token"`             |
| `scope`                 | `scope`         |             | `string`                                             | `"openid email"`         |


## Events

| Event    | Description | Type                              |
| -------- | ----------- | --------------------------------- |
| `onAuth` |             | `CustomEvent<{ token: string; }>` |


## Methods

### `auth(trySilentAuth?: boolean) => Promise<AuthResult>`



#### Parameters

| Name            | Type      | Description |
| --------------- | --------- | ----------- |
| `trySilentAuth` | `boolean` |             |

#### Returns

Type: `Promise<AuthResult>`



### `hide() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `logout() => Promise<LogoutResult>`



#### Returns

Type: `Promise<LogoutResult>`



### `show() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
