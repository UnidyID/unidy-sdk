import type { Page } from "@playwright/test";
import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const PAGINATION = { strategy: "page", sort: "-authorized_at", page: 1, per_page: 50, pages: 1, next: null, previous: null };

const application = (id: string, name: string) => ({
  id,
  name,
  description: `${name} for club members`,
  name_t: { en: name },
  description_t: { en: `${name} for club members` },
  service_logo_url: null,
  brands: { list: ["Default"], owner: ["Default"] },
  authorized_at: "2026-10-01T10:00:00.000Z",
});

const JSON_HEADERS = { "Access-Control-Allow-Origin": "*" };

// Which applications a user authorized depends on backend OAuth grants, so V2 /me is stubbed.
async function stubAuthorizedApplications(page: Page, records: ReturnType<typeof application>[]) {
  const revoked: string[] = [];

  await page.route("**/api/v2/me/authorized_applications**", (route) => {
    const request = route.request();
    if (request.method() !== "DELETE") {
      return route.fulfill({
        headers: JSON_HEADERS,
        json: { records, meta: { request_id: "e2e", pagination: { ...PAGINATION, count: records.length } } },
      });
    }

    const clientId = decodeURIComponent(new URL(request.url()).pathname.split("/").pop() ?? "");
    const record = records.find((r) => r.id === clientId);
    if (!record) {
      return route.fulfill({ status: 404, headers: JSON_HEADERS, json: { identifier: "not_found", details: [], meta: {} } });
    }

    revoked.push(clientId);
    return route.fulfill({ headers: JSON_HEADERS, json: { record, meta: { request_id: "e2e" } } });
  });

  return revoked;
}

test.describe("Services - Connected services (authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders the services page", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.services);

    await expect(page.getByRole("heading", { name: "Connected Services" })).toBeVisible();
    await expect(page.locator("#services-list")).toBeAttached();
  });

  test("lists the authorized applications", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubAuthorizedApplications(page, [application("fan-shop", "Fan Shop"), application("ticket-app", "Ticket App")]);

    await page.goto(routes.services);

    const list = page.getByRole("list", { name: "Connected services" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(list.getByText("Fan Shop", { exact: true })).toBeVisible();
    await expect(list.getByText("Ticket App for club members")).toBeVisible();
  });

  test("revokes an application and shows the empty state after the last one", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    const revoked = await stubAuthorizedApplications(page, [application("fan-shop", "Fan Shop")]);

    await page.goto(routes.services);

    const item = page.locator('[data-service-id="fan-shop"]');
    await item.getByRole("button", { name: "Disconnect" }).click();

    await expect(item).toHaveCount(0);
    await expect(page.getByText("No connected services.")).toBeVisible();
    expect(revoked).toEqual(["fan-shop"]);
  });

  test("shows the empty state when no application is authorized", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubAuthorizedApplications(page, []);

    await page.goto(routes.services);

    await expect(page.getByText("No connected services.")).toBeVisible();
  });
});

test.describe("Services - Connected services (unauthenticated)", () => {
  test("shows login prompt when not authenticated", async ({ page }) => {
    await page.goto(routes.services);

    await expect(page.getByText(/you need to be signed in/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
  });
});
