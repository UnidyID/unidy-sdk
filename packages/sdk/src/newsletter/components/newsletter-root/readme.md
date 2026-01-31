# u-newsletter-root



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute    | Description | Type     | Default |
| -------------------- | ------------ | ----------- | -------- | ------- |
| `componentClassName` | `class-name` |             | `string` | `""`    |


## Events

| Event                | Description | Type                                                     |
| -------------------- | ----------- | -------------------------------------------------------- |
| `uNewsletterError`   |             | `CustomEvent<{ email: string; error: string; }>`         |
| `uNewsletterSuccess` |             | `CustomEvent<{ email: string; newsletters: string[]; }>` |


## Methods

### `submit(forType?: NewsletterButtonFor) => Promise<void>`



#### Parameters

| Name      | Type                  | Description |
| --------- | --------------------- | ----------- |
| `forType` | `"login" \| "create"` |             |

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [u-spinner](../../../shared/components/spinner)

### Graph
```mermaid
graph TD;
  u-newsletter-root --> u-spinner
  style u-newsletter-root fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
