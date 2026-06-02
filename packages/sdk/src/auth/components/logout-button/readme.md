# u-logout-button



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute           | Description                                                                                                                                                                                                                                                                   | Type      | Default     |
| -------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `componentClassName` | `class-name`        | CSS classes to apply to the button element.                                                                                                                                                                                                                                   | `string`  | `""`        |
| `globalLogout`       | `global-logout`     | When set, overrides the default global-logout behaviour. `true` requests termination of all server-side sessions (full OIDC session teardown). `false` only invalidates the current SDK sign-in record. When unset, the SDK decides based on how the session was established. | `boolean` | `undefined` |
| `reloadOnSuccess`    | `reload-on-success` | If true, reloads the page after successful logout.                                                                                                                                                                                                                            | `boolean` | `true`      |


## Events

| Event    | Description                    | Type                |
| -------- | ------------------------------ | ------------------- |
| `logout` | Fired after successful logout. | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
