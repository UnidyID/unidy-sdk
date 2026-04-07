# @unidy.io/sdk-react

React hooks for the [Unidy](https://unidy.io) SDK. Provides authentication, newsletter management, user profiles, and ticketable access — all as simple React hooks.

## Installation

```bash
npm install @unidy.io/sdk-react @unidy.io/sdk
```

**Peer dependencies:** `react >= 18`, `@unidy.io/sdk`

## Quick Start

### 1. Create the client and wrap your app

```tsx
import { createStandaloneClient, UnidyProvider } from "@unidy.io/sdk-react";

const client = createStandaloneClient({
  baseUrl: "https://your-unidy-instance.com",
  apiKey: "your-public-api-key",
});

function App() {
  return (
    <UnidyProvider client={client}>
      <YourApp />
    </UnidyProvider>
  );
}
```

### 2. Use the hooks

```tsx
import { useSession, useNewsletterSubscribe } from "@unidy.io/sdk-react";

function NewsletterForm() {
  const { isAuthenticated, email: sessionEmail } = useSession();
  const { isLoading, error, subscribe } = useNewsletterSubscribe();
  const [email, setEmail] = useState("");

  const effectiveEmail = isAuthenticated ? sessionEmail : email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await subscribe({
      email: effectiveEmail,
      newsletters: [{ internalName: "main" }],
    });
    if (result.success) {
      alert("Subscribed! Check your email to confirm.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={effectiveEmail}
        onChange={(e) => setEmail(e.target.value)}
        readOnly={isAuthenticated}
        required
      />
      <button type="submit" disabled={isLoading}>Subscribe</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

---

## API Reference

### Setup

#### `createStandaloneClient(config)`

Creates a React-enhanced Unidy client with automatic token refresh and storage wiring.

```ts
const client = createStandaloneClient({
  baseUrl: string;       // Your Unidy API base URL
  apiKey: string;        // Your public API key
  deps?: {
    getIdToken?: () => Promise<string | null>; // Optional custom token provider
  };
});
```

By default, `getIdToken` reads from `authStorage` (bridging tokens set by `useLogin` / `useSession`). If the token is expired, it automatically refreshes using the stored refresh token.

#### `<UnidyProvider client={client}>`

React context provider. All hooks must be used within this provider.

```tsx
<UnidyProvider client={client}>
  <App />
</UnidyProvider>
```

#### `useUnidyClient()`

Access the client instance directly from context. Useful for advanced use cases (e.g. using the client with React Query).

```ts
const client = useUnidyClient();
const [error, data] = await client.newsletters.list({ options: { preferenceToken } });
```

---

### Authentication

#### `useLogin(options?)`

Full multi-step authentication flow state machine. Handles email, password, magic code, social auth, passkey, password reset, brand connection, and missing fields collection.

```ts
const login = useLogin({
  initialStep?: AuthStep;    // Default: recovers from storage or "email"
  autoRecover?: boolean;     // Auto-recover flow state on mount (default: true)
  callbacks?: {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
  };
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `step` | `AuthStep` | Current step: `"idle"` \| `"email"` \| `"verification"` \| `"password"` \| `"magic-code"` \| `"reset-password"` \| `"connect-brand"` \| `"missing-fields"` \| `"authenticated"` |
| `isAuthenticated` | `boolean` | Whether the user is authenticated |
| `isLoading` | `boolean` | Whether an async action is in progress |
| `email` | `string` | The email being used in the login flow |
| `loginOptions` | `LoginOptions \| null` | Available login methods after email submission |
| `errors` | `AuthErrors` | Per-field errors: `email`, `password`, `magicCode`, `resetPassword`, `missingFields`, `global` |
| `resendAvailableIn` | `number` | Seconds remaining before the magic code can be resent. Ticks down automatically. `0` = can resend. |
| `resetPasswordStep` | `"idle" \| "sent"` | Reset password email state |
| `canGoBack` | `boolean` | Whether `goBack()` has a previous step to return to |
| `missingFieldDefinitions` | `Record<string, unknown> \| null` | Field definitions from the server when the `"missing-fields"` step is active. Keys are field names. |

**Actions:**

| Method | Description |
|--------|-------------|
| `submitEmail(email, options?)` | Submit email to start the login flow. Pass `{ sendMagicCode: true }` to skip the verification step. |
| `submitPassword(password)` | Submit password for authentication. May transition to `"connect-brand"` or `"missing-fields"`. |
| `sendMagicCode()` | Send (or resend) a magic code to the user's email |
| `submitMagicCode(code)` | Submit the magic code for verification. May transition to `"connect-brand"` or `"missing-fields"`. |
| `getSocialAuthUrl(provider, redirectUri)` | Get the URL for social auth redirect (e.g. `"google"`, `"apple"`) |
| `handleSocialAuthCallback()` | Process social auth callback params from URL (called automatically on mount) |
| `connectBrand()` | Accept the brand connection. May transition to `"missing-fields"` if additional fields are required. |
| `cancelBrandConnect()` | Cancel the brand connection, sign out, and return to the email step. |
| `submitMissingFields(fields)` | Submit required fields (as `Record<string, unknown>`) to complete authentication. |
| `checkPendingRegistration(email)` | Check if a pending registration exists for the email and send a resume link. Returns `"resume-link-sent"`, `"not-found"`, or `"error"`. |
| `sendResetPasswordEmail(returnTo?)` | Send a password reset email |
| `resetPassword(token, password, confirmation)` | Reset password using a token from the reset email |
| `goBack()` | Navigate to the previous step |
| `goToStep(step)` | Navigate to a specific step |
| `restart()` | Go back to email step, preserving email and loginOptions |
| `reset()` | Fully reset all login state to initial values (step, errors, history, email, etc.) |

**Example — step-based login UI:**

```tsx
import { useLogin } from "@unidy.io/sdk-react";

function LoginPage() {
  const login = useLogin();

  if (login.step === "authenticated") {
    return <p>Welcome, {login.email}!</p>;
  }

  if (login.step === "email") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); login.submitEmail(email); }}>
        <input type="email" onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={login.isLoading}>Continue</button>
        {login.errors.email && <p>{login.errors.email}</p>}
      </form>
    );
  }

  if (login.step === "verification") {
    return (
      <div>
        <p>How would you like to sign in?</p>
        {login.loginOptions?.password && (
          <button onClick={() => login.goToStep("password")}>Password</button>
        )}
        {login.loginOptions?.magic_link && (
          <button onClick={() => login.sendMagicCode()}>Magic Code</button>
        )}
        {login.loginOptions?.social_logins.map((provider) => (
          <a key={provider} href={login.getSocialAuthUrl(provider, window.location.href)}>
            Sign in with {provider}
          </a>
        ))}
        <button onClick={login.goBack}>Back</button>
      </div>
    );
  }

  if (login.step === "password") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); login.submitPassword(password); }}>
        <input type="password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={login.isLoading}>Sign in</button>
        <button type="button" onClick={() => login.goToStep("reset-password")}>
          Forgot password?
        </button>
        {login.errors.password && <p>{login.errors.password}</p>}
      </form>
    );
  }

  if (login.step === "magic-code") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); login.submitMagicCode(code); }}>
        <input onChange={(e) => setCode(e.target.value)} />
        <button type="submit" disabled={login.isLoading}>Verify</button>
        <button type="button" onClick={login.sendMagicCode}>Resend code</button>
        {login.errors.magicCode && <p>{login.errors.magicCode}</p>}
      </form>
    );
  }

  if (login.step === "connect-brand") {
    return (
      <div>
        <p>An account with this email already exists. Connect it?</p>
        <button onClick={login.connectBrand} disabled={login.isLoading}>
          Connect Account
        </button>
        <button onClick={login.cancelBrandConnect}>Cancel</button>
      </div>
    );
  }

  if (login.step === "missing-fields") {
    const fieldNames = Object.keys(login.missingFieldDefinitions ?? {});
    return (
      <form onSubmit={(e) => { e.preventDefault(); login.submitMissingFields(values); }}>
        {fieldNames.map((name) => (
          <input key={name} placeholder={name} onChange={(e) => setValues(v => ({ ...v, [name]: e.target.value }))} />
        ))}
        <button type="submit" disabled={login.isLoading}>Submit</button>
        {login.errors.missingFields && <p>{login.errors.missingFields}</p>}
        <button type="button" onClick={login.cancelBrandConnect}>Cancel</button>
      </form>
    );
  }

  // ... handle "reset-password" step similarly
}
```

#### `useSession(options?)`

Lightweight session hook for pages that only need to check authentication state. Does not drive a login flow.

**SSR-safe:** `isLoading` starts `true` and `isAuthenticated` starts `false` during server rendering and hydration, resolving to the real values after the mount effect runs. This prevents hydration mismatches — you don't need a `mounted` state pattern.

```ts
const session = useSession({
  autoRecover?: boolean; // Auto-recover session on mount (default: true)
  callbacks?: {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
  };
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `isAuthenticated` | `boolean` | Whether the user has a valid token |
| `isLoading` | `boolean` | Whether session recovery is in progress |
| `email` | `string` | The authenticated user's email |
| `signInId` | `string \| null` | The current sign-in ID |
| `logout()` | `() => Promise<void>` | Sign out and clear all stored auth state |
| `getToken()` | `() => Promise<string \| null>` | Get a valid token (auto-refreshes if expired) |

**Example:**

```tsx
import { useSession } from "@unidy.io/sdk-react";

function Header() {
  const { isAuthenticated, email, logout, isLoading } = useSession();

  if (isLoading) return <p>Loading...</p>;

  return isAuthenticated
    ? <div>{email} <button onClick={logout}>Logout</button></div>
    : <a href="/login">Sign in</a>;
}
```

#### `useRegistration(args?)`

Multi-step registration flow with email verification, passkey support, and automatic state persistence.

```ts
const registration = useRegistration({
  initialRid?: string;              // Optional registration ID to start from
  autoRecover?: boolean;            // Auto-recover from URL params or storage (default: true)
  autoSendVerificationCode?: boolean; // Auto-send code after createRegistration (default: false)
  callbacks?: { onSuccess?, onError? };
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `registration` | `RegistrationFlowResponse \| null` | Current registration flow data |
| `rid` | `string \| null` | Registration ID |
| `isLoading` | `boolean` | Whether an async action is in progress |
| `isAuthenticated` | `boolean` | Whether finalization returned auth tokens |
| `error` | `string \| null` | General error |
| `fieldErrors` | `Record<string, string>` | Per-field validation errors |
| `missingFields` | `string[]` | Fields the server requires before finalization |
| `cannotFinalize` | `CannotFinalizeError \| null` | Finalization blocker details |
| `resendAvailableIn` | `number` | Seconds until verification code can be resent. Ticks down automatically. |

**Actions:**

| Method | Description |
|--------|-------------|
| `createRegistration(payload)` | Create a new registration flow. Persists `rid` to storage. |
| `getRegistration(options?)` | Fetch the current registration state |
| `updateRegistration(payload, options?)` | Update registration fields |
| `cancelRegistration(options?)` | Cancel the registration |
| `finalizeRegistration(options?)` | Finalize and create the user. Auto-hydrates `authStorage` with tokens. |
| `sendEmailVerificationCode(options?)` | Send a verification code |
| `verifyEmail(code, options?)` | Verify the email with a code |
| `verifyAndFinalize(code, options?)` | Verify email and finalize in a single atomic call |
| `sendResumeLink(email)` | Send a resume link for an in-progress registration |
| `getSocialAuthUrl(provider, redirectUri)` | Get the OAuth redirect URL for social registration |
| `setRid(rid)` | Manually set the registration ID |
| `clearErrors()` | Clear all errors |
| `reset()` | Reset all state and clear persisted registration data |

**Auto-recovery:** On mount, the hook checks for `registration_rid` in URL params and falls back to persisted state in `authStorage`. If a `rid` is found, `getRegistration()` is called automatically to restore the flow.

**Example:**

```tsx
import { useRegistration } from "@unidy.io/sdk-react";

function RegisterPage() {
  const reg = useRegistration({ autoSendVerificationCode: true });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  if (reg.isAuthenticated) return <p>Welcome!</p>;

  if (!reg.rid) {
    return (
      <form onSubmit={async (e) => {
        e.preventDefault();
        await reg.createRegistration({ email, password });
      }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={reg.isLoading}>Register</button>
        {reg.fieldErrors.email && <p>{reg.fieldErrors.email}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      await reg.verifyAndFinalize(code);
    }}>
      <p>Enter the code sent to your email</p>
      <input value={code} onChange={(e) => setCode(e.target.value)} />
      <button type="submit" disabled={reg.isLoading}>Verify</button>
      <button type="button" onClick={() => reg.sendEmailVerificationCode()}
        disabled={reg.resendAvailableIn > 0}>
        {reg.resendAvailableIn > 0 ? `Resend in ${reg.resendAvailableIn}s` : "Resend"}
      </button>
    </form>
  );
}
```

---

### Newsletter

#### `useNewsletterSubscribe(args?)`

Subscribe an email to one or more newsletters.

```ts
const { isLoading, error, fieldErrors, subscribe, reset } = useNewsletterSubscribe({
  callbacks?: { onSuccess?, onError? };
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | Whether a subscription request is in progress |
| `error` | `string \| null` | General error message |
| `fieldErrors` | `Record<string, string>` | Per-field errors (keyed by field name or newsletter `internalName`) |
| `subscribe(args)` | `(args: SubscribeArgs) => Promise<{ success: boolean }>` | Submit a subscription |
| `reset()` | `() => void` | Reset all state |

**`SubscribeArgs`:**

```ts
{
  email: string;
  newsletters: { internalName: string; preferenceIdentifiers?: string[] }[];
  additionalFields?: { first_name?: string | null; last_name?: string | null; phone_number?: string | null };
  redirectToAfterConfirmation?: string; // Defaults to current page URL
}
```

**Example:**

```tsx
const { subscribe, isLoading, error } = useNewsletterSubscribe();

const result = await subscribe({
  email: "user@example.com",
  newsletters: [
    { internalName: "main", preferenceIdentifiers: ["club_news", "player_news"] },
  ],
  redirectToAfterConfirmation: "https://example.com/preference-center",
});

if (result.success) {
  // Show confirmation message
}
```

#### `useNewsletterLogin(args?)`

Send a magic login link so an existing subscriber can manage their preferences.

```ts
const { isLoading, error, success, sendLoginEmail, reset } = useNewsletterLogin();
```

| Field | Type | Description |
|-------|------|-------------|
| `sendLoginEmail(email, redirectUri)` | `(email: string, redirectUri: string) => Promise<boolean>` | Send a login link. `redirectUri` is where the user lands after clicking the link. |
| `success` | `boolean` | Whether the email was sent successfully |

**Example:**

```tsx
const { sendLoginEmail, success } = useNewsletterLogin();

await sendLoginEmail("user@example.com", "https://example.com/preference-center");
// The user receives an email with a link containing a `preference_token` query param
```

#### `useNewsletterPreferenceCenter(args?)`

Manage newsletter subscriptions and preferences. Works with either a preference token (from a login email link) or an authenticated session.

```ts
const {
  subscriptions, preferenceToken, isLoading, error,
  isMutating, mutationError, refetch,
  subscribe, unsubscribe, updatePreferences,
} = useNewsletterPreferenceCenter({
  preferenceToken?: string; // From URL query param (for unauthenticated access)
  callbacks?: { onSuccess?, onError? };
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptions` | `ExistingSubscription[]` | Current subscriptions |
| `preferenceToken` | `string \| undefined` | Active preference token (may change after mutations) |
| `isLoading` | `boolean` | Whether the initial fetch is in progress |
| `error` | `string \| null` | Fetch error |
| `isMutating(internalName)` | `(name: string) => boolean` | Whether a specific newsletter is being mutated |
| `mutationError` | `string \| null` | Last mutation error |
| `subscribe(internalName, preferenceIdentifiers?)` | `Promise<boolean>` | Subscribe to a newsletter |
| `unsubscribe(internalName)` | `Promise<boolean>` | Unsubscribe from a newsletter |
| `updatePreferences(internalName, preferenceIdentifiers)` | `Promise<boolean>` | Update preference selections |
| `getSubscription(internalName)` | `ExistingSubscription \| undefined` | Get the subscription for a newsletter, or `undefined` if not subscribed |
| `isSubscribed(internalName)` | `boolean` | Check if subscribed to a newsletter |
| `togglePreference(internalName, preferenceId, allPreferenceIds)` | `Promise<boolean>` | Toggle a preference within a newsletter. Handles subscribe/unsubscribe/update automatically. |
| `refetch()` | `Promise<void>` | Re-fetch all subscriptions |

**`ExistingSubscription`:**

```ts
{
  newsletter_internal_name: string;
  confirmed: boolean;          // Whether the DOI confirmation email was clicked
  preference_identifiers: string[];
}
```

**Example — preference center with auth support:**

```tsx
import { useNewsletterPreferenceCenter, useSession } from "@unidy.io/sdk-react";

function PreferenceCenter() {
  const { isAuthenticated } = useSession();
  const [token] = useState(() => new URLSearchParams(location.search).get("preference_token") ?? undefined);

  const { subscriptions, isLoading, subscribe, unsubscribe, updatePreferences, isMutating } =
    useNewsletterPreferenceCenter({ preferenceToken: token });

  // Authenticated users don't need a preference token — the auth token is used automatically
  if (!isAuthenticated && !token) {
    return <p>Please log in or use a preference link from your email.</p>;
  }

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      {subscriptions.map((sub) => (
        <div key={sub.newsletter_internal_name}>
          <span>{sub.newsletter_internal_name}</span>
          <button onClick={() => unsubscribe(sub.newsletter_internal_name)}>
            Unsubscribe
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### `useNewsletterResendConfirmation(args?)`

Resend the double opt-in (DOI) confirmation email.

```ts
const { isLoading, error, success, resendConfirmation, reset } = useNewsletterResendConfirmation({
  preferenceToken?: string;
  callbacks?: { onSuccess?, onError? };
});
```

| Field | Type | Description |
|-------|------|-------------|
| `resendConfirmation(internalName, redirectUrl?)` | `Promise<boolean>` | Resend the confirmation email. `redirectUrl` defaults to the current page. |

---

### Profile

#### `useProfile(options?)`

Fetch and update the authenticated user's profile.

```ts
const { profile, isLoading, isMutating, error, fieldErrors, updateProfile, refetch, clearErrors } = useProfile({
  fetchOnMount?: boolean;  // Default: true
  fields?: string[];       // Partial validation — only validate these fields on update
  callbacks?: { onSuccess?, onError? };
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `profile` | `UserProfileData \| null` | The user's profile data |
| `isLoading` | `boolean` | Whether the profile is being fetched |
| `isMutating` | `boolean` | Whether an update is in progress |
| `error` | `string \| null` | General error |
| `fieldErrors` | `Record<string, string>` | Per-field validation errors |
| `updateProfile(data)` | `(data: Record<string, unknown>) => Promise<boolean>` | Update profile fields |
| `refetch()` | `Promise<void>` | Re-fetch the profile |
| `clearErrors()` | `() => void` | Clear all errors |

**Example:**

```tsx
import { useProfile, useSession } from "@unidy.io/sdk-react";

function ProfilePage() {
  const { isAuthenticated } = useSession();
  const { profile, isLoading, isMutating, fieldErrors, updateProfile } = useProfile({
    fetchOnMount: isAuthenticated,
  });

  if (!isAuthenticated) return <p>Please sign in.</p>;
  if (isLoading || !profile) return <p>Loading...</p>;

  const handleSave = async () => {
    const success = await updateProfile({
      first_name: "Jane",
      last_name: "Doe",
    });
  };

  return (
    <div>
      <p>{profile.first_name.value} {profile.last_name.value}</p>
      <button onClick={handleSave} disabled={isMutating}>Save</button>
      {fieldErrors.first_name && <p>{fieldErrors.first_name}</p>}
    </div>
  );
}
```

---

### Ticketables

#### `useTicketables(options)`

Fetch tickets or subscriptions with filtering, pagination, and export support.

```ts
const { items, isLoading, error, refetch, getExportLink } = useTicketables({
  type: "ticket" | "subscription";
  pagination?: UsePaginationReturn | { page?: number; perPage?: number };
  filter?: {
    state?: string;
    paymentState?: string;
    orderBy?: "starts_at" | "ends_at" | "reference" | "created_at";
    orderDirection?: "asc" | "desc";
    serviceId?: number;
    ticketCategoryId?: string;
    subscriptionCategoryId?: string;
  };
  fetchOnMount?: boolean; // Default: true
  callbacks?: { onSuccess?, onError? };
});
```

The return type is narrowed based on `type`:
- `type: "ticket"` → `items: Ticket[]`
- `type: "subscription"` → `items: Subscription[]`

**`getExportLink(id, format)`** returns `{ url: string; expires_in: number } | null`. Supported formats: `"pdf"`, `"pkpass"`.

#### `usePagination(options?)`

Pagination state manager designed to pair with `useTicketables`.

```ts
const pagination = usePagination({
  perPage?: number;    // Default: 10
  initialPage?: number; // Default: 1
});
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `page` | `number` | Current page (1-based) |
| `perPage` | `number` | Items per page |
| `totalPages` | `number` | Total pages (0 until first fetch) |
| `totalItems` | `number` | Total items (0 until first fetch) |
| `hasNextPage` | `boolean` | Whether there is a next page |
| `hasPrevPage` | `boolean` | Whether there is a previous page |
| `nextPage()` | `() => void` | Go to next page |
| `prevPage()` | `() => void` | Go to previous page |
| `goToPage(page)` | `(page: number) => void` | Go to a specific page |

**Example:**

```tsx
import { useTicketables, usePagination } from "@unidy.io/sdk-react";

function TicketList() {
  const pagination = usePagination({ perPage: 20 });
  const { items, isLoading } = useTicketables({
    type: "ticket",
    pagination,
    filter: { orderBy: "starts_at", orderDirection: "desc" },
  });

  return (
    <div>
      {items.map((ticket) => <div key={ticket.id}>{ticket.reference}</div>)}
      <button onClick={pagination.prevPage} disabled={!pagination.hasPrevPage}>Prev</button>
      <span>Page {pagination.page} of {pagination.totalPages}</span>
      <button onClick={pagination.nextPage} disabled={!pagination.hasNextPage}>Next</button>
    </div>
  );
}
```

---

### Utilities

#### `isSuccess(result)`

Type guard for SDK result tuples.

```ts
const result = await client.newsletters.list({ options: { preferenceToken } });
if (isSuccess(result)) {
  const data = result[1]; // typed as the success type
}
```

#### `getSocialAuthUrl(baseUrl, provider, redirectUri)`

Build an OAuth redirect URL for a social auth provider. Also available as a method on `useLogin` and `useRegistration`.

```ts
import { getSocialAuthUrl } from "@unidy.io/sdk-react";

const url = getSocialAuthUrl("https://your-instance.com", "google", window.location.href);
window.location.href = url;
```

#### `authStorage`

Low-level access to the auth token store. Tokens are stored in `sessionStorage` (tab-scoped), while refresh tokens, email, and sign-in IDs are in `localStorage` (cross-tab). Registration flow state (`rid`, `email`) is also persisted.

```ts
import { authStorage } from "@unidy.io/sdk-react";

authStorage.getToken();         // Current JWT or null
authStorage.getState();         // { token, refreshToken, signInId, email, registrationRid, ... }
authStorage.getServerState();   // Stable empty snapshot for SSR/hydration
authStorage.clearAll();         // Clear all auth state (logout)
authStorage.clearRegistration(); // Clear persisted registration flow
```

---

### Callbacks

All hooks accept a `callbacks` option for success/error notifications:

```ts
{
  callbacks: {
    onSuccess: (message: string) => void;
    onError: (error: string) => void;
  }
}
```

This is useful for wiring up toast notifications:

```tsx
import { toast } from "sonner";

const { subscribe } = useNewsletterSubscribe({
  callbacks: {
    onSuccess: (msg) => toast.success(msg),
    onError: (err) => toast.error(err),
  },
});
```
