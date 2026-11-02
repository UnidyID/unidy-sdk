import type { Page } from "@playwright/test";
import { routes, userLogin } from "../../config";
import { expect, test } from "../../fixtures";

async function injectProbes(page: Page) {
  await page.evaluate(() => {
    const probe = (id: string, style: string, negated: boolean) => {
      const host = document.createElement("u-signed-in");
      host.id = id;
      host.setAttribute("style", style);
      if (negated) host.setAttribute("not", "");

      const child = document.createElement("div");
      child.id = `${id}-child`;
      child.setAttribute("style", "display:none");
      child.textContent = id;
      host.appendChild(child);

      document.body.appendChild(host);
    };

    probe("flex-host", "display:flex;gap:8px", false);
    probe("none-host", "display:none", false);
    probe("negated-flex-host", "display:flex;gap:8px", true);
  });
}

async function signInThroughUi(page: Page) {
  await page.getByRole("textbox", { name: "Email" }).fill(userLogin.email);
  await page.getByRole("textbox", { name: "Email" }).press("Enter");
  await page.getByRole("textbox", { name: "Password" }).fill(userLogin.password);
  await page.getByRole("textbox", { name: "Password" }).press("Enter");
  await expect(page.getByTestId("signed.in.view")).toBeVisible();
}

test.describe("Auth - u-signed-in inline styles", () => {
  test("keeps inline styles on its host and children when the auth state changes", async ({ page }) => {
    await page.goto(routes.auth);
    await injectProbes(page);

    await expect(page.locator("#flex-host")).toHaveAttribute("hidden", "");
    await expect(page.locator("#none-host")).toHaveAttribute("hidden", "");
    await expect(page.locator("#negated-flex-host")).not.toHaveAttribute("hidden", "");

    await signInThroughUi(page);

    await expect(page.locator("#flex-host")).not.toHaveAttribute("hidden", "");
    await expect(page.locator("#none-host")).not.toHaveAttribute("hidden", "");
    await expect(page.locator("#negated-flex-host")).toHaveAttribute("hidden", "");

    await expect(page.locator("#flex-host")).toHaveAttribute("style", "display:flex;gap:8px");
    await expect(page.locator("#none-host")).toHaveAttribute("style", "display:none");
    await expect(page.locator("#negated-flex-host")).toHaveAttribute("style", "display:flex;gap:8px");

    for (const id of ["flex-host", "none-host", "negated-flex-host"]) {
      await expect(page.locator(`#${id}-child`)).toHaveAttribute("style", "display:none");
    }
  });

  test("hides its content from the page while signed out", async ({ page }) => {
    await page.goto(routes.auth);
    await page.evaluate(() => {
      const host = document.createElement("u-signed-in");
      host.id = "plain-host";
      host.textContent = "members only";
      document.body.appendChild(host);
    });

    await expect(page.locator("#plain-host")).toBeHidden();
    await expect(page.locator("#plain-host")).toHaveAttribute("aria-hidden", "true");
  });
});
