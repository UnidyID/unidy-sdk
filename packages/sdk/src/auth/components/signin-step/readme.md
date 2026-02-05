# u-signin-step



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute       | Description                                                                         | Type                                                                                                                    | Default     |
| ------------------- | --------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| `alwaysRender`      | `always-render` | If true, the step will always render regardless of the current authentication step. | `boolean`                                                                                                               | `false`     |
| `name` _(required)_ | `name`          | The name of this step in the sign-in flow.                                          | `"email" \| "magic-code" \| "missing-fields" \| "registration" \| "reset-password" \| "single-login" \| "verification"` | `undefined` |


## Methods

### `isActive() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `submit() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
