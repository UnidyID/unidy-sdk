import { expect, test } from "@playwright/test";
import { routes } from "../../../config";

const SIGN_IN_ID = "test-sign-in-id";
const INVITATION_TOKEN = "valid-invitation-token";
const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJzaWQiOiJ0ZXN0LXNpZ24taW4taWQiLCJlbWFpbCI6Imludml0ZWRAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTl9.signature";

const invitationUrl = `${routes.auth}?invitation_token=${INVITATION_TOKEN}&sign_in_id=${SIGN_IN_ID}`;

function mockValidToken(page: Parameters<Parameters<typeof test>[1]>[0]["page"]) {
  return page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/invitation\?invitation_token=/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true }) }),
  );
}

function mockAcceptSuccess(page: Parameters<Parameters<typeof test>[1]>[0]["page"]) {
  return page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/invitation$/, (route) => {
    if (route.request().method() === "PATCH") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ jwt: JWT, refresh_token: "refresh-token" }),
      });
    } else {
      route.fallback();
    }
  });
}

test.describe("Auth - Invitation acceptance via URL redirect", () => {
  test("shows the invited step with password fields when arriving via invitation link", async ({ page }) => {
    await mockValidToken(page);

    await page.goto(invitationUrl);

    await expect(page.getByRole("heading", { name: "Accept your invitation" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "New Password" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password Confirmation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept Invitation" })).toBeVisible();
  });

  test("accept invitation button is disabled until both fields are filled", async ({ page }) => {
    await mockValidToken(page);

    await page.goto(invitationUrl);

    const button = page.getByRole("button", { name: "Accept Invitation" });
    await expect(button).toBeDisabled();

    await page.getByRole("textbox", { name: "New Password" }).fill("NewPassword1!");
    await expect(button).toBeDisabled();

    await page.getByRole("textbox", { name: "Password Confirmation" }).fill("NewPassword1!");
    await expect(button).toBeEnabled();
  });

  test("successful invitation acceptance logs the user in", async ({ page }) => {
    await mockValidToken(page);
    await mockAcceptSuccess(page);

    await page.goto(invitationUrl);

    await page.getByRole("textbox", { name: "New Password" }).fill("NewPassword1!");
    await page.getByRole("textbox", { name: "Password Confirmation" }).fill("NewPassword1!");
    await page.getByRole("button", { name: "Accept Invitation" }).click();

    await expect(page.getByTestId("signed.in.view")).toBeVisible();
  });

  test("mismatched passwords show an error and do not call the API", async ({ page }) => {
    await mockValidToken(page);

    let patchCalled = false;
    await page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/invitation$/, (route) => {
      if (route.request().method() === "PATCH") patchCalled = true;
      route.fallback();
    });

    await page.goto(invitationUrl);

    await page.getByRole("textbox", { name: "New Password" }).fill("NewPassword1!");
    await page.getByRole("textbox", { name: "Password Confirmation" }).fill("DifferentPassword1!");
    await page.getByRole("button", { name: "Accept Invitation" }).click();

    await expect(page.locator("u-error-message[for='invitation']")).toBeVisible();
    expect(patchCalled).toBe(false);
  });

  test("expired invitation token shows an error on the invited step", async ({ page }) => {
    await page.route(/\/api\/sdk\/v1\/sign_ins\/.*\/invitation\?invitation_token=/, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error_identifier: "invitation_token_expired" }),
      }),
    );

    await page.goto(invitationUrl);

    await expect(page.getByRole("heading", { name: "Accept your invitation" })).toBeVisible();
    await expect(page.locator("u-error-message[for='invitation']")).toBeVisible();
  });

  test("URL params are not removed before successful acceptance", async ({ page }) => {
    await mockValidToken(page);

    await page.goto(invitationUrl);

    // After handleInvitationRedirect the params should still be in the URL
    // (they are only cleared after a successful PATCH)
    const url = new URL(page.url());
    expect(url.searchParams.has("invitation_token") || url.searchParams.has("sign_in_id")).toBe(true);
  });
});
