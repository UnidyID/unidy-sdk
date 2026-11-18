import { getClient, getCurrentScope } from "@sentry/browser";
import { captureException, initSentry } from "./sentry";

describe("sentry", () => {
  it("does nothing before initSentry", () => {
    expect(() => captureException(new Error("boom"))).not.toThrow();
  });

  it("does not register a global client", () => {
    initSentry();
    expect(getClient()).toBeUndefined();
    expect(getCurrentScope().getClient()).toBeUndefined();
  });

  it("is idempotent", () => {
    expect(() => {
      initSentry();
      initSentry();
    }).not.toThrow();
  });
});
