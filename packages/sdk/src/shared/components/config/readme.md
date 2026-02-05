# u-config



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description                                                                        | Type                                          | Default        |
| -------------------- | --------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- | -------------- |
| `apiKey`             | `api-key`             | Your Unidy API key.                                                                | `string`                                      | `""`           |
| `baseUrl`            | `base-url`            | The Unidy API base URL (e.g., 'https://your-tenant.unidy.io').                     | `string`                                      | `""`           |
| `checkSignedIn`      | `check-signed-in`     | If true, checks for existing session on load and restores authentication state.    | `boolean`                                     | `false`        |
| `customTranslations` | `custom-translations` | Custom translations as JSON string or object. Keyed by locale code.                | `string \| { [x: string]: TranslationTree; }` | `""`           |
| `fallbackLocale`     | `fallback-locale`     | Fallback locale when translation is missing.                                       | `string`                                      | `"en"`         |
| `locale`             | `locale`              | Current locale for translations (e.g., 'en', 'de', 'fr').                          | `string`                                      | `"en"`         |
| `mode`               | `mode`                | SDK mode: 'production' or 'development'. Development mode enables verbose logging. | `"development" \| "production"`               | `"production"` |


## Events

| Event              | Description                                                                | Type                        |
| ------------------ | -------------------------------------------------------------------------- | --------------------------- |
| `configChange`     | Fired when a configuration property changes.                               | `CustomEvent<ConfigChange>` |
| `unidyInitialized` | Fired when SDK initialization is complete. Contains configuration details. | `CustomEvent<Config>`       |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
