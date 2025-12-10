import { authStore, authState } from "../auth/store/auth-store";
import type { CreateSignInResponse, PasskeyOptionsResponse, RequiredFieldsResponse, TokenResponse, UnidyClient } from "../api";
import type { ProfileRaw } from "../profile/store/profile-store";
import { state as profileState } from "../profile/store/profile-store";
import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "./auth";

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
      const signInResponse = response as CreateSignInResponse;
      authStore.setStep("verification");
      authStore.setEmail(email);
      authStore.setSignInId(signInResponse.sid);
      authStore.setLoginOptions(signInResponse.login_options);
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
      if (error === "missing_required_fields") {
        authStore.setMissingFields((response as RequiredFieldsResponse).fields);
        profileState.data = (response as RequiredFieldsResponse).fields as ProfileRaw;
        authStore.setStep("missing-fields");
        authStore.setLoading(false);
        return;
      }
      if (error === "account_locked") {
        authStore.setGlobalError("auth", error);
      } else {
        authStore.setFieldError("password", error);
      }
      authStore.setLoading(false);
    } else {
      authStore.setToken((response as TokenResponse).jwt);
      authStore.setLoading(false);
      authStore.getRootComponentRef()?.onAuth(response as TokenResponse);
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
      if (error === "missing_required_fields") {
        authStore.setMissingFields((response as RequiredFieldsResponse).fields);
        profileState.data = (response as RequiredFieldsResponse).fields as ProfileRaw;
        authStore.setStep("missing-fields");
        return;
      }
      authStore.setFieldError("magicCode", error);
      authStore.setLoading(false);
    } else {
      authStore.setToken((response as TokenResponse).jwt);
      authStore.setLoading(false);
      authStore.getRootComponentRef()?.onAuth(response as TokenResponse);
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

  async authenticateWithPasskey() {
    authStore.setLoading(true);
    authStore.clearErrors();

    // Check if WebAuthn is available
    if (!window.PublicKeyCredential) {
      authStore.setGlobalError("auth", "passkey_not_supported");
      authStore.setLoading(false);
      return;
    }

    try {
      // Step 1: Get passkey options from server (pass sid if available from previous step)
      const [optionsError, options] = await this.client.auth.getPasskeyOptions(authState.sid || undefined);

      if (optionsError || !options) {
        authStore.setGlobalError("auth", optionsError || "bad_request");
        authStore.setLoading(false);
        return;
      }

      // Step 2: Convert options for navigator.credentials.get()
      // Helper to decode base64url (WebAuthn uses base64url encoding)
      const decodeBase64Url = (base64url: string): Uint8Array => {
        // Convert base64url to regular base64 for atob
        const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
        // Add padding if needed
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
      };

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: Uint8Array.from(atob((options as PasskeyOptionsResponse).challenge), (c) => c.charCodeAt(0)),
        timeout: (options as PasskeyOptionsResponse).timeout || 60000,
        rpId: (options as PasskeyOptionsResponse).rpId,
        userVerification: ((options as PasskeyOptionsResponse).userVerification as UserVerificationRequirement) || "required",
        allowCredentials: (options as PasskeyOptionsResponse).allowCredentials?.map((cred) => ({
          ...cred,
          id: decodeBase64Url(cred.id),
        })),
      };

      // Step 3: Get credential from browser
      const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        authStore.setGlobalError("auth", "passkey_cancelled");
        authStore.setLoading(false);
        return;
      }

      // Step 4: Format credential for server
      const response = credential.response as AuthenticatorAssertionResponse;
      const formattedCredential = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
        },
        type: credential.type,
      };

      // Step 5: Verify credential with server
      const [verifyError, tkResponse] = await this.client.auth.authenticateWithPasskey(formattedCredential);

      const tokenResponse = tkResponse as TokenResponse;
      if (verifyError || !tokenResponse) {
        authStore.setGlobalError("auth", verifyError || "authentication_failed");
        authStore.setLoading(false);
        return;
      }

      // Success: Set token and notify
      authStore.setToken(tokenResponse.jwt);

      // Extract sid from response or JWT token and update store
      // @ts-ignore
      if (tokenResponse.sid) {
        // @ts-ignore
        authStore.setSignInId(tokenResponse.sid);
      } else {
        // Fallback: extract sid from JWT token payload
        try {
          const decoded = jwtDecode<TokenPayload>(tokenResponse.jwt);
          if (decoded.sid) {
            authStore.setSignInId(decoded.sid);
          }
        } catch (error) {
          // Failed to decode JWT token to extract sid, continue without it
        }
      }

      authStore.setLoading(false);
      authStore.getRootComponentRef()?.onAuth(tokenResponse);
    } catch (error) {
      console.log(error);

      // Handle WebAuthn API errors
      let errorMessage = "passkey_error";
      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotSupportedError":
            errorMessage = "passkey_not_supported";
            break;
          case "NotAllowedError":
            errorMessage = "passkey_cancelled";
            break;
          case "SecurityError":
            errorMessage = "passkey_security_error";
            break;
          case "InvalidStateError":
            errorMessage = "passkey_invalid_state";
            break;
          default:
            errorMessage = "passkey_error";
        }
      }
      authStore.setGlobalError("auth", errorMessage);
      authStore.setLoading(false);
    }
  }

  private extractSignInIdFromQuery() {
    const url = new URL(window.location.href);
    const sid = url.searchParams.get("sid") || null;

    if (sid) {
      authStore.setSignInId(sid);
      url.searchParams.delete("sid");
      window.history.replaceState(null, "", url.toString());
    }
  }
}
