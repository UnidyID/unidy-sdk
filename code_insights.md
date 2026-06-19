# Code Insights

Reference document for investigations and debugging. Update after each investigation session.

## Stack

- Bun-based monorepo with two packages: `@unidy.io/sdk` (core) and `@unidy.io/sdk-react` (React wrapper)
- **Core SDK**: Stencil web components + TypeScript API client
- **React package**: Hooks-based abstraction over standalone client
- Published to npm; independent release cycles

## Packages

### `@unidy.io/sdk`
Web components (Stencil) + API clients:

| Component group | Components |
|---|---|
| Auth | `<u-signin-root>`, `<u-signin-step>`, `<u-email-field>`, `<u-password-field>`, `<u-social-login-button>` |
| Profile | `<u-profile>`, `<u-field>`, `<u-full-profile>`, `<u-logout-button>` |
| Newsletter | `<u-newsletter-root>`, `<u-newsletter-checkbox>`, `<u-newsletter-preference-checkbox>` |
| Registration | `<u-registration-root>`, `<u-registration-step>` |
| Ticketable | `<u-ticketable-list>`, `<u-ticketable-export>` |
| Utilities | `<u-config>`, `<u-signed-in>`, `<u-flash-message>`, `<u-conditional-render>` |

API classes: `Auth` (token management, passkey, magic-code), `UnidyClient` singleton (profile, newsletters, tickets, subscriptions), standalone client (Node.js/serverless compatible).

### `@unidy.io/sdk-react`
React hooks: `useLogin`, `useSession`, `useProfile`, `useNewsletterSubscribe`, `useTicketables`, etc.

## Key Directories

```
packages/sdk/src/auth/         → Sign-in flow components, Auth class, passkey/magic-code logic
packages/sdk/src/api/          → Base client, standalone client, service definitions
packages/sdk/src/profile/      → Profile/field components
packages/sdk/src/newsletter/   → Newsletter subscription/preference components
packages/sdk/src/ticketable/   → Tickets & subscriptions display
packages/sdk/src/registration/ → Multi-step registration flow
packages/sdk-react/src/        → React hooks, provider, type bridges
packages/sdk/e2e/              → Playwright tests; demo pages in www/
```

## Connection to Main Rails App

- Communicates with a Unidy backend instance via REST API + OAuth
- Configured via `base-url` + `api-key` in `<u-config>`
- Token storage: access token (sessionStorage), refresh token (localStorage)
- Automatic token refresh on `getToken()` with 10-second expiry buffer

## Observability

- **Sentry** initialized in `packages/sdk/src/globalScript.ts` (production only, via `Build.isDev` guard)
- Because the SDK is embedded on customer pages, Sentry's default `GlobalHandlers` integration captures all unhandled errors on the page — not just SDK errors. Keep this in mind when triaging: many issues will be third-party noise (payment providers, analytics, search plugins, etc.)
- The SDK is typically bundled into customer Shopware plugins. Errors from these plugins will appear in our Sentry project but are not SDK bugs.

## Gotchas

- **Stencil store reactivity**: direct state access triggers re-renders; slotted components need manual subscription triggers — see `HasSlotContent` mixin + `@State() renderTrigger` pattern in CLAUDE.md
- **Tailwind**: components accept `class-name` props; an empty CSS file with `styleUrl` is required for Tailwind injection to work
- **i18n**: built-in translation system; customizable via `<u-config custom-translations="{...}">`
- **Preference token flow**: newsletter management via URL params (`preference_token`, `email`) without sign-in
- **Error codes**: consistent constants (e.g. `account_not_found`, `magic_code_expired`) — check `packages/sdk/src/api/` for full list
- **Build**: `bun run build` regenerates README from JSDoc; biome for lint/format
