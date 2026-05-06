# u-passkey

## Slots

| Slot   | Description                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `icon` | Override the default passkey icon. Falls back to a built-in fingerprint SVG. |

### Custom icon example

```html
<u-passkey discoverable>
  <img slot="icon" src="/assets/images/passkey.svg" alt="" />
</u-passkey>
```

<!-- Auto Generated Below -->


## Properties

| Property             | Attribute           | Description                                                                                          | Type      | Default |
| -------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- | --------- | ------- |
| `ariaDescribedBy`    | `aria-described-by` |                                                                                                      | `string`  | `""`    |
| `componentClassName` | `class-name`        |                                                                                                      | `string`  | `""`    |
| `disabled`           | `disabled`          |                                                                                                      | `boolean` | `false` |
| `discoverable`       | `discoverable`      | When true, renders and triggers a discoverable-credential flow without requiring a prior email step. | `boolean` | `false` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
