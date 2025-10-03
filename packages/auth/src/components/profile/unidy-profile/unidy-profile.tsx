import { Component, Host, Prop, State, h } from "@stencil/core";
import { Auth } from "../../../auth";
import { authStore, onChange as authOnChange } from "../../../store/auth-store";
import { getUnidyClient } from "../../../api-client";
import { profileStore, onChange as profileOnChange } from "../../../store/profile-store";
import type { ProfileRaw } from "../../../store/profile-store";

@Component({
  tag: "unidy-profile",
  styleUrl: "unidy-profile.css",
  shadow: true,
})
export class UnidyProfile {
  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";
  @Prop() apiUrl?: string;
  @Prop() apiKey?: string;
  @Prop() language?: string;

  private authInstance?: Auth;

  @State() fetchingProfileData = false;

  async componentWillLoad() {
    profileStore.state.language = this.language;

    if (this.initialData !== "") {
      profileStore.state.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else {
      this.authInstance = await Auth.getInstance();

      const idToken = await this.authInstance?.getToken();

      if (idToken && typeof idToken === "string") {
        await this.fetchProfileData(idToken as string);
      }
    }

    profileStore.state.loading = false;
  }

  async fetchProfileData(idToken: string) {
    this.fetchingProfileData = true;
    try {
      const resp = await getUnidyClient().profile.fetchProfile({ idToken, lang: this.language });

      if (resp.success) {
        profileStore.state.configuration = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
        profileStore.state.configUpdateSource = "fetch";
        profileStore.state.errors = {};
        profileStore.state.flashErrors = {};

        profileStore.state.data = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
      } else {
        profileStore.state.flashErrors = { [String(resp?.status)]: String(resp?.error) };
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      profileStore.state.flashErrors = { error: "Failed to load profile data. Please check configuration." };
    }
    this.fetchingProfileData = false;
  }

  componentDidLoad() {
    profileOnChange("configuration", (cfg) => {
      profileStore.state.data = cfg as ProfileRaw;
    });

    authOnChange("token", (newToken: string | null) => {
      const token = newToken ?? "";

      if (token) {
        this.fetchProfileData(token);
      }
    });
  }

  render() {
    const hasFieldErrors = Object.values(profileStore.state.errors).some(Boolean);
    const errorMsg = Object.values(profileStore.state.flashErrors).filter(Boolean).join(", ");
    const wasSubmit = profileStore.state.configUpdateSource === "submit";

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
