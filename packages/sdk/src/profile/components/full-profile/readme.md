# u-full-profile



<!-- Auto Generated Below -->


## Properties

| Property                   | Attribute                     | Description | Type                | Default     |
| -------------------------- | ----------------------------- | ----------- | ------------------- | ----------- |
| `countryCodeDisplayOption` | `country-code-display-option` |             | `"icon" \| "label"` | `"label"`   |
| `fields`                   | `fields`                      |             | `string`            | `undefined` |
| `language`                 | `language`                    |             | `string`            | `undefined` |
| `submitButtonText`         | `submit-button-text`          |             | `string`            | `"Submit"`  |


## Dependencies

### Depends on

- [u-profile](../profile)
- [u-field](../field)
- [u-profile-submit-button](../unidy-submit-button)

### Graph
```mermaid
graph TD;
  u-full-profile --> u-profile
  u-full-profile --> u-field
  u-full-profile --> u-profile-submit-button
  u-field --> u-raw-field
  style u-full-profile fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
