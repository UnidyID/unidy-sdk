import * as Sentry from "@sentry/browser";
import { Component, Element, Event, type EventEmitter, Host, h, Method, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange, authStore } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { Flash } from "../../../shared/store/flash-store";
import { onChange as unidyOnChange } from "../../../shared/store/unidy-store";
import { buildPayload, validateRequiredFields } from "../../profile-helpers";
import type { ProfileRaw } from "../../store/profile-store";
import { onChange as profileOnChange, state as profileState } from "../../store/profile-store";

@Component({
  tag: "u-profile",
  shadow: false,
})
export class Profile {
  @Element() el!: HTMLElement;

  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";
  /**
   * When true, only validates and submits fields rendered as u-field components.
   * Use when your form shows a subset of profile fields.
   */
  @Prop() partialValidation = false;
  /**
   * Comma-separated list of fields to validate. Overrides auto-detection when partialValidation is true.
   */
  @Prop() validateFields?: string;

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

  /**
   * Fields registered by child u-field components for partial validation.
   *
   * Instance Isolation: This Set is an instance property, meaning each u-profile
   * component has its own independent Set. When multiple u-profile components exist
   * on the same page, each maintains its own field registry. Child u-field components
   * use findParentProfile(this.element) to locate their closest parent u-profile,
   * ensuring fields register with the correct profile instance.
   */
  private renderedFields = new Set<string>();

  /**
   * Register a field for partial validation tracking.
   * Called by child u-field components when they mount.
   */
  @Method()
  async registerField(fieldName: string): Promise<void> {
    this.renderedFields.add(fieldName);
  }

  /**
   * Unregister a field from partial validation tracking.
   * Called by child u-field components when they unmount.
   */
  @Method()
  async unregisterField(fieldName: string): Promise<void> {
    this.renderedFields.delete(fieldName);
  }

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

    // Determine which fields to validate based on partialValidation mode
    const fieldsToValidate = this.getFieldsToValidate();

    if (!validateRequiredFields(stateWithoutConfig.data, fieldsToValidate)) {
      profileState.loading = false;
      return;
    }

    let updatedProfileData = buildPayload(stateWithoutConfig.data, fieldsToValidate);

    // Add flag for backend partial validation
    if (fieldsToValidate) {
      updatedProfileData = { ...updatedProfileData, _validate_only_sent_fields: true };
    }

    const [error, data, responseInfo] = await getUnidyClient().profile.update({ payload: updatedProfileData });

    if (error) {
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
        Flash.error.addMessage(String(error));
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

  /**
   * Returns the set of fields to validate when in partial validation mode,
   * or undefined when full validation should be used.
   */
  private getFieldsToValidate(): Set<string> | undefined {
    if (!this.partialValidation) {
      return undefined;
    }

    if (this.validateFields) {
      return new Set(this.validateFields.split(",").map((f) => f.trim()));
    }

    // If no fields are registered, fall back to full validation
    // This prevents empty payloads when partialValidation is enabled but no u-field components are rendered
    if (this.renderedFields.size === 0) {
      console.warn(
        "[u-profile] partialValidation is enabled but no u-field components are rendered. Falling back to full validation. " +
          "Use the validateFields prop to explicitly specify fields if you are using custom form elements.",
      );
      return undefined;
    }

    return this.renderedFields;
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
