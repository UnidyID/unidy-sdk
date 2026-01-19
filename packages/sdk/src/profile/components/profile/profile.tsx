import * as Sentry from "@sentry/browser";
import { Component, Event, type EventEmitter, Host, h, Method, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange, authStore } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { Flash } from "../../../shared/store/flash-store";
import { onChange as unidyOnChange, unidyState } from "../../../shared/store/unidy-store";
import { buildPayload, validateRequiredFieldsUnchanged } from "../../profile-helpers";
import type { ProfileRaw } from "../../store/profile-store";
import { onChange as profileOnChange, state as profileState } from "../../store/profile-store";

@Component({
  tag: "u-profile",
  shadow: false,
})
export class Profile {
  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";

  @Event() uProfileSuccess!: EventEmitter<{ message: string; payload: ProfileRaw }>;
  @Event() uProfileError!: EventEmitter<{
    error: string;
    details: {
      fieldErrors?: Record<string, string>;
      httpStatus?: number;
      responseData?: unknown;
    };
  }>;

  @State() fetchingProfileData = false;

  constructor() {
    unidyOnChange("locale", async (_locale) => {
      if (authStore.state.authenticated) await this.getTokenAndFetchProfile();
    });
  }

  async componentWillLoad() {
    if (this.initialData !== "") {
      profileState.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else {
      // Ensure auth is initialized before checking authenticated state
      await Auth.getInstance();

      if (authStore.state.authenticated) {
        await this.getTokenAndFetchProfile();
      }
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
        Flash.clear("error");

        profileState.data = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
      } else {
        Flash.error.addMessage(String(resp?.error));
      }
    } catch (error) {
      Sentry.captureException("Failed to fetch profile data:", error);
      Flash.error.addMessage(t("errors.failed_to_load_profile"));
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
      Flash.clear("error");
      Flash.success.addMessage(t("profile.updated"));
      this.uProfileSuccess.emit({ message: "profile_updated_successfully", payload: resp.data as ProfileRaw });
    } else {
      if (resp?.data && "flatErrors" in resp.data) {
        profileState.errors = resp.data.flatErrors as Record<string, string>;
        this.uProfileError.emit({
          error: "profile_update_field_errors",
          details: { fieldErrors: profileState.errors, httpStatus: resp?.status, responseData: resp?.data },
        });
      } else {
        Flash.error.addMessage(String(resp?.error));
        this.uProfileError.emit({
          error: "profile_update_failed",
          details: { httpStatus: resp?.status, responseData: resp?.data },
        });
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
    if (authStore.state.authenticated) {
      return this.fetchingProfileData ? (
        <div>{t("loading")}</div>
      ) : (
        <Host>
          <slot />
          <u-flash-message />
        </Host>
      );
    }

    return <h2>{t("profile.signInToView")}</h2>;
  }
}
