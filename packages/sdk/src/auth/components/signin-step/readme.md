# u-signin-step



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute       | Description                                                                         | Type                                                                                                                                                                     | Default     |
| ------------------- | --------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `alwaysRender`      | `always-render` | If true, the step will always render regardless of the current authentication step. | `boolean`                                                                                                                                                                | `false`     |
| `name` _(required)_ | `name`          | The name of this step in the sign-in flow.                                          | `"connect-brand" \| "email" \| "invited" \| "magic-code" \| "missing-fields" \| "registration" \| "reset-password" \| "single-login" \| "unconfirmed" \| "verification"` | `undefined` |


## Methods

### `isActive() => Promise<boolean>`

Whether this step is currently active or configured to always render.

#### Returns

Type: `Promise<boolean>`



### `submit() => Promise<void>`

Submit the active step once, including while a previous passkey request is being cancelled.

#### Returns

Type: `Promise<void>`




## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
