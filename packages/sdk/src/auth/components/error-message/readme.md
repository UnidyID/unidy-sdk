# unidy-auth-error-message



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute    | Description | Type                                                                | Default     |
| -------------------- | ------------ | ----------- | ------------------------------------------------------------------- | ----------- |
| `componentClassName` | `class-name` |             | `string`                                                            | `""`        |
| `errorMessages`      | --           |             | `{ [x: string]: string; }`                                          | `undefined` |
| `for` _(required)_   | `for`        |             | `"connection" \| "email" \| "general" \| "magicCode" \| "password"` | `undefined` |


## Dependencies

### Used by

 - [u-single-step-login](../single-step-login)

### Graph
```mermaid
graph TD;
  u-single-step-login --> u-error-message
  style u-error-message fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
