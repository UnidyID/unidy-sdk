# u-registration-passkey



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description                                                                                                  | Type      | Default     |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ | --------- | ----------- |
| `active`             | `active`              | Set false when hiding or closing registration to cancel and ignore pending creation results.                 | `boolean` | `true`      |
| `autoStart`          | `auto-start`          | Automatically try creation once per new flow with typed-email passkey intent, when this step becomes active. | `boolean` | `false`     |
| `componentClassName` | `class-name`          | CSS classes to apply to the passkey button element.                                                          | `string`  | `""`        |
| `disabled`           | `disabled`            | Disable the button and cancel any outstanding creation.                                                      | `boolean` | `false`     |
| `fallbackClassName`  | `fallback-class-name` | Tailwind classes for the optional password fallback button.                                                  | `string`  | `""`        |
| `passkeyName`        | `passkey-name`        | Optional name for the passkey (defaults to "Passkey").                                                       | `string`  | `undefined` |
| `passwordFallback`   | `password-fallback`   | Offer an explicit password path through the remaining configured registration steps.                         | `boolean` | `false`     |


## Methods

### `continueWithPassword() => Promise<void>`

Cancel creation, choose password, and submit this step using the normal ordered onboarding flow.

#### Returns

Type: `Promise<void>`




## Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


## Shadow Parts

| Part                         | Description |
| ---------------------------- | ----------- |
| `"password-fallback-button"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
