import { expect, test } from "@playwright/test";
import { routes } from "../../config";

// Expired JWT (exp: 2001-09-08, long in the past)
const EXPIRED_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJzaWQiOiJ0ZXN0LXNpZC0xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjEwMDAwMDAwMDAsImlhdCI6OTk5OTk5MDAwLCJpc3MiOiJ0ZXN0IiwiYXVkIjoidGVzdCIsIm5vbmNlIjoibiIsImF1dGhfdGltZSI6OTk5OTk5MDAwLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0.signature";

// Fresh JWT (exp: 2286, far in the future)
const FRESH_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJzaWQiOiJ0ZXN0LXNpZC0xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMCwiaXNzIjoidGVzdCIsImF1ZCI6InRlc3QiLCJub25jZSI6Im4iLCJhdXRoX3RpbWUiOjE3MDAwMDAwMDAsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.signature";

const SIGN_IN_ID = "test-sid-123";
const REFRESH_TOKEN = "valid-refresh-token";

function mockRefreshSuccess(page: import("@playwright/test").Page) {
  return page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/refresh_token/, (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ jwt: FRESH_JWT, refresh_token: "new-refresh-token" }),
      });
    } else {
      route.fallback();
    }
  });
}

test.describe("Session restore on init", () => {
  test("uses refresh token to restore session when access token is expired, without calling /signed_in", async ({ page }) => {
    // Seed expired access token + valid refresh token before the SDK initialises
    await page.addInitScript(
      ({ expiredJwt, signInId, refreshToken }) => {
        sessionStorage.setItem("unidy_token", expiredJwt);
        localStorage.setItem("unidy_signin_id", signInId);
        localStorage.setItem("unidy_refresh_token", refreshToken);
      },
      { expiredJwt: EXPIRED_JWT, signInId: SIGN_IN_ID, refreshToken: REFRESH_TOKEN },
    );

    await mockRefreshSuccess(page);

    // Track whether /signed_in is called
    let signedInCalled = false;
    await page.route(/\/api\/sdk\/v1\/sign_ins\/signed_in/, (route) => {
      signedInCalled = true;
      route.fallback();
    });

    await page.goto(routes.auth);

    // The user should be authenticated via the refreshed token
    await expect(page.getByTestId("signed.in.view")).toBeVisible();

    // The SSO cookie-check endpoint must not have been called
    expect(signedInCalled).toBe(false);
  });

  test("uses refresh token to restore session when no access token is present (e.g. after opening a new tab)", async ({ page }) => {
    // Simulate a user who previously logged in via the SDK (localStorage has SID + refresh token)
    // but the access token is gone (sessionStorage cleared when they opened a new tab)
    await page.addInitScript(
      ({ signInId, refreshToken }) => {
        localStorage.setItem("unidy_signin_id", signInId);
        localStorage.setItem("unidy_refresh_token", refreshToken);
      },
      { signInId: SIGN_IN_ID, refreshToken: REFRESH_TOKEN },
    );

    let refreshCalled = false;
    await page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/refresh_token/, (route) => {
      if (route.request().method() === "POST") {
        refreshCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ jwt: FRESH_JWT, refresh_token: "new-refresh-token" }),
        });
      } else {
        route.fallback();
      }
    });

    let signedInCalled = false;
    await page.route(/\/api\/sdk\/v1\/sign_ins\/signed_in/, (route) => {
      signedInCalled = true;
      route.fallback();
    });

    await page.goto(routes.auth);

    await expect(page.getByTestId("signed.in.view")).toBeVisible();
    expect(refreshCalled).toBe(true);
    expect(signedInCalled).toBe(false);
  });

  test("does not treat an expired token as valid when the refresh fails with a network error", async ({ page }) => {
    // Seed an expired token so the SDK has something to (incorrectly) return if the guard is missing
    await page.addInitScript(
      ({ expiredJwt, signInId, refreshToken }) => {
        sessionStorage.setItem("unidy_token", expiredJwt);
        localStorage.setItem("unidy_signin_id", signInId);
        localStorage.setItem("unidy_refresh_token", refreshToken);
      },
      { expiredJwt: EXPIRED_JWT, signInId: SIGN_IN_ID, refreshToken: REFRESH_TOKEN },
    );

    // Abort the refresh request to simulate a connection failure
    await page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/refresh_token/, (route) => {
      if (route.request().method() === "POST") {
        route.abort("failed");
      } else {
        route.fallback();
      }
    });

    await page.goto(routes.auth);

    // The user must NOT be shown as authenticated — the expired token must not have been returned
    await expect(page.getByTestId("signed.in.view")).not.toBeVisible();
    await expect(page.getByRole("textbox", { name: /e-?mail/i })).toBeVisible();
  });
});
