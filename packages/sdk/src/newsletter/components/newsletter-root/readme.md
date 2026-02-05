# u-newsletter-root



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute    | Description                               | Type     | Default |
| -------------------- | ------------ | ----------------------------------------- | -------- | ------- |
| `componentClassName` | `class-name` | CSS classes to apply to the host element. | `string` | `""`    |


## Events

| Event                | Description                                                                                 | Type                                                     |
| -------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `uNewsletterError`   | Fired on newsletter subscription failure. Contains the email and error code.                | `CustomEvent<{ email: string; error: string; }>`         |
| `uNewsletterSuccess` | Fired on successful newsletter subscription. Contains the email and subscribed newsletters. | `CustomEvent<{ email: string; newsletters: string[]; }>` |


## Methods

### `submit(forType?: NewsletterButtonFor) => Promise<void>`



#### Parameters

| Name      | Type                  | Description |
| --------- | --------------------- | ----------- |
| `forType` | `"login" \| "create"` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
