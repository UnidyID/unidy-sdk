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
- DSN points to `de.sentry.io` (EU region), org slug: `unidy`, project slug: `sdk`
- As of SDK 1.7.0, no `allowUrls` filter is set — Sentry captures all unhandled errors and rejections on the embedding page, including third-party scripts (PostHog, Algolia, PayPal, etc.). A fix to add `allowUrls: [window.location.origin]` is pending.
- Common Sentry noise to expect until fix lands: PostHog tracker errors, Algolia search plugin errors, PayPal script errors, view transition aborts (all from `shop.sv98.de`)

## Known Customer Deployments

| Site | SDK version (as observed) | Notes |
|---|---|---|
| `shop.sv98.de` | current (via `fuexc-unidy-login` bundle) | Most active; view transition + PostHog noise in Sentry |
| `sportdeutschland.unidy.de` | 1.6.0 | Occasional `Failed to fetch` errors |
| `holstein-sdk-demo.unidy.de` | 1.3.0 | **Outdated** — still on 1.3.0, causing `u-ticketable-export#undefined` errors (SDK-7P) |
| `localhost:3333` | dev | Internal dev/CI traffic shows up in Sentry production project (SDK-9P) |

The SDK is typically bundled into customer Shopware plugins with the `fuexc-` prefix (e.g. `fuexc-unidy-login`, `fuexchen-algolia-search`). These are separate from our npm package and deployed independently by customers.

## Gotchas

- **Stencil store reactivity**: direct state access triggers re-renders; slotted components need manual subscription triggers — see `HasSlotContent` mixin + `@State() renderTrigger` pattern in CLAUDE.md
- **Tailwind**: components accept `class-name` props; an empty CSS file with `styleUrl` is required for Tailwind injection to work
- **i18n**: built-in translation system; customizable via `<u-config custom-translations="{...}">`
- **Preference token flow**: newsletter management via URL params (`preference_token`, `email`) without sign-in
- **Error codes**: consistent constants (e.g. `account_not_found`, `magic_code_expired`) — check `packages/sdk/src/api/` for full list
- **Build**: `bun run build` regenerates README from JSDoc; biome for lint/format
