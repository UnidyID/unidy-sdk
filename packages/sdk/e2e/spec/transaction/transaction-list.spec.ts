import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const EMPTY_TRANSACTIONS_RESPONSE = {
  results: [],
  meta: { count: 0, page: 1, limit: 10, last: 1, prev: null, next: null },
};

const PAGINATION_META = { count: 1, page: 1, limit: 10, last: 1, prev: null, next: null };

const BASE_TRANSACTION = {
  id: "00000000-0000-0000-0000-000000000001",
  user_id: "00000000-0000-0000-0000-000000000002",
  transaction_category_id: "00000000-0000-0000-0000-000000000003",
  external_id: null,
  reference: "TEST-001",
  source_platform: null,
  order_type: null,
  state: "completed",
  financial_status: "paid",
  fulfillment_status: null,
  currency: "EUR",
  payment_method: null,
  payment_provider_ref: null,
  coupon_code: null,
  invoice_number: null,
  cancel_reason: null,
  customer_note: null,
  staff_note: null,
  source_channel_id: null,
  prices_include_tax: true,
  tax_exempt: false,
  tags: [],
  total: 9.99,
  subtotal: null,
  total_discount: null,
  total_paid: null,
  total_refunded: null,
  total_shipping: null,
  total_tax: null,
  exchange_rate: null,
  placed_at: null,
  cancelled_at: null,
  completed_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  metadata: null,
  platform_metadata: null,
  billing_address: null,
  shipping_address: null,
  line_items: [],
};

test.describe("u-transaction-list - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders transaction list when signed in", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.transaction);
    await expect(page.getByRole("heading", { name: "My Transactions", exact: true })).toBeVisible();
    const listHost = page.locator("u-transaction-list").first();
    await expect(listHost).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("pagination controls mount inside the transaction list", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.transaction);
    await expect(page.locator("u-pagination-button[direction='prev']")).toBeAttached();
    await expect(page.locator("u-pagination-button[direction='next']")).toBeAttached();
    await expect(page.locator("u-pagination-page")).toBeAttached();
  });

  test('shows slot="empty" content when the list returns zero items', async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSACTIONS_RESPONSE) }),
    );

    await page.goto(routes.transaction);

    await expect(page.locator("#empty-transactions-message")).toBeVisible();
    await expect(page.locator("#empty-transactions-message")).toHaveText("No transactions found.");
  });

  test("renders successfully when line_items[].id is a string", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const response = {
      meta: PAGINATION_META,
      results: [
        {
          ...BASE_TRANSACTION,
          line_items: [{ id: "some-uuid-string", name: "Product", quantity: 1, unit_price: 9.99, total_price: 9.99, metadata: null }],
        },
      ],
    };
    await page.route("**/api/sdk/v1/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) }),
    );

    await page.goto(routes.transaction);

    await expect(page.locator("u-transaction-list")).toBeVisible();
    await expect(page.locator("u-transaction-list h1")).not.toBeVisible();
  });

  test("renders valid items and skips invalid ones without showing an error", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    const validTransaction = { ...BASE_TRANSACTION, id: "00000000-0000-0000-0000-000000000001", reference: "VALID-001" };
    const invalidTransaction = { id: "not-a-uuid", reference: "INVALID" };
    const response = {
      meta: { ...PAGINATION_META, count: 2 },
      results: [validTransaction, invalidTransaction],
    };
    await page.route("**/api/sdk/v1/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) }),
    );

    await page.goto(routes.transaction);

    await expect(page.locator("u-transaction-list")).toBeVisible();
    await expect(page.locator("u-transaction-list h1")).not.toBeVisible();
  });

  test('does not show slot="empty" content while loading', async ({ page, authenticatedContext: _authenticatedContext }) => {
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => {
      releaseRoute = resolve;
    });

    await page.route("**/api/sdk/v1/transactions**", async (route) => {
      await routeHeld;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSACTIONS_RESPONSE) });
    });

    await Promise.all([page.waitForRequest((req) => req.url().includes("/api/sdk/v1/transactions")), page.goto(routes.transaction)]);

    // Component has made the request but response is held — still in loading state
    await expect(page.locator("#empty-transactions-message")).not.toBeVisible();
    releaseRoute();
  });
});

test.describe("u-transaction-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.transaction);
    await expect(page.getByText("You need to sign in to view your transactions")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
