import { BrowserClient, defaultStackParser, makeFetchTransport, Scope } from "@sentry/browser";

const DSN = "https://d4cc4e5f6d985e61c56330dd27d104d6@o4507882295132160.ingest.de.sentry.io/4510443854037072";

export interface CaptureContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

let scope: Scope | undefined;

/**
 * Starts an isolated Sentry client that is never registered globally. The SDK is embedded on customer pages,
 * so a global `Sentry.init` would capture every unhandled error on the page and could collide with the
 * customer's own Sentry. Only errors passed to `captureException` are reported.
 */
export function initSentry(): void {
  if (scope) return;

  const client = new BrowserClient({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations: [],
  });

  const isolatedScope = new Scope();
  isolatedScope.setClient(client);
  client.init();
  scope = isolatedScope;
}

/** Reports an error to the SDK's Sentry project. No-op until `initSentry` has run (e.g. in dev builds). */
export function captureException(error: unknown, context?: CaptureContext): void {
  if (!scope) return;

  const eventScope = scope.clone();
  if (context?.tags) eventScope.setTags(context.tags);
  if (context?.extra) eventScope.setExtras(context.extra);
  eventScope.captureException(error);
}
