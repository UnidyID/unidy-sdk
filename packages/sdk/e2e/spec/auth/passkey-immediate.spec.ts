import { expect, type Page, test } from "@playwright/test";
import { routes } from "../../config";

type Request = { uiMode?: string; mediation?: string; allowCount: number; signal: boolean; aborted: boolean; activated: boolean };
type TestState = {
  requests: Request[];
  events: number;
  creations: { signal: boolean; aborted: boolean }[];
  resolveCreation: (index: number) => void;
  resolve: (index: number) => void;
  releaseEmailFocus?: () => void;
};
type TestWindow = Window & { passkeyTest: TestState };
type MockOptions = {
  capability?: "missing" | "false" | "throws";
  conditional?: boolean;
  unsupported?: boolean;
  immediate?: "success" | "null" | "NotAllowedError" | "SecurityError";
  verifyError?: string;
  delayChallenge?: boolean;
  nativeWebAuthn?: boolean;
  rpId?: string;
  lookup?: "new" | "password" | "locked" | "unconfirmed";
  creation?: "success" | "cancel" | "SecurityError" | "pending";
  lookupCreateRace?: boolean;
  creationVerifyError?: string;
  holdLookup?: boolean;
  holdCreationChallenge?: boolean;
  storedRid?: string;
  delayEmailHydration?: boolean;
};

const token = {
  jwt: `e30.${Buffer.from(JSON.stringify({ sub: "asserted-user", sid: "asserted-sid", email: "asserted@example.com", exp: 9999999999 })).toString("base64url")}.sig`,
  refresh_token: "mock-refresh-token",
};
const registrationToken = {
  jwt: `e30.${Buffer.from(JSON.stringify({ sub: "new-user", sid: "new-sid", email: "new@example.com", exp: 9999999999 })).toString("base64url")}.sig`,
  refresh_token: "registration-refresh-token",
};
const immediateButton = (page: Page) => page.locator('u-passkey[mode="immediate"] button').first();
const standardButton = (page: Page) => page.locator('u-passkey[mode="standard"] button');
const requests = (page: Page) => page.evaluate(() => (window as unknown as TestWindow).passkeyTest.requests);

