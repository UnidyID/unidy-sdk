import * as Sentry from "@sentry/browser";
import { Component, Event, type EventEmitter, Host, h, Method, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange, authStore } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { Flash } from "../../../shared/store/flash-store";
import { onChange as unidyOnChange } from "../../../shared/store/unidy-store";
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
    await this.fetchProfileData();
  }

  async fetchProfileData() {
    // avoid multiple requests
    if (this.fetchingProfileData) return;

    this.fetchingProfileData = true;
    try {
      const [error, data] = await getUnidyClient().profile.get();

      if (error) {
        Flash.error.addMessage(String(error));
      } else {
        Flash.clear("error");
        profileState.configuration = JSON.parse(JSON.stringify(data)) as ProfileRaw;
        profileState.configUpdateSource = "fetch";
        profileState.errors = {};
        profileState.data = JSON.parse(JSON.stringify(data)) as ProfileRaw;
      }
    } catch (error) {
      Sentry.captureException("Failed to fetch profile data:", error);
      Flash.error.addMessage(t("errors.failed_to_load_profile"));
    } finally {
      this.fetchingProfileData = false;
    }
  }

  @Method()
  async submitProfile() {
    profileState.loading = true;

    const { configuration, ...stateWithoutConfig } = profileState;

    if (!validateRequiredFieldsUnchanged(stateWithoutConfig.data)) {
      profileState.loading = false;
      return;
    }

    const updatedProfileData = buildPayload(stateWithoutConfig.data);
    const [error, data, responseInfo] = await getUnidyClient().profile.update({ payload: updatedProfileData });

    if (error) {
      Flash.error.addMessage(String(error));

      if (data && "flatErrors" in data) {
        profileState.errors = data.flatErrors as Record<string, string>;
        this.uProfileError.emit({
          error: "profile_update_field_errors",
          details: {
            fieldErrors: profileState.errors,
            httpStatus: responseInfo?.httpStatus,
            responseData: responseInfo?.responseData,
          },
        });
      } else {
        this.uProfileError.emit({
          error: "profile_update_failed",
          details: {
            httpStatus: responseInfo?.httpStatus,
            responseData: responseInfo?.responseData,
          },
        });
      }
      profileState.loading = false;
    } else {
      profileState.loading = false;
      profileState.configuration = JSON.parse(JSON.stringify(data));
      profileState.configUpdateSource = "submit";
      profileState.errors = {};
      Flash.clear("error");
      Flash.success.addMessage(t("profile.updated"));
      this.uProfileSuccess.emit({ message: "profile_updated_successfully", payload: data as ProfileRaw });
    }
  }

  componentDidLoad() {
    profileOnChange("configuration", (cfg) => {
      profileState.data = cfg as ProfileRaw;
    });

    authOnChange("token", (newToken: string | null) => {
      const token = newToken ?? "";

      if (token) {
        this.fetchProfileData();
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
        </Host>
      );
    }

    return <h2>{t("profile.signInToView")}</h2>;
  }
}
