import * as Sentry from "@sentry/browser";
import { Component, Host, Prop, State, h } from "@stencil/core";
import { Auth } from "../../../auth/auth";
import { authStore, onChange as authOnChange } from "../../../auth/store/auth-store";
import { getUnidyClient } from "../../../auth/api-client";
import { state as profileState, onChange as profileOnChange } from "../../store/profile-store";
import type { ProfileRaw } from "../../store/profile-store";

@Component({
  tag: "u-profile",
  shadow: false,
})
export class Profile {
  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";
  @Prop() apiUrl?: string;
  @Prop() apiKey?: string;
  @Prop() language?: string;

  private authInstance?: Auth;

  @State() fetchingProfileData = false;

  async componentWillLoad() {
    profileState.language = this.language;

    if (this.initialData !== "") {
      profileState.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else {
      this.authInstance = await Auth.getInstance();
      if (!this.authInstance) {
        console.error("Auth service not initialized");
        return;
      }

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
      const resp = await getUnidyClient().profile.fetchProfile({ idToken, lang: this.language });

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
      profileState.flashErrors = { error: "Failed to load profile data. Please check configuration." };
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
        <div>Loading...</div>
      ) : (
        <Host>
          <slot />
          {!hasFieldErrors && errorMsg && <flash-message variant="error" message={errorMsg} />}
          {wasSubmit && !errorMsg && !hasFieldErrors && <flash-message variant="success" message="Profile is updated" />}
        </Host>
      );
    }

    return <h2>Please sign in to view your profile</h2>;
  }
}
