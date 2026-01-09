# u-config



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description | Type                                          | Default        |
| -------------------- | --------------------- | ----------- | --------------------------------------------- | -------------- |
| `apiKey`             | `api-key`             |             | `string`                                      | `""`           |
| `baseUrl`            | `base-url`            |             | `string`                                      | `""`           |
| `checkSignedIn`      | `check-signed-in`     |             | `boolean`                                     | `false`        |
| `customTranslations` | `custom-translations` |             | `string \| { [x: string]: TranslationTree; }` | `""`           |
| `fallbackLocale`     | `fallback-locale`     |             | `string`                                      | `"en"`         |
| `locale`             | `locale`              |             | `string`                                      | `"en"`         |
| `mode`               | `mode`                |             | `"development" \| "production"`               | `"production"` |


## Events

| Event              | Description | Type                        |
| ------------------ | ----------- | --------------------------- |
| `configChange`     |             | `CustomEvent<ConfigChange>` |
| `unidyInitialized` |             | `CustomEvent<Config>`       |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
