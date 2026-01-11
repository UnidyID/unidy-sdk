import * as Sentry from "@sentry/browser";
import { Component, Event, type EventEmitter, Host, h, Method, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { authStore, onChange as authOnChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
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
      flashErrors?: Record<string, string>;
      httpStatus?: number;
      responseData?: unknown;
    };
  }>;

  @State() fetchingProfileData = false;

  constructor() {
    unidyOnChange("locale", async (_locale) => {
      if (authStore.state.authenticated) await this.fetchProfileData();
    });
  }

  async componentWillLoad() {
    if (this.initialData !== "") {
      profileState.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else if (authStore.state.authenticated) {
      await this.fetchProfileData();
    }

    profileState.loading = false;
  }

  async fetchProfileData() {
    // avoid multiple requests
    if (this.fetchingProfileData) return;

    const authInstance = await Auth.getInstance();
    const isAuthenticated = await authInstance.isAuthenticated();
    if (!isAuthenticated) {
      // Handle unauthenticated state the same as an unauthorized error from backend
      profileState.flashErrors = { error: t("errors.unauthorized") };
      return;
    }

    this.fetchingProfileData = true;
    try {
      const [error, data] = await getUnidyClient().profile.get();

      if (error === null && data) {
        profileState.configuration = JSON.parse(JSON.stringify(data)) as ProfileRaw;
        profileState.configUpdateSource = "fetch";
        profileState.errors = {};
        profileState.flashErrors = {};

        profileState.data = JSON.parse(JSON.stringify(data)) as ProfileRaw;
      } else {
        profileState.flashErrors = { error: error || "unknown_error" };
      }
    } catch (err) {
      Sentry.captureException(err);
      profileState.flashErrors = { error: t("errors.failed_to_load_profile") };
    }
    this.fetchingProfileData = false;
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

    const [error, data] = await getUnidyClient().profile.update({
      payload: updatedProfileData,
    });

    if (error === null && data) {
      profileState.loading = false;
      profileState.configuration = JSON.parse(JSON.stringify(data));
      profileState.configUpdateSource = "submit";
      profileState.errors = {};
      this.uProfileSuccess.emit({ message: "profile_updated_successfully", payload: data as ProfileRaw });
    } else if (error === "validation_error" && data && "flatErrors" in data) {
      profileState.errors = data.flatErrors as Record<string, string>;
      profileState.loading = false;
      this.uProfileError.emit({
        error: "profile_update_field_errors",
        details: { fieldErrors: profileState.errors, responseData: data },
      });
    } else {
      profileState.flashErrors = { error: error || "unknown_error" };
      profileState.loading = false;
      this.uProfileError.emit({
        error: "profile_update_failed",
        details: { flashErrors: profileState.flashErrors },
      });
    }
  }

  componentDidLoad() {
    profileOnChange("configuration", (cfg) => {
      profileState.data = cfg as ProfileRaw;
    });

    authOnChange("token", (newToken: string | null) => {
      if (newToken) {
        this.fetchProfileData();
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
