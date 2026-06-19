# u-signin-step



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute       | Description                                                                                                                   | Type                                                                                                                                                        | Default     |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `alwaysRender`      | `always-render` | If true, the step will always render regardless of the current authentication step.                                           | `boolean`                                                                                                                                                   | `false`     |
| `autoLogin`         | `auto-login`    | If true, the user will be automatically logged in after a successful password reset. Only applies when name="reset-password". | `boolean`                                                                                                                                                   | `false`     |
| `name` _(required)_ | `name`          | The name of this step in the sign-in flow.                                                                                    | `"connect-brand" \| "email" \| "magic-code" \| "missing-fields" \| "registration" \| "reset-password" \| "single-login" \| "unconfirmed" \| "verification"` | `undefined` |


## Methods

### `isActive() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `submit() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
