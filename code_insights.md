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
| Ticket transfers | `<u-ticket-transfer-list>`, `<u-ticket-transfer-form>`, `<u-ticket-transfer-action>` |
| Utilities | `<u-config>`, `<u-signed-in>`, `<u-flash-message>`, `<u-conditional-render>` |

API classes: `Auth` (token management, passkey, magic-code), `UnidyClient` singleton (profile, newsletters, tickets, ticketTransfers, subscriptions), standalone client (Node.js/serverless compatible).

New services must be registered in THREE places: `UnidyClient` (api/index.ts), `StandaloneUnidyClient` (api/standalone.ts, plus its `export`/`export type *` lines), and `ReactUnidyClient` (sdk-react/src/client.ts re-instantiates every service with its token-refreshing deps).

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
- **Error codes**: consistent constants (e.g. `account_not_found`, `magic_code_expired`) — check `packages/sdk/src/api/` for full list. Ticket-transfer endpoints return domain errors via `error_identifier` in the body (`transfer_already_pending`, `recipient_mismatch`, …) — see `ticketable/api/ticket-transfers.ts`
- **Build**: `bun run build` regenerates README from JSDoc; biome for lint/format. Note: `bun run build` runs `clean` (removes `www/`, `.stencil`), which corrupts a concurrently-running `bun run dev` watcher — its TypeScript diagnostics go stale and its error overlay blocks e2e clicks. Restart the dev server after a prod build
- **Stencil slots (shadow: false)**: a component must render at least one `<slot>` outlet in EVERY render state, otherwise Stencil's slot handling never runs and slotted content (e.g. `slot="empty"`) stays visible alongside rendered items. Never re-parent a slot outlet between renders (e.g. moving it into a `<div hidden>` wrapper) — relocated light-DOM content gets dropped from the DOM. See `ticket-transfer-list.tsx` / `ticketable-list.tsx` (both keep a constant trailing slot outlet)
- **Result tuples**: destructuring `const [error, data] = ...` doesn't narrow `data` (the `schema_validation_error` payload is non-null) — guard with `!("token" in data)`-style checks like `ticketable-export` does
- **Stencil renders disconnected components**: in Stencil 4.38.3, `setValue` schedules an update whenever the component `hasRendered` — there is NO `isConnected` guard (verified in `node_modules/@stencil/core/internal/client/index.js`; only `forceUpdate` checks connectivity). So an in-flight async task that writes `@State` after `disconnectedCallback` still triggers a full re-render and `componentDidRender` on the detached element. Any `componentDidRender` side effects that touch the live document (e.g. `requestAnimationFrame`-deferred `renderToTarget` writing into an external `target` container) will run after disconnect and can undo `disconnectedCallback` cleanup — guard such paths with `this.element.isConnected`. Also: reconnecting an already-initialized component (DOM move) re-runs `connectedCallback` but never `componentDidLoad` and schedules no render

## E2E (local)

- Requires the Rails backend on `localhost:3000`; specs manipulate backend state via test-only routes `/test/db/<Model>` (`e2e/lib/database`, `X-Test-Secret` header, blank secret in dev)
- `auth.setup.ts` signs in through the real UI — a `CaptchaConfig` with `login_enabled: true` on the backend breaks the entire suite ("Security verification failed"). Toggle via `PATCH /test/db/CaptchaConfig/:id {"data":{"login_enabled":false}}` and restore afterwards
- Full-suite runs against the stencil dev server flake under parallel worker load (stalled hydration/lazy chunks). The CI profile is reliable locally: `bun run build && bun run e2e:configure && E2E_SDK_BASE_URL=http://localhost:3000 bunx playwright test --project=chromium` (serves static `www/`)
- `newsletter-logged-out` / `manage-subscriptions-logged-out` specs fail locally as of 2026-07 regardless of branch (backend test-data issue, captcha-independent) — pre-existing, not a regression signal
