import * as Sentry from "@sentry/browser";
import { Component, Host, Method, Prop, State, h } from "@stencil/core";
import { t } from "../../../i18n";
import { Auth } from "../../../auth";
import { getUnidyClient } from "../../../api";
import { authStore, onChange as authOnChange } from "../../../auth/store/auth-store";
import { state as profileState, onChange as profileOnChange } from "../../store/profile-store";
import { unidyState, onChange as unidyOnChange } from "../../../shared/store/unidy-store";
import type { ProfileRaw } from "../../store/profile-store";
import { validateRequiredFieldsUnchanged, buildPayload } from "../../profile-helpers";

@Component({
  tag: "u-profile",
  shadow: false,
})
export class Profile {
  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";

  @State() fetchingProfileData = false;

  constructor() {
    unidyOnChange("locale", async (_locale) => {
      if (authStore.state.authenticated) await this.getTokenAndFetchProfile();
    });
  }

  async componentWillLoad() {
    if (this.initialData !== "") {
      profileState.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else if (authStore.state.authenticated) {
      await this.getTokenAndFetchProfile();
    }

    profileState.loading = false;
  }

  async getTokenAndFetchProfile() {
    const authInstance = await Auth.getInstance();

    const idToken = await authInstance.getToken();

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
      profileState.flashErrors = { error: t("errors.failed_to_load_profile") };
    }
    this.fetchingProfileData = false;
  }

  @Method()
  async submitProfile() {
    const authInstance = await Auth.getInstance();

    profileState.loading = true;

    const { configuration, ...stateWithoutConfig } = profileState;

    if (!validateRequiredFieldsUnchanged(stateWithoutConfig.data)) {
      profileState.loading = false;
      return;
    }

    const updatedProfileData = buildPayload(stateWithoutConfig.data);

    const resp = await getUnidyClient().profile.updateProfile({
      idToken: (await authInstance.getToken()) as string,
      data: updatedProfileData,
      lang: unidyState.locale,
    });

    if (resp?.success) {
      profileState.loading = false;
      profileState.configuration = JSON.parse(JSON.stringify(resp.data));
      profileState.configUpdateSource = "submit";
      profileState.errors = {};
    } else {
      if (resp?.data && "flatErrors" in resp.data) {
        profileState.errors = resp.data.flatErrors as Record<string, string>;
      } else {
        profileState.flashErrors = { [String(resp?.status)]: String(resp?.error) };
      }
      profileState.loading = false;
    }
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
