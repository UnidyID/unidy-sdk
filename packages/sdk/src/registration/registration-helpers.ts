import type { UnidyClient } from "../api";
import type {
  CreateRegistrationPayload,
  PasskeyCreationOptions,
  RegistrationFlowResponse,
  SendVerificationCodeResponse,
  UpdateRegistrationPayload,
} from "../auth/api/register";
import type { TokenResponse } from "../auth/api/schemas";
import { authStore } from "../auth/store/auth-store";
import { t } from "../i18n";
import { createLogger } from "../logger";
import { buildPublicKeyCreationOptions, formatCreationCredentialForServer, PASSKEY_ERRORS } from "../shared/passkey-utils";
import { registrationState, registrationStore } from "./store/registration-store";

const logger = createLogger("RegistrationHelpers");

export class RegistrationHelpers {
  private client: UnidyClient;

  constructor(client: UnidyClient) {
    this.client = client;
  }

  /**
   * Build the payload for creating or updating a registration.
   * Collects email, password, profile data, custom attributes, and newsletter preferences from the store.
   */
  private buildPayload(): UpdateRegistrationPayload {
    const payload: UpdateRegistrationPayload = {};

    if (registrationState.email) {
      payload.email = registrationState.email;
    }

    if (registrationState.password) {
      payload.password = registrationState.password;
    }

    if (registrationState.passwordlessFlag) {
      payload.passwordless_flag = true;
    }

    // Build registration_profile_data
    const hasProfileData = Object.keys(registrationState.profileData).length > 0;
    const hasCustomAttributes = Object.keys(registrationState.customAttributes).length > 0;

    if (hasProfileData || hasCustomAttributes) {
      payload.registration_profile_data = {
        ...registrationState.profileData,
        ...(hasCustomAttributes && { custom_attributes: registrationState.customAttributes }),
      };
    }

    // Newsletter preferences
    if (Object.keys(registrationState.newsletterPreferences).length > 0) {
      payload.newsletter_preferences = registrationState.newsletterPreferences;
    }

    return payload;
  }

  /**
   * Create a new registration flow (first step).
   */
  async createRegistration(registrationUrl: string, brandId?: number): Promise<boolean> {
    registrationStore.setLoading(true);
    registrationStore.setSubmitting(true);
    registrationStore.clearErrors();

    const payload: CreateRegistrationPayload = {
      registration_url: registrationUrl,
      ...this.buildPayload(),
    };

    if (brandId) {
      payload.brand_id = brandId;
    }

    const [error, response] = await this.client.auth.createRegistration(payload);

    registrationStore.setLoading(false);
    registrationStore.setSubmitting(false);

    if (error) {
      if (error === "registration_flow_already_exists") {
        registrationStore.setEmailAlreadyInFlow(true);
        registrationStore.setFieldError("email", error);
        return false;
      }

      if (error === "email_already_registered") {
        registrationStore.setFieldError("email", error);
        return false;
      }

      if (error === "invalid_record") {
        // Server validation error - parse field errors from response
        this.handleValidationErrors(response);
        return false;
      }

      if (error === "password_validation_failed") {
        this.handlePasswordValidationError(response);
        return false;
      }

      registrationStore.setGlobalError("registration", error);
      return false;
    }

    const flowResponse = response as RegistrationFlowResponse;
    registrationStore.setRid(flowResponse.rid);
    registrationStore.setFlowResponse(flowResponse);

    return true;
  }

