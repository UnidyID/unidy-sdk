# unidy-field



<!-- Auto Generated Below -->


## Properties

| Property                   | Attribute                     | Description | Type                | Default                                |
| -------------------------- | ----------------------------- | ----------- | ------------------- | -------------------------------------- |
| `componentClassName`       | `class-name`                  |             | `string`            | `undefined`                            |
| `countryCodeDisplayOption` | `country-code-display-option` |             | `"icon" \| "label"` | `"label"`                              |
| `emptyOption`              | `empty-option`                |             | `boolean`           | `true`                                 |
| `field` _(required)_       | `field`                       |             | `string`            | `undefined`                            |
| `invalidPhoneMessage`      | `invalid-phone-message`       |             | `string`            | `"Please enter a valid phone number."` |
| `placeholder`              | `placeholder`                 |             | `string`            | `undefined`                            |
| `readonlyPlaceholder`      | `readonly-placeholder`        |             | `string`            | `"No information"`                     |
| `renderDefaultLabel`       | `render-default-label`        |             | `boolean`           | `true`                                 |
| `required`                 | `required`                    |             | `boolean`           | `false`                                |


## Shadow Parts

| Part                                | Description                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"field-error-message"`             |                                                                                                                                                                                                                           |
| `"input_field"`                     |                                                                                                                                                                                                                           |
| `"multi-select-group_field"`        |                                                                                                                                                                                                                           |
| `"multi-select-item_checkbox"`      |                                                                                                                                                                                                                           |
| `"multi-select-item_label"`         |                                                                                                                                                                                                                           |
| `"multi-select-readonly-container"` |                                                                                                                                                                                                                           |
| `"multi-select-readonly-field"`     |                                                                                                                                                                                                                           |
| `"radio-group-item_label"`          |                                                                                                                                                                                                                           |
| `"radio-group-item_radio"`          |                                                                                                                                                                                                                           |
| `"radio-group_field"`               |                                                                                                                                                                                                                           |
| `"radio_checked"`                   |                                                                                                                                                                                                                           |
| `"readonly-indicator"`              |                                                                                                                                                                                                                           |
| `"required-indicator"`              |                                                                                                                                                                                                                           |
| `"select_field"`                    | Styles the base <select> element.                                                                                                                                                                                         |
| `"select_field--example_field"`     | Example of a field-specific selector. Replace `example_field` with your field name. e.g. `custom_attributes.favorite_nut` → `select_field--custom_attributes-favorite_nut`, `country_code` → `select_field--country-code` |
| `"textarea_field"`                  |                                                                                                                                                                                                                           |


## Dependencies

### Used by

 - [u-full-profile](../full-profile)
 - [u-missing-field](../../../auth/components/missing-field)

### Depends on

- [u-raw-field](../raw-field)

### Graph
```mermaid
graph TD;
  u-field --> u-raw-field
  u-full-profile --> u-field
  u-missing-field --> u-field
  style u-field fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
