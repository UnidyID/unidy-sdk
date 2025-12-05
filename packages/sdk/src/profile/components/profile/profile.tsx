import * as Sentry from "@sentry/browser";
import { Component, Host, Prop, State, h } from "@stencil/core";
import i18n from "../../../i18n";
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
  // This state will be used to trigger re-renders when the language changes.
  @State() effectiveLanguage: string;

  constructor() {
    this.effectiveLanguage = unidyState.locale;
    unidyOnChange('locale', (lng) => {
      this.effectiveLanguage = lng;
    });
  }

  async componentWillLoad() {
    if (this.initialData !== "") {
      profileState.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else {
      this.authInstance = await Auth.getInstance();

      const idToken = await this.authInstance?.getToken();

      if (idToken && typeof idToken === "string") {
        await this.fetchProfileData(idToken as string);
      }
    }

    profileState.loading = false;
  }

  async fetchProfileData(idToken: string) {
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
      profileState.flashErrors = { error: i18n.t('errors.failedToLoadProfile') };
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
        <div>{i18n.t('loading')}</div>
      ) : (
        <Host>
          <slot />
          {!hasFieldErrors && errorMsg && <flash-message variant="error" message={errorMsg} />}
          {wasSubmit && !errorMsg && !hasFieldErrors && <flash-message variant="success" message={i18n.t('profile.updated')} />}
        </Host>
      );
    }

    return <h2>{i18n.t('profile.signInToView')}</h2>;
  }
}
