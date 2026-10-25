import { type BrowserContext, test as base } from "@playwright/test";
import { loadAuthenticatedContext } from "./lib/helpers/session-storage";
import { type SignedInSession, signIn } from "./lib/helpers/sign-in";

type AuthenticatedFixtures = {
  signedIn: SignedInSession;
  authenticatedContext: BrowserContext;
};

export const test = base.extend<AuthenticatedFixtures>({
  // A sign-in per test: the backend's ID token can live just 2 minutes (qa2) and refresh tokens rotate,
  // so a session shared by the whole run signs every later test out once the run takes longer.
  // biome-ignore lint/correctness/noEmptyPattern: Playwright reads a fixture's dependencies from this pattern
  signedIn: async ({}, use) => {
    await use(await signIn());
  },
  // Auto-load authenticated context for all tests using this fixture
  authenticatedContext: async ({ context, signedIn }, use) => {
    await loadAuthenticatedContext(context, signedIn);
    await use(context);
  },
});

export { expect } from "@playwright/test";
