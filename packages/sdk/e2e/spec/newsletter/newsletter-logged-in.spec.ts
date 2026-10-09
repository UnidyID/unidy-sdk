import type { Page, Request } from "@playwright/test";
import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const MAIN_ID = "11111111-1111-4111-8111-111111111111";
const TEST_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";
const NOW = "2026-10-01T10:00:00.000Z";

const PAGINATION = { strategy: "page", sort: "-created_at", page: 1, per_page: 500, pages: 1, next: null, previous: null };
const CORS = { "Access-Control-Allow-Origin": "*" };

const newsletter = (id: string, slug: string, title: string) => ({
  id,
  slug,
  default: false,
  opt_in_type: "doi",
  doi_through_unidy: true,
  brands: ["Default"],
  title,
  description: null,
  title_t: { en: title },
  description_t: {},
  created_at: NOW,
  updated_at: NOW,
});

const NEWSLETTERS = [newsletter(MAIN_ID, "main", "Main Newsletter"), newsletter(TEST_ID, "test", "Test Newsletter")];

type SubscriptionRecord = ReturnType<typeof subscription>;

function subscription(newsletterId: string, { confirmed = true, preferences = [] as string[] } = {}) {
  return {
    id: `sub-${newsletterId}`,
    email: "user@example.com",
    newsletter_id: newsletterId,
    user_id: USER_ID,
    preference_identifiers: preferences,
    confirmed_at: confirmed ? NOW : null,
    confirmation_requested_at: null as string | null,
    opted_out_at: null,
    created_at: NOW,
    updated_at: NOW,
  };
}

const unprocessable = (field: string | null, code: string) => ({
  status: 422,
  headers: CORS,
  json: { identifier: "unprocessable_content", details: [{ field, code }], meta: { request_id: "e2e" } },
});

/**
 * A signed-in user's subscriptions live on V2 /me, which keys them by newsletter id. The stub keeps them in
 * memory, so the components' slug ↔ id mapping is exercised end to end without seeding backend data.
 */
async function stubMeNewsletters(page: Page, initial: SubscriptionRecord[], { takenOnCreate = false } = {}) {
  const subscriptions = [...initial];
  const writes: Request[] = [];

  await page.route("**/api/v2/me/newsletters**", (route) =>
    route.fulfill({
      headers: CORS,
      json: { records: NEWSLETTERS, meta: { request_id: "e2e", pagination: { ...PAGINATION, count: NEWSLETTERS.length } } },
    }),
  );

  await page.route("**/api/v2/me/newsletter_subscriptions**", (route) => {
    const request = route.request();
    const [, newsletterId, action] = new URL(request.url()).pathname.split("/api/v2/me/newsletter_subscriptions")[1].split("/");
    const index = subscriptions.findIndex((s) => s.newsletter_id === newsletterId);
    const payload = request.postDataJSON()?.payload;
    if (request.method() !== "GET") writes.push(request);

    if (!newsletterId && request.method() === "GET") {
      const meta = { request_id: "e2e", pagination: { ...PAGINATION, count: subscriptions.length } };
      return route.fulfill({ headers: CORS, json: { records: subscriptions, meta } });
    }

    if (!newsletterId && request.method() === "POST") {
      const id = payload.data.newsletter_id;
      if (takenOnCreate || subscriptions.some((s) => s.newsletter_id === id)) {
        if (!subscriptions.some((s) => s.newsletter_id === id)) subscriptions.push(subscription(id, { confirmed: false }));
        return route.fulfill(unprocessable("payload.data.newsletter_id", "taken"));
      }

      const created = subscription(id, { confirmed: false, preferences: payload.data.preference_identifiers ?? [] });
      subscriptions.push(created);
      return route.fulfill({ status: 201, headers: CORS, json: { record: created, meta: { request_id: "e2e" } } });
    }

    if (index === -1) {
      return route.fulfill({ status: 404, headers: CORS, json: { identifier: "not_found", details: [], meta: {} } });
    }

    const record = subscriptions[index];
    if (action === "request_confirmation") {
      record.confirmation_requested_at = NOW;
    } else if (request.method() === "PATCH") {
      if (!record.confirmed_at) return route.fulfill(unprocessable(null, "invalid"));
      record.preference_identifiers = payload.data.preference_identifiers;
    } else if (request.method() === "DELETE") {
      subscriptions.splice(index, 1);
    }
    return route.fulfill({ headers: CORS, json: { record, meta: { request_id: "e2e" } } });
  });

  return { subscriptions, writes };
}

