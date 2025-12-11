import * as Sentry from "@sentry/browser";
import { Component, Host, Prop, State, h } from "@stencil/core";
import { t } from "../../../i18n";
import { Auth, getUnidyClient } from "../../../auth";
import { authStore, onChange as authOnChange } from "../../../auth/store/auth-store";
import { state as profileState, onChange as profileOnChange } from "../../store/profile-store";
import { unidyState, onChange as unidyOnChange } from "../../../shared/store/unidy-store";
import type { ProfileRaw } from "../../store/profile-store";

@Component({
  tag: "u-profile",
  shadow: false,
})
export class Profile {
  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";

  private authInstance?: Auth;

  @State() fetchingProfileData = false;

  constructor() {
    unidyOnChange("locale", async (_locale) => {
      await this.getTokenAndFetchProfile();
    });
  }

  async componentWillLoad() {
    if (this.initialData !== "") {
      profileState.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else {
      await this.getTokenAndFetchProfile();
    }

    profileState.loading = false;
  }

  async getTokenAndFetchProfile() {
    this.authInstance = await Auth.getInstance();

    const idToken = await this.authInstance?.getToken();

    if (idToken && typeof idToken === "string") {
      await this.fetchProfileData(idToken as string);
    }
  }

  async fetchProfileData(idToken: string) {
    // avoid multiple requests
    if (this.fetchingProfileData) return;

    this.fetchingProfileData = true;
    try {
      const resp = await getUnidyClient().profile.fetchProfile({ idToken, lang: unidyState.locale });

      if (resp.success) {
        profileState.configuration = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
        profileState.configUpdateSource = "fetch";
        profileState.errors = {};
        profileState.flashErrors = {};

        profileState.data = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
      } else {
        profileState.flashErrors = { [String(resp?.status)]: String(resp?.error) };
      }
    } catch (error) {
      Sentry.captureException("Failed to fetch profile data:", error);
      profileState.flashErrors = { error: t("errors.failedToLoadProfile") };
    }
    this.fetchingProfileData = false;
  }

  componentDidLoad() {
    profileOnChange("configuration", (cfg) => {
      profileState.data = cfg as ProfileRaw;
    });

    authOnChange("token", (newToken: string | null) => {
      const token = newToken ?? "";

      if (token) {
        this.fetchProfileData(token);
      }
    });
  }

  render() {
    const hasFieldErrors = Object.values(profileState.errors).some(Boolean);
    const errorMsg = Object.values(profileState.flashErrors).filter(Boolean).join(", ");
    const wasSubmit = profileState.configUpdateSource === "submit";

    if (authStore.state.authenticated) {
      return this.fetchingProfileData ? (
        <div>{t("loading")}</div>
      ) : (
        <Host>
          <slot />
          {!hasFieldErrors && errorMsg && <flash-message variant="error" message={errorMsg} />}
          {wasSubmit && !errorMsg && !hasFieldErrors && <flash-message variant="success" message={t("profile.updated")} />}
        </Host>
      );
    }

    return <h2>{t("profile.signInToView")}</h2>;
  }
}
