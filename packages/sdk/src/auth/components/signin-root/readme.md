# u-signin-root



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute    | Description                               | Type     | Default |
| -------------------- | ------------ | ----------------------------------------- | -------- | ------- |
| `componentClassName` | `class-name` | CSS classes to apply to the host element. | `string` | `""`    |


## Events

| Event        | Description                                                             | Type                                                                 |
| ------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `authEvent`  | Fired on successful authentication. Contains the JWT and refresh token. | `CustomEvent<{ jwt: string; refresh_token: string; sid?: string; }>` |
| `errorEvent` | Fired on authentication failure. Contains the error code.               | `CustomEvent<{ error: string; }>`                                    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