test.describe("Newsletter (logged in)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("shows the user's subscriptions from V2 /me without the V1 subscription API", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    const v1Requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/sdk/v1/newsletters/")) v1Requests.push(request.url());
    });
    await stubMeNewsletters(page, [subscription(MAIN_ID, { preferences: ["club_news"] })]);

    await page.goto(routes.newsletter);

    await expect(page.getByRole("heading", { name: "Your subscriptions", exact: true })).toBeVisible();
    await expect(page.getByTestId("manage.nl.group.main.toggle")).toHaveText("Unsubscribe");
    await expect(page.getByTestId("manage.nl.group.test.toggle")).toHaveText("Subscribe");
    await expect(page.getByTestId("manage.nl.group.main.pref.club_news")).toBeChecked();
    await expect(page.getByTestId("manage.nl.group.main.pref.player_news")).not.toBeChecked();
    expect(v1Requests).toEqual([]);
  });

  test("subscribes to a newsletter by its id", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const { writes } = await stubMeNewsletters(page, []);

    await page.goto(routes.newsletter);
    await page.getByTestId("manage.nl.group.test.toggle").click();

    await expect(page.getByText("You have successfully subscribed")).toBeVisible();
    await expect(page.getByTestId("manage.nl.group.test.toggle")).toHaveText("Unsubscribe");

    const [create] = writes;
    expect(create.method()).toBe("POST");
    expect(create.postDataJSON().payload).toMatchObject({
      data: { newsletter_id: TEST_ID },
      redirect_to_after_confirmation: expect.stringContaining(routes.newsletter),
    });
  });

  test("reports an existing subscription and shows it as subscribed", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubMeNewsletters(page, [], { takenOnCreate: true });

    await page.goto(routes.newsletter);
    await page.getByTestId("manage.nl.group.test.toggle").click();

    await expect(page.getByText("Already subscribed", { exact: true })).toBeVisible();
    await expect(page.getByTestId("manage.nl.group.test.toggle")).toHaveText("Unsubscribe");
  });

  test("unsubscribes from a newsletter", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const { writes } = await stubMeNewsletters(page, [subscription(MAIN_ID)]);

    await page.goto(routes.newsletter);
    await page.getByTestId("manage.nl.group.main.toggle").click();

    await expect(page.getByText("You have successfully unsubscribed")).toBeVisible();
    await expect(page.getByTestId("manage.nl.group.main.toggle")).toHaveText("Subscribe");
    expect(writes.map((r) => [r.method(), new URL(r.url()).pathname])).toEqual([
      ["DELETE", `/api/v2/me/newsletter_subscriptions/${MAIN_ID}`],
    ]);
  });

  test("updates the preferences of a confirmed subscription", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const { writes } = await stubMeNewsletters(page, [subscription(MAIN_ID, { preferences: ["club_news"] })]);

    await page.goto(routes.newsletter);
    await page.getByTestId("manage.nl.group.main.pref.player_news").click();

    await expect(page.getByText("Your preferences have been updated successfully")).toBeVisible();
    const [update] = writes;
    expect(update.method()).toBe("PATCH");
    expect(update.postDataJSON().payload.data.preference_identifiers).toEqual(expect.arrayContaining(["club_news", "player_news"]));
  });

  test("requests the confirmation of an unconfirmed subscription again", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const { writes } = await stubMeNewsletters(page, [subscription(MAIN_ID, { confirmed: false })]);

    await page.goto(routes.newsletter);
    await expect(page.getByTestId("manage.nl.group.main.pref.club_news")).toBeDisabled();
    await page.getByTestId("manage.nl.group.main.resend-doi").getByRole("button").click();

    await expect(page.getByText("Confirmation email has been sent to your email address")).toBeVisible();
    expect(new URL(writes[0].url()).pathname).toBe(`/api/v2/me/newsletter_subscriptions/${MAIN_ID}/request_confirmation`);
  });
});
