import { authStore, authState } from "../auth/store/auth-store";
import type { CreateSignInResponse, RequiredFieldsResponse, TokenResponse, UnidyClient } from "../api";
import type { ProfileRaw } from "../profile";
import { state as profileState } from "../profile/store/profile-store";
import { Flash } from "../shared/store/flash-store";
import { t } from "../i18n";
import { authenticateWithPasskey } from "./passkey-auth";

export class AuthHelpers {
  private client: UnidyClient;

  constructor(client: UnidyClient) {
    this.client = client;
  }

  async createSignIn(email: string) {
    if (!email) {
      throw new Error(t("errors.required_field", { field: "Email" }));
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.createSignIn(email);

    if (error) {
      authStore.setFieldError("email", error);
    } else {
      const signInResponse = response as CreateSignInResponse;
      authStore.setStep("verification");
      authStore.setEmail(email);
      authStore.setSignInId(signInResponse.sid);
      authStore.setLoginOptions(signInResponse.login_options);
    }

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

    if (!error) {
      authStore.setLoading(false);
      this.handleAuthSuccess(response as TokenResponse);
      return;
    }

    if (error === "missing_required_fields") {
      this.handleMissingFields(response as RequiredFieldsResponse);
      return;
    }

    authStore.setFieldError("password", error);
    authStore.setLoading(false);
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
    this.extractSignInIdFromQuery();

    if (!authState.sid) {
      // call logger when we add one
      return;
    }

    const [error, response] = await this.client.auth.refreshToken(authState.sid);

    if (error) {
      authStore.setGlobalError("auth", error);
    } else {
      authStore.setToken((response as TokenResponse).jwt);
    }
  }

  handleSocialAuthRedirect(): void {
    // missing required fields flow
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const error = params.get("error");

    if (error !== "missing_required_fields") {
      return;
    }

    const fieldsFromUrl = params.get("fields");
    if (!fieldsFromUrl) {
      return;
    }

    const signInId = params.get("sid");
    if (signInId) {
      authStore.setSignInId(signInId);
    } else {
      return;
    }

    try {
      const fields = JSON.parse(fieldsFromUrl);

      authStore.setMissingFields(fields);
      profileState.data = fields as ProfileRaw;
      authStore.setStep("missing-fields");

      params.delete("error");
      params.delete("fields");
      const cleanUrl = `${url.origin}${url.pathname}${url.hash}`;
      window.history.replaceState(null, "", cleanUrl);
    } catch (e) {
      console.error("Failed to parse missing fields payload:", e);
      authStore.setGlobalError("auth", "invalid_required_fields_payload");
    }
  }

  async sendMagicCode() {
    if (!authState.sid) {
      throw new Error(t("errors.no_sign_in_id"));
    }

    authStore.setMagicCodeStep("requested");
    authStore.setLoading(true);
    authStore.clearErrors();

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

    if (!error) {
      this.handleAuthSuccess(response as TokenResponse);
      return;
    }

    if (error === "missing_required_fields") {
      this.handleMissingFields(response as RequiredFieldsResponse);
      return;
    }

    authStore.setLoading(false);
    authStore.setFieldError("magicCode", error);
  }

  async sendResetPasswordEmail() {
    if (!authState.sid) {
      throw new Error(t("errors.no_sign_in_id"));
    }

    authStore.setLoading(true);
    authStore.setResetPasswordStep("requested");

    const [error, _] = await this.client.auth.sendResetPasswordEmail(authState.sid, window.location.href);

    if (error) {
      authStore.setFieldError("password", error);
    } else {
      authStore.setResetPasswordStep("sent");
      authStore.clearErrors();
    }

    authStore.setLoading(false);
  }

  handleResetPasswordRedirect(): boolean {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const resetToken = params.get("reset_password_token");

    if (!resetToken) {
      return false;
    }

    authStore.setResetToken(resetToken);
    authStore.setStep("reset-password");

    return true;
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

      // TODO: remove later when we have proper password requirements handling
      if (error === "invalid_password") {
        console.log("Temporary displaying this: ", response.details?.password);
      }
    } else {
      authStore.setStep("email");
      authStore.updateResetPassword({
        step: "completed",
        token: null,
        newPassword: "",
        passwordConfirmation: "",
      });

      this.clearUrlParam("reset_password_token");
      Flash.success.addMessage("Password reset successfully");
    }

    authStore.setLoading(false);
  }

  authenticateWithPasskey() {
    return authenticateWithPasskey(this.client, (response) => this.handleAuthSuccess(response));
  }

  private extractSignInIdFromQuery() {
    const sid = this.clearUrlParam("sid");

    if (sid) {
      authStore.setSignInId(sid);
    }
  }

  private handleMissingFields(response: RequiredFieldsResponse) {
    authStore.setMissingFields(response.fields);
    profileState.data = response.fields as ProfileRaw;
    authStore.setStep("missing-fields");
    authStore.setLoading(false);
  }

  private handleAuthSuccess(response: TokenResponse) {
    authStore.setToken(response.jwt);
    authStore.setLoading(false);
    authStore.getRootComponentRef()?.onAuth(response);
  }

  private clearUrlParam(param: string): string | null {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(param);

    if (value) {
      url.searchParams.delete(param);
      window.history.replaceState(null, "", url.toString());
    }

    return value;
  }
}
