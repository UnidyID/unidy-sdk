# unidy-config



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type     | Default     |
| ---------- | ---------- | ----------- | -------- | ----------- |
| `apiKey`   | `api-key`  |             | `string` | `""`        |
| `baseUrl`  | `base-url` |             | `string` | `""`        |
| `language` | `language` |             | `string` | `undefined` |


## Events

| Event             | Description                                                                                                                              | Type                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `configChange`    | Emitted when any config property changes after initial load.                                                                             | `CustomEvent<ConfigChangeEventDetail>` |
| `unidyConfigured` | Emitted when the config component is fully initialized. This fires after apiKey, baseUrl, and language are set, and Auth is initialized. | `CustomEvent<ConfiguredEventDetail>`   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
