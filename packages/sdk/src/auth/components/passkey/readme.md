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

| Property              | Attribute               | Description                                                                                                             | Type                                         | Default      |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------ |
| `active`              | `active`                | Set false when closing or hiding a sign-in modal to cancel pending requests and discard prefetched challenges.          | `boolean`                                    | `true`       |
| `ariaDescribedBy`     | `aria-described-by`     | ID of an element describing the passkey button.                                                                         | `string`                                     | `""`         |
| `componentClassName`  | `class-name`            | CSS classes to apply to the button element.                                                                             | `string`                                     | `""`         |
| `continueWithPasskey` | `continue-with-passkey` | Opt in to typed-email account lookup and new-account passkey registration via a sibling u-registration-root.            | `boolean`                                    | `false`      |
| `disabled`            | `disabled`              | Disable this button and stop its automatic passkey flow.                                                                | `boolean`                                    | `false`      |
| `discoverable`        | `discoverable`          | Allow account discovery without an email lookup. Immediate and conditional modes always use discovery.                  | `boolean`                                    | `false`      |
| `mode`                | `mode`                  | Standard modal UI by default. Opt in to immediate UI with conditional autofill fallback, or conditional autofill alone. | `"conditional" \| "immediate" \| "standard"` | `"standard"` |


## Slots

| Slot     | Description |
| -------- | ----------- |
| `"icon"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
