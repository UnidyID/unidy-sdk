# unidy-profile



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description | Type                                 | Default                                                                                                                                                                                                         |
| ------------- | -------------- | ----------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`      | `api-key`      |             | `string \| undefined`                | `undefined`                                                                                                                                                                                                     |
| `apiUrl`      | `api-url`      |             | `string \| undefined`                | `undefined`                                                                                                                                                                                                     |
| `initialData` | `initial-data` |             | `string \| { [x: string]: string; }` | `""`                                                                                                                                                                                                            |
| `language`    | `language`     |             | `string \| undefined`                | `undefined`                                                                                                                                                                                                     |
| `profileId`   | `profile-id`   |             | `string \| undefined`                | `undefined`                                                                                                                                                                                                     |
| `store`       | `store`        |             | `ObservableMap<ProfileStore>`        | `createStore<ProfileStore>({     loading: true,     data: {},     configuration: {},     errors: {},     idToken: "",     client: undefined,     flashErrors: {},     language: "",     phoneValid: true,   })` |


## Dependencies

### Depends on

- [flash-message](../unidy-flash)

### Graph
```mermaid
graph TD;
  unidy-profile --> flash-message
  style unidy-profile fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
