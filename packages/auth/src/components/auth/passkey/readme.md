# u-passkey

A StencilJS component for passkey (WebAuthn) authentication.

## Usage

```html
<u-passkey 
  text="Sign in with Passkey"
  loading-text="Authenticating..."
  class-name="my-custom-class"
  disabled="false">
</u-passkey>
```

## Properties

| Property | Attribute | Description | Type | Default |
|----------|-----------|-------------|------|---------|
| `disabled` | `disabled` | Whether the button is disabled | `boolean` | `false` |
| `componentClassName` | `class-name` | CSS class name for styling | `string` | `""` |
| `text` | `text` | Button text | `string` | `"Sign in with Passkey"` |
| `loadingText` | `loading-text` | Text shown during authentication | `string` | `"Authenticating..."` |

## Behavior

- The component automatically checks if WebAuthn is supported in the browser
- If WebAuthn is not supported, the component renders nothing (returns `null`)
- When clicked, it initiates the passkey authentication flow:
  1. Fetches passkey options from the server (`GET /api/sdk/v1/passkeys/new`)
  2. Prompts the user for passkey authentication via the browser
  3. Verifies the credential with the server (`POST /api/sdk/v1/passkeys`)
  4. On success, sets the authentication token and emits auth events

## Error Handling

Errors are handled through the auth store and can be displayed using the `u-error-message` component:

```html
<u-error-message for="general"></u-error-message>
```

Common error identifiers:
- `passkey_not_supported` - WebAuthn is not supported in the browser
- `passkey_cancelled` - User cancelled the authentication
- `passkey_security_error` - Security error occurred
- `passkey_invalid_state` - Invalid state error
- `invalid_passkey` - Invalid passkey credential
- `verification_failed` - Passkey verification failed
- `authentication_failed` - Authentication failed

## Integration with Signin Flow

This component can be used in both the email step and verification step of the signin flow:

### Email Step (First Step)
When used in the email step, the component will authenticate without requiring an email:

```html
<u-signin-root>
  <u-signin-step name="email">
    <u-passkey></u-passkey>
    <u-email-field></u-email-field>
    <u-auth-submit-button for="email"></u-auth-submit-button>
  </u-signin-step>
  
  <u-signin-step name="verification">
    <!-- verification options -->
  </u-signin-step>
</u-signin-root>
```

### Verification Step (Second Step)
When used in the verification step, the component will automatically pass the `sid` (sign-in ID) from the previous step to the API endpoint:

```html
<u-signin-root>
  <u-signin-step name="email">
    <u-email-field></u-email-field>
    <u-auth-submit-button for="email"></u-auth-submit-button>
  </u-signin-step>
  
  <u-signin-step name="verification">
    <u-passkey></u-passkey>
    <u-password-field></u-password-field>
    <u-auth-submit-button for="password"></u-auth-submit-button>
  </u-signin-step>
</u-signin-root>
```

**Note:** When used in the verification step, the component automatically includes `?sid=${sid}` in the API request to `/api/sdk/v1/passkeys/new` since the sign-in ID is already available from the email step.

## API Endpoints

The component uses the following API endpoints:

- **GET `/api/sdk/v1/passkeys/new`** - Retrieves WebAuthn authentication options
- **POST `/api/sdk/v1/passkeys`** - Verifies the passkey credential and returns authentication tokens

Both endpoints require `credentials: 'include'` to handle encrypted cookies for challenge storage.

