# u-oauth-missing-fields



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute          | Description                                    | Type     | Default |
| -------------------- | ------------------ | ---------------------------------------------- | -------- | ------- |
| `componentClassName` | `class-name`       | CSS classes to apply to the container element. | `string` | `""`    |
| `fieldClassName`     | `field-class-name` | CSS classes to apply to each field element.    | `string` | `""`    |


## Dependencies

### Depends on

- [u-spinner](../../../shared/components/spinner)
- [u-field](../../../profile/components/field)

### Graph
```mermaid
graph TD;
  u-oauth-missing-fields --> u-spinner
  u-oauth-missing-fields --> u-field
  u-field --> u-raw-field
  u-field --> u-spinner
  style u-oauth-missing-fields fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
