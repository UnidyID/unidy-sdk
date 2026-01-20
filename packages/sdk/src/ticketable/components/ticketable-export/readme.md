# u-ticketable-export



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute      | Description | Type                | Default     |
| --------------------- | -------------- | ----------- | ------------------- | ----------- |
| `customClass`         | `custom-class` |             | `string`            | `undefined` |
| `exportable`          | `exportable`   |             | `boolean`           | `true`      |
| `format` _(required)_ | `format`       |             | `"pdf" \| "pkpass"` | `undefined` |


## Events

| Event                      | Description | Type                                                       |
| -------------------------- | ----------- | ---------------------------------------------------------- |
| `uTicketableExportError`   |             | `CustomEvent<{ error: string; }>`                          |
| `uTicketableExportSuccess` |             | `CustomEvent<{ url: string; format: "pdf" \| "pkpass"; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
