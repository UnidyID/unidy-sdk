# u-ticketable-export



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute    | Description                                                          | Type                | Default     |
| --------------------- | ------------ | -------------------------------------------------------------------- | ------------------- | ----------- |
| `componentClassName`  | `class-name` | CSS classes to apply to the button element.                          | `string`            | `undefined` |
| `exportable`          | `exportable` | Whether the export is available. Set to false to disable the button. | `boolean`           | `true`      |
| `format` _(required)_ | `format`     | The export format (pdf or pkpass).                                   | `"pdf" \| "pkpass"` | `undefined` |


## Events

| Event                      | Description | Type                                                       |
| -------------------------- | ----------- | ---------------------------------------------------------- |
| `uTicketableExportError`   |             | `CustomEvent<{ error: string; }>`                          |
| `uTicketableExportSuccess` |             | `CustomEvent<{ url: string; format: "pdf" \| "pkpass"; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
