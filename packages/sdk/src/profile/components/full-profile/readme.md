# u-full-profile



<!-- Auto Generated Below -->


## Properties

| Property                   | Attribute                     | Description | Type                | Default     |
| -------------------------- | ----------------------------- | ----------- | ------------------- | ----------- |
| `countryCodeDisplayOption` | `country-code-display-option` |             | `"icon" \| "label"` | `"label"`   |
| `fields`                   | `fields`                      |             | `string`            | `undefined` |


## Dependencies

### Depends on

- [u-profile](../profile)
- [u-field](../field)
- [u-submit-button](../../../shared/components/submit-button)

### Graph
```mermaid
graph TD;
  u-full-profile --> u-profile
  u-full-profile --> u-field
  u-full-profile --> u-submit-button
  u-field --> u-raw-field
  u-submit-button --> u-spinner
  style u-full-profile fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
