import { jwtDecode } from "jwt-decode";
import type { CreateSignInResponse, RequiredFieldsResponse, TokenResponse, UnidyClient } from "../api";
import { authState, authStore } from "../auth/store/auth-store";
import { t } from "../i18n";
import { createLogger } from "../logger";
import type { ProfileRaw } from "../profile";
import { state as profileState } from "../profile/store/profile-store";
import { clearUrlParam } from "../shared/component-utils";
import { Flash } from "../shared/store/flash-store";
import type { TokenPayload } from "./auth";
import { authenticateWithPasskey } from "./passkey-auth";

export class AuthHelpers {
  private client: UnidyClient;
  private logger = createLogger("AuthHelpers");

  constructor(client: UnidyClient) {
    this.client = client;
  }

  async createSignIn(email: string, password?: string, sendMagicCode?: boolean) {
    if (!email) {
      throw new Error(t("errors.required_field", { field: "Email" }));
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.createSignIn(email, password, sendMagicCode);

    if (error) {
      this.handleAuthError(error, response, "email");
      return;
    }

    if (password) {
      const token = jwtDecode<TokenPayload>((response as TokenResponse).jwt);
      authStore.setSignInId(token.sid);
      authStore.setToken((response as TokenResponse).jwt);
      authStore.setLoading(false);
      authStore.getRootComponentRef()?.onAuth(response as TokenResponse);
      return;
    }

    if (sendMagicCode) {
      authStore.setSignInId((response as CreateSignInResponse).sid);
      authStore.setMagicCodeStep("sent");
      authStore.setStep("magic-code");
      authStore.setLoading(false);
      return [error, response] as const;
    }
    const signInResponse = response as CreateSignInResponse;
    authStore.setStep("verification");
    authStore.setEmail(email);
    authStore.setSignInId(signInResponse.sid);
    authStore.setLoginOptions(signInResponse.login_options);
    authStore.setLoading(false);
  }

  async authenticateWithPassword(password: string) {
    if (!authState.sid) {
      throw new Error(t("errors.no_sign_in_id"));
    }

    if (!password) {
      throw new Error(t("errors.required_field", { field: "Password" }));
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.authenticateWithPassword(authState.sid, password);

    if (error) {
      this.handleAuthError(error, response, "password");
    } else {
      authStore.setLoading(false);
      this.handleAuthSuccess(response as TokenResponse);
      return;
    }
  }

  async authenticateWithMagicCode(code: string) {
    if (!authState.sid) {
      throw new Error(t("errors.no_sign_in_id"));
    }

    if (!code) {
      throw new Error(t("errors.magic_code_is_missing"));
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.authenticateWithMagicCode(authState.sid, code);

    if (error) {
      this.handleAuthError(error, response, "magicCode");
      return;
    }

    this.handleAuthSuccess(response as TokenResponse);
  }

  authenticateWithPasskey() {
    return authenticateWithPasskey(this.client, (response) => this.handleAuthSuccess(response));
  }

  async logout() {
    const [error, _] = await this.client.auth.signOut(authState.sid as string);

    if (error) {
      authStore.setGlobalError("auth", error);
    }

    return [error, _] as const;
  }

  async refreshToken() {
    if (authState.step === "missing-fields") {
      return;
    }

    const sid = clearUrlParam("sid");
    if (sid) {
      authStore.setSignInId(sid);
    }

    if (!authState.sid) {
      this.logger.warn("No sign-in ID in the session");
      return;
    }

    const [error, response] = await this.client.auth.refreshToken(authState.sid);

    if (error) {
      authStore.reset();
      authStore.setGlobalError("auth", error);
    } else {
      authStore.setToken((response as TokenResponse).jwt);
    }
  }

  async sendMagicCode() {
    if (!authState.sid && authState.step !== "single-login") {
      throw new Error(t("errors.no_sign_in_id"));
    }

    authStore.setMagicCodeStep("requested");
    authStore.setLoading(true);
    authStore.clearErrors();

    if (authState.step === "single-login") {
      const [error, response] = await this.createSignIn(authState.email, undefined, true);
      authStore.setLoading(false);
      return [error, response] as const;
    }

    const [error, response] = await this.client.auth.sendMagicCode(authState.sid);

    authStore.setLoading(false);

    authStore.setStep("magic-code");

    if (!error) {
      authStore.setMagicCodeStep("sent");

      return [null, response] as const;
    }

    authStore.setFieldError("magicCode", error);

    if (error === "magic_code_recently_created") {
      authStore.setMagicCodeStep("sent");
    }

    return [error, response] as const;
  }

  async sendResetPasswordEmail() {
    if (!authState.sid) {
      throw new Error(t("errors.no_sign_in_id"));
    }

    authStore.setLoading(true);
    authStore.setResetPasswordStep("requested");

    const [error, _] = await this.client.auth.sendResetPasswordEmail(authState.sid, window.location.href);

    if (error) {
      authStore.setFieldError("resetPassword", error);
    } else {
      authStore.setResetPasswordStep("sent");
      authStore.clearErrors();
    }

    authStore.setLoading(false);
  }

  async resetPassword() {
    if (!authState.resetPassword.token) {
      throw new Error("No reset token available");
    }

    if (!authState.resetPassword.newPassword) {
      authStore.setFieldError("resetPassword", "password_required");
      return;
    }

    if (
      authState.resetPassword.passwordConfirmation &&
      authState.resetPassword.newPassword !== authState.resetPassword.passwordConfirmation
    ) {
      authStore.setFieldError("resetPassword", "passwords_do_not_match");
      return;
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.resetPassword(
      authState.sid as string,
      authState.resetPassword.token,
      authState.resetPassword.newPassword,
      authState.resetPassword.passwordConfirmation,
    );

    if (error) {
      authStore.setFieldError("resetPassword", error);

      // TODO: add proper password requirements handling --> for now this is fine
      if (error === "invalid_password") {
        authStore.setFieldError("password", response.error_details?.password.map((p) => t(`errors.password_requirements.${p}`)).join("\n"));
      }
    } else {
      authStore.setStep("email");
      authStore.updateResetPassword({
        step: "completed",
        token: null,
        newPassword: "",
        passwordConfirmation: "",
      });

      clearUrlParam("reset_password_token");
      Flash.success.addMessage("Password reset successfully");
    }

    authStore.setLoading(false);
  }

  async handleResetPasswordRedirect(): Promise<boolean> {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const resetToken = params.get("reset_password_token");

    if (!resetToken) {
      return false;
    }

    if (authState.sid) {
      authStore.setLoading(true);

      const [error] = await this.client.auth.validateResetPasswordToken(authState.sid, resetToken);

      if (error) {
        authStore.setFieldError("resetPassword", error);
        authStore.setStep("reset-password");
        authStore.setLoading(false);
        return false;
      }
    }

    authStore.setResetToken(resetToken);
    authStore.setStep("reset-password");
    authStore.setLoading(false);

    return true;
  }

  handleSocialAuthRedirect(): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const error = params.get("error");

    // Not a social auth redirect (normal page load)
    if (!error && !params.has("sid")) {
      return;
    }

    // Handle successful social auth redirect
    if (!error && params.has("sid") && params.has("id_token")) {
      authStore.setSignInId(clearUrlParam("sid"));

      const idToken = clearUrlParam("id_token");

      if (idToken) {
        authStore.setToken(idToken);
        this.handleAuthSuccess({ jwt: idToken } as TokenResponse);
      } else {
        this.logger.error("No ID token found in the URL on social auth redirect");
      }

      return;
    }

    // Handle missing required fields
    if (error !== "missing_required_fields") {
      this.logger.error("Social auth redirect error:", error);
      return;
    }

    const fieldsFromUrl = params.get("fields");
    if (!fieldsFromUrl || !params.has("sid")) {
      return;
    }

    try {
      const fields = JSON.parse(fieldsFromUrl);
      authStore.setSignInId(clearUrlParam("sid"));

      this.handleMissingFields(fields);

      clearUrlParam("fields");
      clearUrlParam("error");
    } catch (e) {
      this.logger.error("Failed to parse missing fields payload:", e);
      authStore.setGlobalError("auth", "invalid_required_fields_payload");
    }
  }

  private handleAuthError(error: string, response: unknown, fallbackField?: "email" | "password" | "magicCode") {
    switch (error) {
      case "account_not_found":
        authStore.setFieldError("email", error);
        break;

      case "missing_required_fields": {
        const { fields, sid } = response as RequiredFieldsResponse;
        this.handleMissingFields(fields);
        if (sid) {
          authStore.setSignInId(sid);
        }
        break;
      }

      default:
        if (fallbackField === "password") {
          authStore.setFieldError("password", error);
        } else if (fallbackField === "magicCode") {
          authStore.setFieldError("magicCode", error);
        } else {
          // e.g. "account_locked", "internal_server_error"
          authStore.setGlobalError("auth", error);
        }
        break;
    }

    authStore.setLoading(false);
  }

  private handleMissingFields(fields: RequiredFieldsResponse["fields"]) {
    authStore.setMissingFields(fields);
    profileState.data = fields as ProfileRaw;
    authStore.setStep("missing-fields");
    authStore.setLoading(false);
  }

  private handleAuthSuccess(response: TokenResponse) {
    authStore.setToken(response.jwt);
    authStore.setLoading(false);
    authStore.getRootComponentRef()?.onAuth(response);
  }
}
