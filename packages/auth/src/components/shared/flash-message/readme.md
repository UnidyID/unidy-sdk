# error-message



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                             | Default  |
| --------- | --------- | ----------- | -------------------------------- | -------- |
| `message` | `message` |             | `string`                         | `""`     |
| `variant` | `variant` |             | `"error" \| "info" \| "success"` | `"info"` |


## Dependencies

### Used by

 - [reset-password-button](../../auth/reset-pass-button)
 - [unidy-profile](../../profile/unidy-profile)

### Graph
```mermaid
graph TD;
  reset-password-button --> flash-message
  unidy-profile --> flash-message
  style flash-message fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