async function setup(page: Page, options: MockOptions = {}) {
  const network = {
    challenges: 0,
    assertions: 0,
    emails: [] as string[],
    releaseChallenge: undefined as (() => void) | undefined,
    releaseLookup: undefined as (() => void) | undefined,
    releaseCreation: undefined as (() => void) | undefined,
    releaseEmail: undefined as (() => void) | undefined,
    registrations: 0,
    creationChallenges: 0,
    enrollments: 0,
    finalizes: 0,
    verificationSends: 0,
    challengeSids: [] as (string | null)[],
    profileUpdates: [] as object[],
    passwordUpdates: [] as string[],
  };
  const flow = {
    rid: "new-rid",
    email: "new@example.com",
    newsletter_preferences: {},
    registration_profile_data: {} as Record<string, unknown>,
    social_provider: null,
    status: {} as Record<string, boolean>,
    created_at: "2026-11-05T00:00:00Z",
    updated_at: "2026-11-05T00:00:00Z",
    expires_at: "2026-11-06T00:00:00Z",
    has_passkey: false,
    has_password: false,
    expired: false,
    can_finalize: false,
    email_verified: false,
  };
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // A missing optional captcha config is an expected 404, not an application error.
    if (message.type() === "error" && !message.location().url.includes("/captcha_config")) errors.push(message.text());
  });
  await page.route("**/api/sdk/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let status = 200;
    let body: object;
    if (path.endsWith("/passkeys/new")) {
      network.challenges++;
      network.challengeSids.push(new URL(route.request().url()).searchParams.get("sid"));
      if (options.delayChallenge && network.challenges === 1) {
        await new Promise<void>((resolve) => {
          network.releaseChallenge = resolve;
        });
      }
      body = {
        challenge: "Y2hhbGxlbmdl",
        rpId: options.rpId ?? "localhost",
        timeout: 60000,
        userVerification: "required",
        allowCredentials: new URL(route.request().url()).searchParams.has("sid") ? [{ type: "public-key", id: "YWJj" }] : [],
      };
    } else if (path.endsWith("/passkeys")) {
      network.assertions++;
      status = options.verifyError ? 422 : 200;
      body = options.verifyError ? { error_identifier: options.verifyError } : token;
    } else if (path.endsWith("/sign_ins")) {
      const payload = route.request().postDataJSON();
      network.emails.push(payload.email);
      if (options.holdLookup)
        await new Promise<void>((resolve) => {
          network.releaseLookup = resolve;
        });
      if (options.lookup === "new" || options.lookup === "locked" || options.lookup === "unconfirmed") {
        status = options.lookup === "new" ? 404 : 422;
        body = {
          error_identifier:
            options.lookup === "new" ? "account_not_found" : options.lookup === "locked" ? "account_locked" : "account_unconfirmed",
        };
      } else {
        body = {
          sid: "typed-sid",
          status: "pending_verification",
          email: payload.email,
          expired: false,
          login_options: { password: true, passkey: options.lookup !== "password", magic_link: true, social_logins: ["google"] },
        };
      }
    } else if (path.endsWith("/registration")) {
      if (route.request().method() === "POST") {
        network.registrations++;
        if (options.lookupCreateRace) {
          status = 422;
          body = { error_identifier: "email_already_registered" };
        } else {
          flow.email = route.request().postDataJSON().email;
          body = flow;
        }
      } else {
        const payload = route.request().method() === "PATCH" ? route.request().postDataJSON() : {};
        if (payload.registration_profile_data) {
          network.profileUpdates.push(payload.registration_profile_data);
          Object.assign(flow.registration_profile_data, payload.registration_profile_data);
        }
        if (payload.password) {
          network.passwordUpdates.push(payload.password);
          flow.has_password = true;
        }
        flow.can_finalize = !!flow.registration_profile_data.first_name && (flow.has_passkey || flow.has_password);
        body = flow;
      }
    } else if (path.endsWith("/registration/passkey/new")) {
      network.creationChallenges++;
      if (options.holdCreationChallenge)
        await new Promise<void>((resolve) => {
          network.releaseCreation = resolve;
        });
      body = {
        challenge: "Y2hhbGxlbmdl",
        timeout: 60000,
        rp: { id: "localhost", name: "Unidy" },
        user: { id: "bmV3LXVzZXI", name: flow.email, displayName: flow.email },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      };
    } else if (path.endsWith("/registration/passkey")) {
      network.enrollments++;
      if (options.creationVerifyError) {
        status = 422;
        body = { error_identifier: options.creationVerifyError };
      } else {
        flow.has_passkey = true;
        body = flow;
      }
    } else if (path.endsWith("/registration/email_verification/send_code")) {
      network.verificationSends++;
      body = { success: true, enable_resend_after: 0 };
    } else if (path.endsWith("/registration/email_verification/verify")) {
      flow.email_verified = true;
      body = flow;
    } else if (path.endsWith("/registration/finalize")) {
      network.finalizes++;
      if (!flow.registration_profile_data.first_name || !(flow.has_password || flow.has_passkey)) {
        status = 422;
        body = { error_identifier: "cannot_finalize", meta: { missing_fields: ["first_name"] } };
      } else
        body = {
          ...flow,
          status: { completed: true },
          auth: { id_token: registrationToken.jwt, refresh_token: registrationToken.refresh_token },
        };
    } else if (path.includes("/sign_ins/") && path.endsWith("/authenticate")) {
      body = token;
    } else {
      status = 404;
      body = { error_identifier: "not_found" };
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  if (options.delayEmailHydration) {
    await page.route("**/build/*.entry.js", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (body.includes("u_email_field")) {
        await new Promise<void>((resolve) => {
          network.releaseEmail = resolve;
        });
      }
      await route.fulfill({ response, body });
    });
  }
  await page.addInitScript((settings) => {
    if (settings.storedRid) localStorage.setItem("unidy_registration_id", settings.storedRid);
    const credential = () => ({
      id: "asserted-user-passkey",
      rawId: new Uint8Array([1]).buffer,
      type: "public-key",
      response: {
        authenticatorData: new Uint8Array([2]).buffer,
        clientDataJSON: new Uint8Array([3]).buffer,
        signature: new Uint8Array([4]).buffer,
      },
    });
    const resolvers: (() => void)[] = [];
    const creationResolvers: (() => void)[] = [];
    const state: TestState = {
      requests: [],
      creations: [],
      events: 0,
      resolve: (index) => resolvers[index](),
      resolveCreation: (index) => creationResolvers[index](),
    };
    (window as unknown as TestWindow).passkeyTest = state;
    document.addEventListener("authEvent", () => state.events++);
    if (settings.nativeWebAuthn) return;
    const MockPublicKeyCredential = {
      async getClientCapabilities() {
        if (settings.capability === "throws") throw new Error("capabilities unavailable");
        return { immediateGet: settings.capability !== "false" };
      },
      async isConditionalMediationAvailable() {
        return settings.conditional !== false;
      },
    };
    if (settings.capability === "missing") Reflect.deleteProperty(MockPublicKeyCredential, "getClientCapabilities");
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: settings.unsupported ? undefined : MockPublicKeyCredential,
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: {
        create: (request: CredentialCreationOptions) => {
          const entry = { signal: !!request.signal, aborted: false };
          const index = state.creations.push(entry) - 1;
          const created = () => ({
            ...credential(),
            response: { attestationObject: new Uint8Array([5]).buffer, clientDataJSON: new Uint8Array([3]).buffer },
          });
          if (settings.creation === "cancel" || settings.creation === "SecurityError")
            return Promise.reject(
              new DOMException("mock creation outcome", settings.creation === "cancel" ? "NotAllowedError" : "SecurityError"),
            );
          if (settings.creation !== "pending") return Promise.resolve(created());
          return new Promise((resolve, reject) => {
            creationResolvers[index] = () => resolve(created());
            request.signal?.addEventListener("abort", () => {
              entry.aborted = true;
              reject(new DOMException("cancelled", "AbortError"));
            });
          });
        },
        get: (request: CredentialRequestOptions & { uiMode?: string }) => {
          const entry = {
            uiMode: request.uiMode,
            mediation: request.mediation,
            allowCount: request.publicKey.allowCredentials?.length ?? 0,
            signal: !!request.signal,
            aborted: false,
            activated: navigator.userActivation?.isActive ?? false,
          };
          const index = state.requests.push(entry) - 1;
          if (request.uiMode && settings.immediate) {
            if (settings.immediate === "success") return Promise.resolve(credential());
            if (settings.immediate === "null") return Promise.resolve(null);
            return Promise.reject(new DOMException("mock authenticator result", settings.immediate));
          }
          return new Promise((resolve, reject) => {
            resolvers[index] = () => resolve(credential());
            request.signal?.addEventListener("abort", () => {
              entry.aborted = true;
              reject(new DOMException("cancelled", "AbortError"));
            });
          });
        },
      },
    });
  }, options);
  await page.goto(routes.passkey, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("Unidy Immediate Passkey Demo");
  await expect(page.getByRole("heading", { name: "Passkey sign-in" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
  if (!options.unsupported && !options.delayChallenge) await expect(immediateButton(page)).not.toHaveAttribute("aria-disabled", "true");
  return { network, errors };
}

async function resolveCredential(page: Page, index: number) {
  await page.evaluate((requestIndex) => (window as unknown as TestWindow).passkeyTest.resolve(requestIndex), index);
}

async function expectSession(page: Page) {
  await expect(page.getByRole("status")).toHaveText("You are signed in.");
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("unidy_signin_id"))).toBe("asserted-sid");
  expect(await page.evaluate(() => localStorage.getItem("unidy_email"))).toBe("asserted@example.com");
  expect(await page.evaluate(() => localStorage.getItem("unidy_refresh_token"))).toBe(token.refresh_token);
  expect(await page.evaluate(() => sessionStorage.getItem("unidy_token"))).toBe(token.jwt);
}

test("trusted keyboard immediate sign-in uses prefetched options and completes the session once", async ({ page }) => {
  const { network, errors } = await setup(page, { immediate: "success" });
  await expect.poll(() => network.challenges).toBe(1);
  await page.screenshot({ path: "/tmp/unidy-sdk-passkey-desktop.png" });
  await immediateButton(page).press("Enter");
  expect(await requests(page)).toEqual([expect.objectContaining({ uiMode: "immediate", signal: false, allowCount: 0, activated: true })]);
  await expectSession(page);
  expect(network.assertions).toBe(1);
  expect(errors).toEqual([]);
});

for (const capability of ["missing", "false", "throws"] as const) {
  test(`capability ${capability} offers conditional autofill without opening modal UI`, async ({ page }) => {
    await setup(page, { capability });
    await expect.poll(async () => (await requests(page)).length).toBe(1);
    const email = page.getByRole("textbox", { name: "Email" });
    await expect(email).toHaveAttribute("autocomplete", "username webauthn");
    await expect(email).toBeEnabled();
    await expect(email).toBeFocused();
    await immediateButton(page).click();
    await expect(email).toBeFocused();
    expect(await requests(page)).toEqual([expect.objectContaining({ mediation: "conditional", signal: true })]);
    await resolveCredential(page, 0);
    await expectSession(page);
  });
}

test("conditional fallback focuses email after delayed lazy hydration", async ({ page }) => {
  const { network } = await setup(page, { capability: "false", delayEmailHydration: true });
  expect(network.releaseEmail).toBeDefined();
  network.releaseEmail();
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeFocused();
});

test("delayed fallback does not steal focus after another user action", async ({ page }) => {
  await setup(page, { capability: "false" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await page.locator('u-passkey[mode="immediate"]').evaluate((element: HTMLUPasskeyElement) => {
    element.active = false;
  });
  await expect.poll(async () => (await requests(page))[0].aborted).toBe(true);
  await page.locator("u-email-field").evaluate((element: HTMLUEmailFieldElement) => {
    element.componentOnReady = () =>
      new Promise((resolve) => {
        (window as unknown as TestWindow).passkeyTest.releaseEmailFocus = () => resolve(element);
      });
  });
  await page.locator('u-passkey[mode="immediate"]').evaluate((element: HTMLUPasskeyElement) => {
    element.active = true;
  });
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  await standardButton(page).focus();
  await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.releaseEmailFocus());
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await expect(standardButton(page)).toBeFocused();
});

for (const immediate of ["null", "NotAllowedError"] as const) {
  test(`immediate ${immediate} focuses email and starts conditional mediation`, async ({ page }) => {
    await setup(page, { immediate });
    await immediateButton(page).click();
    const email = page.getByRole("textbox", { name: "Email" });
    await expect(email).toBeFocused();
    await expect(email).toBeEnabled();
    await expect.poll(async () => (await requests(page)).length).toBe(2);
    await email.fill("different@example.com");
    await resolveCredential(page, 1);
    await expectSession(page);
  });
}

test("change/autofill and input stay synchronized while listening; normal email/password flow still works", async ({ page }) => {
  const { network } = await setup(page, { capability: "false" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  const email = page.getByRole("textbox", { name: "Email" });
  await email.evaluate((input: HTMLInputElement) => {
    input.value = "autofilled@example.com";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.getByRole("button", { name: "Continue with email" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  expect(network.emails).toEqual(["autofilled@example.com"]);
  expect((await requests(page))[0].aborted).toBe(true);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("password123");
  await page.getByRole("textbox", { name: "Password", exact: true }).press("Enter");
  await expect(page.getByRole("status")).toHaveText("You are signed in.");
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(1);
});

test("explicit standard button cancels conditional and supports external/cross-device UI", async ({ page }) => {
  await setup(page, { capability: "false" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await standardButton(page).click();
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  const calls = await requests(page);
  expect(calls[0].aborted).toBe(true);
  expect(calls[1]).toMatchObject({ signal: true, allowCount: 0 });
  expect(calls[1].uiMode).toBeUndefined();
  expect(calls[1].mediation).toBeUndefined();
  await resolveCredential(page, 1);
  await expectSession(page);
});

test("repeated trusted clicks issue one immediate ceremony and one authEvent", async ({ page }) => {
  const { network } = await setup(page);
  await immediateButton(page).dblclick();
  expect(await requests(page)).toHaveLength(1);
  await resolveCredential(page, 0);
  await expectSession(page);
  expect(network.assertions).toBe(1);
});

test("programmatic clicks cannot invoke immediate UI", async ({ page }) => {
  await setup(page);
  await immediateButton(page).evaluate((button: HTMLButtonElement) => button.click());
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  expect((await requests(page))[0].uiMode).toBeUndefined();
  expect((await requests(page))[0].mediation).toBe("conditional");
});

test("closing with Escape cancels listening; reopening starts a fresh challenge", async ({ page }) => {
  const { network } = await setup(page, { capability: "false" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect.poll(async () => (await requests(page))[0].aborted).toBe(true);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  expect(network.challenges).toBe(2);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect.poll(async () => (await requests(page))[1].aborted).toBe(true);
  expect(network.assertions).toBe(0);
});

test("close during immediate UI ignores its stale result", async ({ page }) => {
  const { network } = await setup(page);
  await immediateButton(page).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await resolveCredential(page, 0);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(network.assertions).toBe(0);
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(0);
});

test("SecurityError remains visible and does not silently fall back", async ({ page }) => {
  await setup(page, { immediate: "SecurityError" });
  await immediateButton(page).click();
  await expect(page.locator("#passkey-error")).not.toBeEmpty();
  expect(await requests(page)).toHaveLength(1);
  await expect(page.getByRole("textbox", { name: "Email" })).toBeEnabled();
});

test("backend assertion verification failures remain visible", async ({ page }) => {
  await setup(page, { capability: "false", verifyError: "verification_failed" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await resolveCredential(page, 0);
  await expect(page.locator('u-error-message[for="general"]')).toContainText("Verification failed");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(0);
});

for (const unsupported of [true, false]) {
  test(`manual email login remains usable without ${unsupported ? "WebAuthn" : "conditional support"}`, async ({ page }) => {
    await setup(page, { unsupported, capability: "false", conditional: false });
    await page.getByRole("textbox", { name: "Email" }).fill("manual@example.com");
    await page.getByRole("textbox", { name: "Email" }).press("Enter");
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
    expect(await requests(page)).toHaveLength(0);
  });
}

test("mobile layout and keyboard focus remain usable during fallback", async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { errors } = await setup(page, { immediate: "NotAllowedError" });
  await immediateButton(page).press("Space");
  const email = page.getByRole("textbox", { name: "Email" });
  await expect(email).toBeFocused();
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  await email.fill("keyboard@example.com");
  await expect(page.getByRole("button", { name: "Continue with email" })).toBeEnabled();
  // Safari on macOS uses Option+Tab to include buttons in sequential keyboard navigation.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("button", { name: "Continue with email" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "/tmp/unidy-sdk-passkey-mobile.png" });
});

test("closing during a delayed challenge drains its cookie write before reopening prepares again", async ({ page }) => {
  const { network } = await setup(page, { delayChallenge: true, immediate: "success" });
  await expect.poll(() => network.challenges).toBe(1);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(immediateButton(page)).toHaveAttribute("aria-busy", "true");
  expect(network.challenges).toBe(1);
  network.releaseChallenge();
  await expect.poll(() => network.challenges).toBe(2);
  await expect(immediateButton(page)).not.toHaveAttribute("aria-busy", "true");
  expect(await requests(page)).toHaveLength(0);
  await immediateButton(page).click();
  await expectSession(page);
});

test("removing the sign-in surface cancels conditional listening", async ({ page }) => {
  const { network } = await setup(page, { capability: "false" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await page.locator("u-signin-root").evaluate((root) => root.remove());
  await expect.poll(async () => (await requests(page))[0].aborted).toBe(true);
  expect(network.assertions).toBe(0);
});

test("native WebAuthn rejects an RP ID unrelated to the current origin", async ({ page }) => {
  await setup(page, { nativeWebAuthn: true, rpId: "unrelated.example" });
  await standardButton(page).click();
  await expect(page.locator("#passkey-error")).toContainText("Passkey security error");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(0);
});

test("returning from the password step prepares immediate UI again", async ({ page }) => {
  const { network } = await setup(page, { immediate: "success" });
  await page.locator('u-passkey[mode="immediate"]').evaluate((element: HTMLUPasskeyElement) => {
    element.continueWithPasskey = false;
  });
  await page.getByRole("textbox", { name: "Email" }).fill("manual@example.com");
  await page.getByRole("textbox", { name: "Email" }).press("Enter");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect.poll(() => network.challenges).toBe(2);
  await expect(immediateButton(page)).not.toHaveAttribute("aria-disabled", "true");
  expect(await requests(page)).toHaveLength(0);
  await immediateButton(page).click();
  await expectSession(page);
  expect((await requests(page))[0].uiMode).toBe("immediate");
});

test("conditional-only mode keeps email enabled and focuses autofill without standard UI", async ({ page }) => {
  await setup(page, { capability: "false" });
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await page.locator('u-passkey[mode="immediate"]').evaluate((element: HTMLUPasskeyElement) => {
    element.mode = "conditional";
  });
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  const button = page.locator("u-passkey").first().locator("button");
  await button.click();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeEnabled();
  const calls = await requests(page);
  expect(calls[0].aborted).toBe(true);
  expect(calls.every((request) => request.mediation === "conditional" && !request.uiMode)).toBe(true);
  await resolveCredential(page, 1);
  await expectSession(page);
});

test("submit synchronizes an autofill value even when the password manager emits no input event", async ({ page }) => {
  const { network } = await setup(page, { capability: "false" });
  const email = page.getByRole("textbox", { name: "Email" });
  await email.evaluate((input: HTMLInputElement) => {
    input.value = "silent-autofill@example.com";
  });
  await email.press("Enter");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  expect(network.emails).toEqual(["silent-autofill@example.com"]);
});

async function typedContinue(page: Page, email = "new@example.com") {
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await expect(immediateButton(page)).toHaveAccessibleName("Continue with passkey");
  await immediateButton(page).click();
}

async function verifyAndFillProfile(page: Page) {
  await expect(page.getByRole("heading", { name: "Verify your email", exact: true })).toBeVisible();
  for (let index = 1; index <= 4; index++) await page.getByRole("textbox", { name: `Digit ${index} of 4` }).fill(String(index));
  await expect(page.getByRole("heading", { name: "Your profile", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "First name", exact: true }).fill("Alice");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
}

async function expectRegistrationSession(page: Page) {
  await expect(page.getByRole("status")).toHaveText("You are signed in.");
  expect(await page.evaluate(() => localStorage.getItem("unidy_signin_id"))).toBe("new-sid");
  expect(await page.evaluate(() => localStorage.getItem("unidy_email"))).toBe("new@example.com");
  expect(await page.evaluate(() => localStorage.getItem("unidy_refresh_token"))).toBe(registrationToken.refresh_token);
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(1);
}

test("typed-email passkey continuation looks up an existing account and prompts with its allowlist", async ({ page }) => {
  const { network } = await setup(page);
  await typedContinue(page, "existing@example.com");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  await expect(page.locator('u-signin-step[name="verification"] u-passkey button')).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible();
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  expect((await requests(page))[0]).toMatchObject({ allowCount: 1, signal: true });
  expect((await requests(page))[0].uiMode).toBeUndefined();
  expect(network.challengeSids.at(-1)).toBe("typed-sid");
  expect(network.registrations).toBe(0);
  expect(network.creationChallenges).toBe(0);
  await resolveCredential(page, 0);
  await expectSession(page);
});

test("existing email without passkeys keeps its offered password/social methods and never enrolls", async ({ page }) => {
  const { network } = await setup(page, { lookup: "password" });
  await typedContinue(page, "existing@example.com");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible();
  expect(await requests(page)).toHaveLength(0);
  expect(network.registrations).toBe(0);
  expect(network.creationChallenges).toBe(0);
});

for (const lookup of ["locked", "unconfirmed"] as const) {
  test(`typed-email ${lookup} does not enter registration`, async ({ page }) => {
    const { network } = await setup(page, { lookup });
    await typedContinue(page, "existing@example.com");
    await expect(
      page.getByText(lookup === "locked" ? "Account locked" : "Please confirm your email before signing in.", { exact: true }),
    ).toBeVisible();
    expect(network.registrations).toBe(0);
    expect(network.creationChallenges).toBe(0);
  });
}

test("new email creates a passkey flow but retains verification, required profile, onboarding and finalization", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", creation: "success" });
  await typedContinue(page);
  await expect(page.getByRole("img", { name: "Passkey registered" })).toBeVisible();
  expect(network.registrations).toBe(1);
  expect(network.enrollments).toBe(1);
  expect(network.finalizes).toBe(0);
  expect(network.verificationSends).toBe(0);
  expect(await page.evaluate(() => (window as unknown as TestWindow).passkeyTest.events)).toBe(0);
  await page.getByRole("button", { name: "Continue registration", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify your email", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Digit 1 of 4" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Verify your email", exact: true })).toBeVisible();
  expect(network.finalizes).toBe(0);
  await verifyAndFillProfile(page);
  await expect(page.getByRole("heading", { name: "Complete registration", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create a password", exact: true })).not.toBeVisible();
  expect(network.profileUpdates.some((profile) => "first_name" in profile)).toBe(true);
  expect(network.passwordUpdates).toHaveLength(0);
  expect(network.finalizes).toBe(0);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expectRegistrationSession(page);
  expect(network.finalizes).toBe(1);
});

test("cancelled creation offers normal password registration without skipping verification/profile", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", creation: "cancel" });
  await typedContinue(page);
  await expect(page.getByRole("button", { name: "Continue with password", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Continue with password", exact: true }).click();
  await verifyAndFillProfile(page);
  await expect(page.getByRole("heading", { name: "Create a password", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "New password", exact: true }).fill("StrongPassword123!");
  await page.getByRole("button", { name: "Save password", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Complete registration", exact: true })).toBeVisible();
  expect(network.enrollments).toBe(0);
  expect(network.finalizes).toBe(0);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expectRegistrationSession(page);
  expect(network.passwordUpdates).toContain("StrongPassword123!");
});

test("registration verification failures preserve their server identifier", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", creationVerifyError: "passkey_verification_failed" });
  await typedContinue(page);
  await expect(page.locator('u-registration-root u-error-message[for="passkey"]')).toHaveText("passkey_verification_failed");
  expect(network.finalizes).toBe(0);
  await expect(page.getByRole("button", { name: "Continue with password", exact: true })).toBeEnabled();
});

test("lookup/create race does not enroll into an email that has become registered", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", lookupCreateRace: true });
  await typedContinue(page);
  await expect(page.locator('u-signin-root > u-error-message[for="general"]')).toHaveText(
    "This email is already registered. Please sign in instead",
  );
  expect(network.creationChallenges).toBe(0);
  expect(network.enrollments).toBe(0);
});

test("a saved registration offers an explicit keyboard start-over without silently replacing the draft", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", storedRid: "saved-rid", creation: "cancel" });
  await typedContinue(page);
  const restart = page.getByRole("button", { name: "Start a new registration", exact: true });
  await expect(restart).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("unidy_registration_id"))).toBe("saved-rid");
  expect(network.registrations).toBe(0);
  expect(network.creationChallenges).toBe(0);
  await restart.press("Enter");
  await expect(page.getByRole("button", { name: "Continue with password", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("unidy_registration_id"))).toBe("new-rid");
  expect(network.registrations).toBe(1);
  expect(network.finalizes).toBe(0);
});

test("failed start-over retains the saved registration and the server error identifier", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", storedRid: "saved-rid", lookupCreateRace: true });
  await typedContinue(page);
  await page.getByRole("button", { name: "Start a new registration", exact: true }).click();
  await expect(page.locator('u-signin-root > u-error-message[for="general"]')).toHaveText(
    "This email is already registered. Please sign in instead",
  );
  expect(await page.evaluate(() => localStorage.getItem("unidy_registration_id"))).toBe("saved-rid");
  expect(network.enrollments).toBe(0);
});

test("invalid typed email focuses the input without lookup or WebAuthn", async ({ page }) => {
  const { network } = await setup(page);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("not-an-email");
  await immediateButton(page).click();
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeFocused();
  expect(network.emails).toHaveLength(0);
  expect(await requests(page)).toHaveLength(0);
});

test("close during typed lookup ignores a late new-email response", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", holdLookup: true });
  await typedContinue(page);
  await expect.poll(() => network.emails.length).toBe(1);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  network.releaseLookup();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(network.registrations).toBe(0);
  expect(network.creationChallenges).toBe(0);
});

test("closing a delayed registration challenge never opens a stale creation prompt", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", holdCreationChallenge: true });
  await typedContinue(page);
  await expect.poll(() => network.creationChallenges).toBe(1);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  network.releaseCreation();
  await expect.poll(async () => page.evaluate(() => (window as unknown as TestWindow).passkeyTest.creations.length)).toBe(0);
  expect(network.enrollments).toBe(0);
  expect(network.finalizes).toBe(0);
});

test("closing registration aborts pending creation and prevents enrollment", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", creation: "pending" });
  await typedContinue(page);
  await expect.poll(async () => page.evaluate(() => (window as unknown as TestWindow).passkeyTest.creations.length)).toBe(1);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect.poll(async () => page.evaluate(() => (window as unknown as TestWindow).passkeyTest.creations[0].aborted)).toBe(true);
  expect(network.enrollments).toBe(0);
});

test("typed continuation deduplicates repeated clicks while looking up an email", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", holdLookup: true });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("new@example.com");
  await immediateButton(page).dblclick();
  await expect.poll(() => network.emails.length).toBe(1);
  network.releaseLookup();
  await expect(page.getByRole("img", { name: "Passkey registered" })).toBeVisible();
  expect(network.registrations).toBe(1);
  expect(network.enrollments).toBe(1);
});

test("typed-email continuation is opt-in; disabling it preserves discovery behavior", async ({ page }) => {
  const { network } = await setup(page, { immediate: "success" });
  await page.locator('u-passkey[mode="immediate"]').evaluate((element: HTMLUPasskeyElement) => {
    element.continueWithPasskey = false;
  });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("typed@example.com");
  await immediateButton(page).click();
  await expectSession(page);
  expect(network.emails).toHaveLength(0);
  expect((await requests(page))[0].uiMode).toBe("immediate");
});

test("mobile keyboard continuation focuses the password fallback after cancelled creation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, { lookup: "new", creation: "cancel" });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("new@example.com");
  await immediateButton(page).press("Enter");
  const fallback = page.getByRole("button", { name: "Continue with password", exact: true });
  await expect(fallback).toBeFocused();
  expect(await fallback.evaluate((button) => Number.parseFloat(getComputedStyle(button).outlineWidth))).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/unidy-sdk-passkey-registration-mobile.png" });
  await fallback.press("Enter");
  await expect(page.getByRole("heading", { name: "Verify your email", exact: true })).toBeVisible();
});

test("unsupported browsers keep normal password registration without attempting enrollment", async ({ page }) => {
  const { network } = await setup(page, { lookup: "new", unsupported: true });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("new@example.com");
  await page.getByRole("textbox", { name: "Email", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Start registration", exact: true }).click();
  await page.getByRole("button", { name: "Continue with password", exact: true }).click();
  await verifyAndFillProfile(page);
  await expect(page.getByRole("heading", { name: "Create a password", exact: true })).toBeVisible();
  expect(network.creationChallenges).toBe(0);
  expect(network.enrollments).toBe(0);
  await page.getByRole("textbox", { name: "New password", exact: true }).fill("StrongPassword123!");
  await page.getByRole("button", { name: "Save password", exact: true }).click();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expectRegistrationSession(page);
});

test("typed-account verification failures stay visible alongside existing login methods", async ({ page }) => {
  const { network } = await setup(page, { verifyError: "verification_failed" });
  await typedContinue(page, "existing@example.com");
  await expect.poll(async () => (await requests(page)).length).toBe(1);
  await resolveCredential(page, 0);
  await expect(page.locator('u-signin-root > u-error-message[for="general"]')).toHaveText("Verification failed");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  expect(network.registrations).toBe(0);
  expect(network.enrollments).toBe(0);
});
