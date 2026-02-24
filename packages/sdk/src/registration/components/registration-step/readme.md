# u-registration-step



<!-- Auto Generated Below -->


## Properties

| Property                    | Attribute                     | Description                                                                                     | Type      | Default     |
| --------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- | --------- | ----------- |
| `alwaysRender`              | `always-render`               | If true, the step's content is always rendered regardless of which step is active.              | `boolean` | `false`     |
| `name` _(required)_         | `name`                        | The step identifier. Must match an entry in the parent `<u-registration-root>`'s `steps` array. | `string`  | `undefined` |
| `requiresEmailVerification` | `requires-email-verification` | If true, this step is automatically skipped when the user's email is already verified.          | `boolean` | `false`     |
| `requiresPassword`          | `requires-password`           | If true, this step is automatically skipped for social login or passwordless flows.             | `boolean` | `false`     |


## Methods

### `isActive() => Promise<boolean>`

Returns whether this step is currently the active step in the registration flow.

#### Returns

Type: `Promise<boolean>`



### `shouldSkip() => Promise<boolean>`

Returns whether this step should be skipped based on the current flow state (e.g. email already verified, passwordless flow).

#### Returns

Type: `Promise<boolean>`



### `submit() => Promise<void>`

Submits the current step. Creates or updates the registration flow, then advances to the next step or finalizes registration.

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
