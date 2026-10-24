import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const TICKETS_ROUTE = "**/api/v2/me/tickets**";

const paginatedResponse = (page: number, pages: number) => ({
  records: [],
  meta: {
    request_id: "e2e",
    pagination: {
      strategy: "page",
      sort: "-created_at",
      page,
      per_page: 10,
      count: pages * 10,
      pages,
      previous: page > 1 ? page - 1 : null,
      next: page < pages ? page + 1 : null,
    },
  },
});

const EMPTY_TICKETS_RESPONSE = paginatedResponse(1, 0);

test.describe("u-ticketable-list - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  // V2 /me authenticates with user credentials the e2e user doesn't have yet, so every test stubs it.
  test.beforeEach(async ({ page }) => {
    await page.route(TICKETS_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TICKETS_RESPONSE) }),
    );
  });

  test("renders ticketable list when signed in", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByRole("heading", { name: "My Tickets", exact: true })).toBeVisible();
    const listHost = page.locator("u-ticketable-list").first();
    await expect(listHost).toBeVisible();
    // On schema-parse failure the component renders only an <h1> with the error
    // prefix — make sure that never reaches the DOM (regression guard for UD-2531).
    await expect(listHost.locator("h1")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("pagination controls mount inside the ticketable list", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.ticketable);
    await expect(page.locator("u-pagination-button[direction='prev']")).toBeAttached();
    await expect(page.locator("u-pagination-button[direction='next']")).toBeAttached();
    await expect(page.locator("u-pagination-page")).toBeAttached();
  });

  test("sends V2 paging and eq filters", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const ticketRequest = page.waitForRequest((req) => req.url().includes("/api/v2/me/tickets") && req.url().includes("filter"));

    await page.goto(routes.ticketable);

    const params = new URL((await ticketRequest).url()).searchParams;
    expect(params.get("filter[state][eq]")).toBe("inactive");
    expect(params.get("per_page")).toBe("1");
    expect(params.get("page")).toBe("1");
  });

  test("pagination controls render and reflect pagination meta without a manually wired store", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await page.route(TICKETS_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(paginatedResponse(1, 3)) }),
    );

    // Track both ticket API responses (one per u-ticketable-list on the demo page).
    // The pagination controls live in the second list, so we must wait for that
    // list's loadData() to complete before asserting on the store state.
    let responseCount = 0;
    const bothResponsesReceived = new Promise<void>((resolve) => {
      page.on("response", (resp) => {
        if (resp.url().includes("/api/v2/me/tickets") && resp.status() === 200 && ++responseCount >= 2) {
          resolve();
        }
      });
    });

    await page.goto(routes.ticketable);
    await bothResponsesReceived;

    // prev disabled on first page, next enabled — store must have been created automatically
    await expect(page.locator("u-pagination-button[direction='prev'] button")).toBeVisible();
    await expect(page.locator("u-pagination-button[direction='prev'] button")).toBeDisabled();
    await expect(page.locator("u-pagination-button[direction='next'] button")).toBeVisible();
    await expect(page.locator("u-pagination-button[direction='next'] button")).toBeEnabled();
    await expect(page.locator("u-pagination-page")).toContainText("Page 1 of 3");
  });

  test('shows slot="empty" content when the list returns zero items', async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route(TICKETS_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TICKETS_RESPONSE) }),
    );

    await page.goto(routes.ticketable);

    await expect(page.locator("#empty-message")).toBeVisible();
    await expect(page.locator("#empty-message")).toHaveText("No tickets found.");
  });

  test('does not show slot="empty" content while loading', async ({ page, authenticatedContext: _authenticatedContext }) => {
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => {
      releaseRoute = resolve;
    });

    await page.route(TICKETS_ROUTE, async (route) => {
      await routeHeld;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TICKETS_RESPONSE) });
    });

    await Promise.all([page.waitForRequest((req) => req.url().includes("/api/v2/me/tickets")), page.goto(routes.ticketable)]);

    // Component has made the request but response is held — still in loading state
    await expect(page.locator("#empty-message")).not.toBeVisible();
    releaseRoute();
  });
});

test.describe("u-ticketable-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByText("You need to sign in to view your tickets")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
