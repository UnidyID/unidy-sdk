# u-social-login-button

## Slots

| Slot   | Description                                                                                        |
| ------ | -------------------------------------------------------------------------------------------------- |
| `icon` | Override the default provider icon. Falls back to built-in logos for Google, LinkedIn, Apple, Discord, and Facebook. |

### Custom icon example

```html
<u-social-login-button provider="google">
  <img slot="icon" src="/assets/icons/google.svg" alt="" />
</u-social-login-button>
```

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description                                                                | Type                                                                      | Default                |
| ------------- | -------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------- |
| `iconOnly`    | `icon-only`    | If true, shows only the provider icon without text.                        | `boolean`                                                                 | `false`                |
| `provider`    | `provider`     | The OAuth provider (google, linkedin, apple, discord, facebook, or unidy). | `"apple" \| "discord" \| "facebook" \| "google" \| "linkedin" \| "unidy"` | `"google"`             |
| `redirectUri` | `redirect-uri` | The URL to redirect to after authentication. Defaults to current page.     | `string`                                                                  | `window.location.href` |
| `theme`       | `theme`        | Button theme: 'light' (white background) or 'dark' (dark background).      | `"dark" \| "light"`                                                       | `"light"`              |


## Shadow Parts

| Part                            | Description |
| ------------------------------- | ----------- |
| `"social-login-button"`         |             |
| `"social-login-button-content"` |             |
| `"social-login-button-text"`    |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
