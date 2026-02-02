import type { TokenResponse, UnidyClient } from "../../api";
import { t } from "../../i18n";
import { authState, authStore } from "../store/auth-store";

export class BrandConnect {
  private client: UnidyClient;

  constructor(client: UnidyClient) {
    this.client = client;
  }

  async connectBrand() {
    if (!authState.sid) {
      throw new Error(t("errors.no_sign_in_id"));
    }

    authStore.setLoading(true);
    authStore.clearErrors();

    const [error, response] = await this.client.auth.connectBrand({ signInId: authState.sid });

    if (error) {
      this.handleAuthError(error, response);
      return;
    }

    this.handleAuthSuccess(response as TokenResponse);
  }

  async cancelBrandConnect() {
    // Sign out to clear cookies and session
    if (authState.sid) {
      await this.client.auth.signOut({ signInId: authState.sid });
    }

    // Remember the initial step before resetting
    const initialStep = authState.initialStep;

    // Reset to initial state
    authStore.reset();
    authStore.setStep(initialStep);
  }

  private handleAuthSuccess(response: TokenResponse) {
    authStore.setToken(response.jwt);
    authStore.setLoading(false);
    authStore.getRootComponentRef()?.onAuth(response);
  }

  private handleAuthError(error: string, response: unknown) {
    switch (error) {
      case "brand_connection_required": {
        authStore.setStep("connect-brand");
        break;
      }

      default:
        authStore.setGlobalError("auth", error);
        break;
    }

    authStore.setLoading(false);
  }
}
