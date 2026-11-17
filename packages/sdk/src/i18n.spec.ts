import i18n, { t } from "./i18n";
import { unidyState } from "./shared/store/unidy-store";

describe("t", () => {
  afterEach(async () => {
    unidyState.locale = "en";
    await i18n.changeLanguage("en");
  });

  it("translates into the store locale even when i18next's active language differs", async () => {
    unidyState.locale = "de";
    await i18n.changeLanguage("en");

    expect(t("auth.magicCode.button_text")).toBe("Magischen Code senden");
  });

  it("lets a per-call lng override the store locale", () => {
    unidyState.locale = "de";

    expect(t("auth.magicCode.button_text", { lng: "fr" })).toBe("Envoyer le code magique");
  });

  it("keeps passing the other options to i18next", () => {
    unidyState.locale = "de";

    expect(t("auth.socialLogin.button_text", { provider: "Google" })).toBe("Weiter mit Google");
  });
});
