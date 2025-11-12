# submit-button



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description | Type     | Default     |
| ----------- | ------------ | ----------- | -------- | ----------- |
| `apiKey`    | `api-key`    |             | `string` | `undefined` |
| `apiUrl`    | `api-url`    |             | `string` | `undefined` |
| `className` | `class-name` |             | `string` | `undefined` |


## Events

| Event     | Description | Type                                                                                                                                                                                                                                                                       |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`   |             | `CustomEvent<ApiResponse<{ results: { id: number; email: string; newsletter_internal_name: string; preference_identifiers: string[]; preference_token: string; confirmed_at?: string; }[]; errors: { newsletter_internal_name: string; error_identifier: string; }[]; }>>` |
| `success` |             | `CustomEvent<{ results: { id: number; email: string; newsletter_internal_name: string; preference_identifiers: string[]; preference_token: string; confirmed_at?: string; }[]; errors: { newsletter_internal_name: string; error_identifier: string; }[]; }>`              |


## Shadow Parts

| Part       | Description |
| ---------- | ----------- |
| `"button"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
