import { authStore, authState } from "./store/auth-store";
import type { UnidyClient } from "@unidy.io/sdk-api-client";

export class AuthHelpers {
  private client: UnidyClient;

  constructor(client: UnidyClient) {
    this.client = client;
  }

  async createSignIn(email: string) {
    if (!email) {
      throw new Error("Email is required");
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.createSignIn(email);

    if (error) {
      authStore.setFieldError("email", error);
      authStore.setLoading(false);
    } else {
      authStore.setStep("verification");
      authStore.setEmail(email);
      authStore.setSignInId(response.sid);
      authStore.setLoading(false);
    }
  }

  async authenticateWithPassword(password: string) {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    if (!password) {
      throw new Error("Password is missing");
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.authenticateWithPassword(authState.sid, password);

    if (error) {
      if (error === "account_locked") {
        authStore.setGlobalError("auth", error);
      } else {
        authStore.setFieldError("password", error);
      }
      authStore.setLoading(false);
    } else {
      authStore.setToken(response.jwt);
      authStore.setLoading(false);
      authStore.getRootComponentRef()?.onAuth(response);
    }
  }

  async logout() {
    const [error, _] = await this.client.auth.signOut(authState.sid as string);
    if (error) {
      authStore.setGlobalError("auth", error);
    }
    return [error, _] as const;
  }

  async refreshToken() {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    const [error, response] = await this.client.auth.refreshToken(authState.sid);

    if (error) {
      authStore.setGlobalError("auth", error);
    } else {
      authStore.setToken(response.jwt);
    }
  }

  async sendMagicCode() {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    authStore.setMagicCodeStep("requested");
    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.sendMagicCode(authState.sid);

    authStore.setLoading(false);
    if (error) {
      authStore.setFieldError("magicCode", error);
      authStore.setStep("magic-code");
      if (error === "magic_code_recently_created") {
        authStore.setMagicCodeStep("sent");
      }
      return [error, response] as const;
    }

    authStore.setMagicCodeStep("sent");
    authStore.setStep("magic-code");
    return [null, response] as const;
  }

  async authenticateWithMagicCode(code: string) {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    if (!code) {
      throw new Error("Magic code is missing");
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.authenticateWithMagicCode(authState.sid, code);

    if (error) {
      authStore.setFieldError("magicCode", error);
      authStore.setLoading(false);
    } else {
      authStore.setToken(response.jwt);
      authStore.setLoading(false);
      authStore.getRootComponentRef()?.onAuth(response);
    }
  }

  async sendResetPasswordEmail() {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    authStore.setLoading(true);
    authStore.setResetPasswordStep("requested");

    const [error, _] = await this.client.auth.sendResetPasswordEmail(authState.sid);

    if (error) {
      authStore.setFieldError("password", error);
      authStore.setLoading(false);
    } else {
      authStore.setResetPasswordStep("sent");
      authStore.setLoading(false);
      authStore.clearErrors();
    }
  }
}
