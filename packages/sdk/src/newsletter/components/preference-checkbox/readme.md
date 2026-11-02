# u-newsletter-preference-checkbox



<!-- Auto Generated Below -->


## Properties

| Property                            | Attribute               | Description                                                        | Type      | Default     |
| ----------------------------------- | ----------------------- | ------------------------------------------------------------------ | --------- | ----------- |
| `checked`                           | `checked`               | If true, the checkbox will be checked by default.                  | `boolean` | `false`     |
| `componentClassName`                | `class-name`            | CSS classes to apply to the checkbox element.                      | `string`  | `undefined` |
| `internalName` _(required)_         | `internal-name`         | The internal name of the parent newsletter.                        | `string`  | `undefined` |
| `preferenceIdentifier` _(required)_ | `preference-identifier` | The preference identifier (e.g., 'daily', 'weekly', 'promotions'). | `string`  | `undefined` |


## Methods

### `setChecked(checked: boolean) => Promise<void>`

Public method to set the checkbox state programmatically

#### Parameters

| Name      | Type      | Description |
| --------- | --------- | ----------- |
| `checked` | `boolean` |             |

#### Returns

Type: `Promise<void>`



### `toggle() => Promise<void>`

Public method to toggle the checkbox programmatically

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