  /**
   * Update the current registration flow (subsequent steps).
   */
  async updateRegistration(): Promise<boolean> {
    if (!registrationState.rid) {
      registrationStore.setGlobalError("registration", "registration_not_found");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.setSubmitting(true);
    registrationStore.clearErrors();

    const payload = this.buildPayload();

    const [error, response] = await this.client.auth.updateRegistration(payload, {
      rid: registrationState.rid,
    });

    registrationStore.setLoading(false);
    registrationStore.setSubmitting(false);

    if (error) {
      if (error === "invalid_record") {
        this.handleValidationErrors(response);
        return false;
      }

      if (error === "password_validation_failed") {
        this.handlePasswordValidationError(response);
        return false;
      }

      registrationStore.setGlobalError("registration", error);
      return false;
    }

    registrationStore.setFlowResponse(response as RegistrationFlowResponse);
    return true;
  }

  /**
   * Finalize the registration and create the user.
   */
  async finalizeRegistration(): Promise<boolean> {
    if (!registrationState.rid) {
      registrationStore.setGlobalError("registration", "registration_not_found");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.setSubmitting(true);
    registrationStore.clearErrors();

    const [error, response] = await this.client.auth.finalizeRegistration({
      rid: registrationState.rid,
    });

    registrationStore.setLoading(false);
    registrationStore.setSubmitting(false);

    if (error) {
      if (error === "cannot_finalize") {
        // Handle missing requirements
        const cannotFinalizeResponse = response as { missing_fields?: string[]; email_missing?: boolean; auth_method_missing?: boolean };
        if (cannotFinalizeResponse.email_missing) {
          registrationStore.setFieldError("email", "email_required");
        }
        if (cannotFinalizeResponse.auth_method_missing) {
          registrationStore.setGlobalError("registration", "auth_method_required");
        }
        if (cannotFinalizeResponse.missing_fields?.length) {
          for (const field of cannotFinalizeResponse.missing_fields) {
            registrationStore.setFieldError(field, "field_required");
          }
        }
        return false;
      }

      if (error === "email_already_registered") {
        registrationStore.setFieldError("email", error);
        return false;
      }

      registrationStore.setGlobalError("registration", error);
      return false;
    }

    const flowResponse = response as RegistrationFlowResponse;
    registrationStore.setFlowResponse(flowResponse);
    registrationStore.clearRid();

    // Process auth tokens returned after successful finalization
    if (flowResponse.auth) {
      const tokenResponse: TokenResponse = { jwt: flowResponse.auth.id_token, refresh_token: flowResponse.auth.refresh_token };
      authStore.setToken(tokenResponse.jwt);
      authStore.setRefreshToken(tokenResponse.refresh_token);
      authStore.getRootComponentRef()?.onAuth(tokenResponse);
    }

    return true;
  }

  /**
   * Send email verification code.
   */
  async sendEmailVerificationCode(): Promise<boolean> {
    if (!registrationState.rid) {
      registrationStore.setGlobalError("registration", "registration_not_found");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.clearErrors();

    const [error, response] = await this.client.auth.sendEmailVerificationCode({
      rid: registrationState.rid,
    });

    registrationStore.setLoading(false);

    if (error) {
      if (error === "verification_code_recently_sent") {
        registrationStore.setVerificationCodeSent(true);
        registrationStore.setFieldError("verificationCode", error);
        return false;
      }

      registrationStore.setGlobalError("registration", error);
      return false;
    }

    const codeResponse = response as SendVerificationCodeResponse;
    registrationStore.setVerificationCodeSent(true);
    registrationStore.setEnableResendAfter(codeResponse.enable_resend_after);

    return true;
  }

  /**
   * Verify email with the code.
   */
  async verifyEmail(code: string): Promise<boolean> {
    if (!registrationState.rid) {
      registrationStore.setGlobalError("registration", "registration_not_found");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.clearErrors();

    const [error, response] = await this.client.auth.verifyEmail({ code }, { rid: registrationState.rid });

    registrationStore.setLoading(false);

    if (error) {
      registrationStore.setFieldError("verificationCode", error);
      return false;
    }

    registrationStore.setFlowResponse(response as RegistrationFlowResponse);
    registrationStore.setEmailVerified(true);

    return true;
  }

  /**
   * Send resume link to continue registration.
   */
  async sendResumeLink(): Promise<boolean> {
    if (!registrationState.email) {
      registrationStore.setFieldError("email", "email_required");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.clearErrors();

    const [error] = await this.client.auth.sendResumeLink({ email: registrationState.email });

    registrationStore.setLoading(false);

    if (error) {
      if (error === "registration_flow_not_found") {
        registrationStore.setEmailAlreadyInFlow(false);
        registrationStore.setGlobalError("registration", error);
        return false;
      }

      registrationStore.setGlobalError("registration", error);
      return false;
    }

    registrationStore.setResumeEmailSent(true);
    return true;
  }

  /**
   * Get the current registration flow (for resume).
   */
  async getRegistration(rid?: string): Promise<boolean> {
    const registrationRid = rid || registrationState.rid;

    if (!registrationRid) {
      return false;
    }

    registrationStore.setLoading(true);

    const [error, response] = await this.client.auth.getRegistration({ rid: registrationRid });

    registrationStore.setLoading(false);

    if (error) {
      if (error === "registration_not_found" || error === "registration_expired") {
        registrationStore.clearRid();
      }
      return false;
    }

    registrationStore.setRid(registrationRid);
    registrationStore.setFlowResponse(response as RegistrationFlowResponse);

    return true;
  }

  /**
   * Cancel the current registration flow.
   */
  async cancelRegistration(): Promise<boolean> {
    if (!registrationState.rid) {
      return false;
    }

    registrationStore.setLoading(true);

    const [error] = await this.client.auth.cancelRegistration({ rid: registrationState.rid });

    registrationStore.setLoading(false);

    if (error) {
      return false;
    }

    registrationStore.reset();
    return true;
  }

  /**
   * Handle OAuth redirect for social registration.
   */
  handleSocialAuthRedirect(): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Check for registration_rid parameter (from social OAuth callback or resume email)
    const rid = params.get("registration_rid");
    if (rid) {
      registrationStore.setRid(rid);
      params.delete("registration_rid");

      // Clean URL — the flow is fetched by RegistrationRoot.tryAutoResume()
      const cleanUrl = `${url.origin}${url.pathname}${params.toString() ? `?${params.toString()}` : ""}${url.hash}`;
      window.history.replaceState(null, "", cleanUrl);
    }
  }

  /**
   * Register a passkey for the current registration flow.
   * Gets creation options from server, triggers WebAuthn browser prompt, sends credential back.
   */
  async registerPasskey(passkeyName?: string): Promise<boolean> {
    if (!registrationState.rid) {
      registrationStore.setGlobalError("registration", "registration_not_found");
      return false;
    }

    if (!window.PublicKeyCredential) {
      registrationStore.setFieldError("passkey", "passkey_not_supported");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.clearErrors();

    try {
      const [optionsError, options] = await this.client.auth.getPasskeyCreationOptions({
        rid: registrationState.rid,
      });

      if (optionsError || !options) {
        registrationStore.setFieldError("passkey", optionsError || "bad_request");
        registrationStore.setLoading(false);
        return false;
      }

      const publicKeyOptions = buildPublicKeyCreationOptions(options as PasskeyCreationOptions);

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        registrationStore.setFieldError("passkey", "passkey_cancelled");
        registrationStore.setLoading(false);
        return false;
      }

      const formattedCredential = formatCreationCredentialForServer(credential);

      const [registerError, response] = await this.client.auth.registerPasskey(
        {
          publicKeyCredential: formattedCredential,
          passkey_name: passkeyName,
        },
        { rid: registrationState.rid },
      );

      registrationStore.setLoading(false);

      if (registerError) {
        registrationStore.setFieldError("passkey", registerError);
        return false;
      }

      registrationStore.setFlowResponse(response as RegistrationFlowResponse);
      return true;
    } catch (error) {
      logger.error("Passkey registration error:", error);

      let errorMessage = "passkey_error";
      if (error instanceof DOMException) {
        errorMessage = PASSKEY_ERRORS[error.name] || "passkey_error";
      }

      registrationStore.setFieldError("passkey", errorMessage);
      registrationStore.setLoading(false);
      return false;
    }
  }

  /**
   * Remove the passkey from the current registration flow.
   */
  async removePasskey(): Promise<boolean> {
    if (!registrationState.rid) {
      registrationStore.setGlobalError("registration", "registration_not_found");
      return false;
    }

    registrationStore.setLoading(true);
    registrationStore.clearErrors();

    const [error, response] = await this.client.auth.removePasskey({
      rid: registrationState.rid,
    });

    registrationStore.setLoading(false);

    if (error) {
      registrationStore.setFieldError("passkey", error);
      return false;
    }

    registrationStore.setFlowResponse(response as RegistrationFlowResponse);
    return true;
  }

  /**
   * Parse password validation errors from API response and set them as field errors.
   * Server sends { meta: { password_errors: ["min_length", "number", ...] } }
   */
  private handlePasswordValidationError(response: unknown): void {
    const errorResponse = response as { meta?: { password_errors?: string[] } };
    const passwordErrors = errorResponse?.meta?.password_errors;

    if (Array.isArray(passwordErrors) && passwordErrors.length > 0) {
      const messages = passwordErrors
        .map((key) => t(`errors.password_requirements.${key}`))
        .filter((msg) => msg);
      registrationStore.setFieldError("password", messages.join(", "));
    } else {
      registrationStore.setFieldError("password", "password_validation_failed");
    }
  }

  /**
   * Parse validation errors from API response and set them in the store.
   */
  private handleValidationErrors(response: unknown): void {
    if (!response || typeof response !== "object") {
      registrationStore.setGlobalError("registration", "invalid_record");
      return;
    }

    const errorResponse = response as { errors?: Record<string, string[]>; error?: string };

    if (errorResponse.errors) {
      for (const [field, messages] of Object.entries(errorResponse.errors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          registrationStore.setFieldError(field, messages[0]);
        }
      }
    } else {
      registrationStore.setGlobalError("registration", errorResponse.error || "invalid_record");
    }
  }
}
