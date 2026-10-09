import { getUnidyClient } from "../api";
import { Flash } from "../shared/store/flash-store";
import { unidyState } from "../shared/store/unidy-store";
import { createSubscriptions, deleteSubscription, fetchSubscriptions, resendDoi } from "./newsletter-helpers";
import { newsletterStore } from "./store/newsletter-store";

const mockMe = {
  listAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  requestConfirmation: jest.fn(),
};
const mockNewsletters = { me: mockMe, list: jest.fn(), create: jest.fn(), delete: jest.fn(), resendDoi: jest.fn() };

const NOW = "2026-10-01T10:00:00.000Z";

const subscription = (slug: string, overrides: Record<string, unknown> = {}) => ({
  id: `sub-${slug}`,
  email: "ada@example.com",
  newsletter_id: `id-${slug}`,
  newsletter_slug: slug,
  user_id: "user-1",
  preference_identifiers: [] as string[],
  confirmed_at: NOW,
  confirmation_requested_at: null,
  opted_out_at: null,
  created_at: NOW,
  updated_at: NOW,
  ...overrides,
});

const unprocessable = (field: string | null, code: string) =>
  ["unprocessable_content", { identifier: "unprocessable_content", details: [{ field, code }] }] as const;

function signIn({ preferenceToken = "" } = {}) {
  newsletterStore.state.isAuthenticated = true;
  newsletterStore.state.preferenceToken = preferenceToken;
}

describe("newsletter helpers for a signed-in user", () => {
  beforeAll(() => {
    Object.assign(unidyState, { baseUrl: "https://unidy.example", apiKey: "key", isConfigured: true });
    Object.assign(getUnidyClient(), { newsletters: mockNewsletters });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    newsletterStore.reset();
    signIn();
  });

  it("loads the user's subscriptions from V2, keyed by slug", async () => {
    mockMe.listAll.mockResolvedValue([
      null,
      [subscription("main", { preference_identifiers: ["club_news"] }), subscription("test", { confirmed_at: null })],
    ]);

    await fetchSubscriptions();

    expect(mockNewsletters.list).not.toHaveBeenCalled();
    expect(newsletterStore.state.existingSubscriptions).toEqual([
      { newsletter_internal_name: "main", confirmed: true, preference_identifiers: ["club_news"] },
      { newsletter_internal_name: "test", confirmed: false, preference_identifiers: [] },
    ]);
    expect(newsletterStore.state.checkedNewsletters).toEqual({ main: ["club_news"], test: [] });
  });

  it("keeps a preference token on V1", async () => {
    signIn({ preferenceToken: "pref-token" });
    mockNewsletters.list.mockResolvedValue([null, []]);

    await fetchSubscriptions();

    expect(mockNewsletters.list).toHaveBeenCalledWith({ options: { preferenceToken: "pref-token" } });
    expect(mockMe.listAll).not.toHaveBeenCalled();
  });

  it("subscribes to each checked newsletter with its preferences", async () => {
    newsletterStore.state.checkedNewsletters = { main: ["club_news"], test: [] };
    mockMe.create.mockImplementation(async ({ slug }) => [null, subscription(slug, { confirmed_at: null })]);

    const success = await createSubscriptions({ email: "ada@example.com" });

    expect(success).toBe(true);
    expect(mockNewsletters.create).not.toHaveBeenCalled();
    expect(mockMe.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "main", preferenceIdentifiers: ["club_news"] }));
    expect(mockMe.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "test", preferenceIdentifiers: [] }));
    expect(newsletterStore.state.existingSubscriptions.map((s) => s.newsletter_internal_name)).toEqual(["main", "test"]);
  });

  it("maps per-newsletter V2 errors onto the newsletter error identifiers", async () => {
    newsletterStore.state.checkedNewsletters = { main: [], test: ["unknown"], gone: [] };
    mockMe.create.mockImplementation(async ({ slug }) => {
      if (slug === "main") return unprocessable("payload.data.newsletter_id", "taken");
      if (slug === "test") return unprocessable("payload.data.preference_identifiers", "not_found");
      return ["not_found", { identifier: "not_found", details: [{ field: "slug", code: "not_found" }] }];
    });
    mockMe.listAll.mockResolvedValue([null, [subscription("main")]]);

    const success = await createSubscriptions({ email: "ada@example.com" });

    expect(success).toBe(false);
    expect(newsletterStore.state.errors).toEqual({
      main: "already_subscribed",
      test: "preferences_not_found",
      gone: "newsletter_not_found",
      general: "newsletter_not_found",
    });
    // The existing subscription is loaded as it is rather than guessed.
    expect(newsletterStore.state.existingSubscriptions).toEqual([
      { newsletter_internal_name: "main", confirmed: true, preference_identifiers: [] },
    ]);
  });

  it("signs the newsletter session out when the token is refused", async () => {
    const flash = jest.spyOn(Flash.error, "addMessage");
    newsletterStore.state.checkedNewsletters = { main: [] };
    mockMe.create.mockResolvedValue(["unauthorized", { identifier: "unauthorized", details: [] }]);

    expect(await createSubscriptions({ email: "ada@example.com" })).toBe(false);
    expect(flash).toHaveBeenCalled();
    expect(newsletterStore.state.existingSubscriptions).toEqual([]);
  });

  it("unsubscribes by slug and resets the newsletter's preferences", async () => {
    newsletterStore.state.existingSubscriptions = [
      { newsletter_internal_name: "main", confirmed: true, preference_identifiers: ["club_news"] },
    ];
    mockMe.delete.mockResolvedValue([null, subscription("main")]);

    expect(await deleteSubscription("main")).toBe(true);
    expect(mockMe.delete).toHaveBeenCalledWith({ slug: "main" });
    expect(newsletterStore.state.existingSubscriptions).toEqual([]);
    expect(newsletterStore.state.checkedNewsletters.main).toEqual([]);
  });

  it("requests the confirmation again through V2", async () => {
    mockMe.requestConfirmation.mockResolvedValue([null, subscription("main", { confirmed_at: null })]);

    expect(await resendDoi("main")).toBe(true);
    expect(mockMe.requestConfirmation).toHaveBeenCalledWith(expect.objectContaining({ slug: "main" }));
    expect(mockNewsletters.resendDoi).not.toHaveBeenCalled();
  });
});
