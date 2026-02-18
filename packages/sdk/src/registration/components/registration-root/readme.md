# u-registration-root



<!-- Auto Generated Below -->


## Properties

| Property                       | Attribute          | Description | Type      | Default     |
| ------------------------------ | ------------------ | ----------- | --------- | ----------- |
| `autoResume`                   | `auto-resume`      |             | `boolean` | `true`      |
| `brandId`                      | `brand-id`         |             | `number`  | `undefined` |
| `registrationUrl` _(required)_ | `registration-url` |             | `string`  | `undefined` |
| `steps`                        | `steps`            |             | `string`  | `"[]"`      |


## Events

| Event                  | Description | Type                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errorEvent`           |             | `CustomEvent<{ error: string; }>`                                                                                                                                                                                                                                                                                                                                                               |
| `registrationComplete` |             | `CustomEvent<{ rid: string; status: Record<string, boolean>; created_at: string; updated_at: string; expires_at: string; expired: boolean; can_finalize: boolean; email_verified: boolean; email?: string; newsletter_preferences?: Record<string, string[]>; registration_profile_data?: Record<string, unknown>; social_provider?: string; has_passkey?: boolean; has_password?: boolean; }>` |
| `stepChange`           |             | `CustomEvent<{ stepName: string; stepIndex: number; }>`                                                                                                                                                                                                                                                                                                                                         |


## Methods

### `advanceToNextStep() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `getBrandId() => Promise<number | undefined>`



#### Returns

Type: `Promise<number>`



### `getRegistrationUrl() => Promise<string>`



#### Returns

Type: `Promise<string>`



### `goToPreviousStep() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `isComplete() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
