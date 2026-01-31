import { type BrowserContext, test as base } from "@playwright/test";
import { loadAuthenticatedContext } from "./lib/helpers/session-storage";

type AuthenticatedFixtures = {
  authenticatedContext: BrowserContext;
};

export const test = base.extend<AuthenticatedFixtures>({
  // Auto-load authenticated context for all tests using this fixture
  authenticatedContext: async ({ context }, use) => {
    await loadAuthenticatedContext(context);
    await use(context);
  },
});

export { expect } from "@playwright/test";
