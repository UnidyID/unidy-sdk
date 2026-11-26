import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { extractSidFromUrl } from "./helpers/url";
import { cleanSocialAuthParams, parseSocialAuthCallback } from "./social-auth";

const originalWindow = (globalThis as { window?: unknown }).window;

function setUrl(url: string) {
  const location = new URL(url);
  (globalThis as { window?: unknown }).window = {
    location: {
      get href() {
        return location.href;
      },
      get search() {
        return location.search;
      },
    },
    history: {
      replaceState: (_state: unknown, _title: string, next: string) => {
        const nextUrl = new URL(next);
        location.search = nextUrl.search;
      },
    },
  };
}

const currentSearch = () => (globalThis as unknown as { window: { location: { search: string } } }).window.location.search;
const encodePayload = (payload: object) => Buffer.from(JSON.stringify(payload)).toString("base64");

beforeEach(() => setUrl("https://shop.example.com/login"));
afterEach(() => {
  (globalThis as { window?: unknown }).window = originalWindow;
});

describe("extractSidFromUrl", () => {
  it.each([
    ["sdk_login_sid only", "?sdk_login_sid=abc"],
    ["sid only", "?sid=abc"],
    ["both", "?sdk_login_sid=abc&sid=abc"],
  ])("reads the sign-in id with %s and removes both params", (_name, search) => {
    setUrl(`https://shop.example.com/login${search}&returnTo=%2F`);

    expect(extractSidFromUrl()).toBe("abc");
    expect(currentSearch()).toBe("?returnTo=%2F");
  });

  it("prefers sdk_login_sid over a colliding sid", () => {
    setUrl("https://shop.example.com/login?sdk_login_sid=ours&sid=customer");

    expect(extractSidFromUrl()).toBe("ours");
    expect(currentSearch()).toBe("");
  });

  it("returns null and leaves the URL alone without a sign-in id", () => {
    setUrl("https://shop.example.com/login?returnTo=%2F");

    expect(extractSidFromUrl()).toBeNull();
    expect(currentSearch()).toBe("?returnTo=%2F");
  });
});

describe("parseSocialAuthCallback", () => {
  const payload = encodePayload({ id_token: "jwt", refresh_token: "rt" });

  it.each([
    ["sdk_login_sid only", `?sdk_login_sid=abc&auth_payload=${payload}`],
    ["sid only", `?sid=abc&auth_payload=${payload}`],
    ["both", `?sdk_login_sid=abc&sid=abc&auth_payload=${payload}`],
  ])("decodes a success redirect with %s", (_name, search) => {
    expect(parseSocialAuthCallback(search)).toEqual({ result: { signInId: "abc", idToken: "jwt", refreshToken: "rt" } });
  });

  it.each([
    ["sdk_login_sid only", "?error=brand_connection_required&sdk_login_sid=abc"],
    ["sid only", "?error=brand_connection_required&sid=abc"],
    ["both", "?error=brand_connection_required&sdk_login_sid=abc&sid=abc"],
  ])("returns the sign-in id for a brand connection redirect with %s", (_name, search) => {
    expect(parseSocialAuthCallback(search)).toEqual({ error: "brand_connection_required", fields: undefined, signInId: "abc" });
  });

  it.each([
    ["sdk_login_sid only", "sdk_login_sid=abc"],
    ["sid only", "sid=abc"],
  ])("returns sign-in id and fields for missing required fields with %s", (_name, sidParam) => {
    const fields = encodeURIComponent(JSON.stringify({ first_name: { required: true } }));

    expect(parseSocialAuthCallback(`?error=missing_required_fields&fields=${fields}&${sidParam}`)).toEqual({
      error: "missing_required_fields",
      fields: { first_name: { required: true } },
      signInId: "abc",
    });
  });

  it("ignores a bare sid without auth_payload or error", () => {
    expect(parseSocialAuthCallback("?sid=customer-session")).toBeNull();
  });

  it("ignores a bare sdk_login_sid without auth_payload or error", () => {
    expect(parseSocialAuthCallback("?sdk_login_sid=abc")).toBeNull();
  });

  it("ignores unrelated params", () => {
    expect(parseSocialAuthCallback("?returnTo=%2F")).toBeNull();
  });
});

describe("cleanSocialAuthParams", () => {
  it("removes sign-in ids and callback params but keeps the rest", () => {
    setUrl("https://shop.example.com/login?returnTo=%2F&sdk_login_sid=abc&sid=abc&auth_payload=x&error=e&fields=%7B%7D");

    cleanSocialAuthParams();

    expect(currentSearch()).toBe("?returnTo=%2F");
  });

  it("removes a lone sdk_login_sid", () => {
    setUrl("https://shop.example.com/login?sdk_login_sid=abc");

    cleanSocialAuthParams();

    expect(currentSearch()).toBe("");
  });
});
