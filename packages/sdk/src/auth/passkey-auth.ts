import { jwtDecode } from "jwt-decode";
import type { PasskeyOptionsResponse, TokenResponse, UnidyClient } from "../api";
import { createLogger } from "../logger";
import type { TokenPayload } from "./auth";
import { authState, authStore } from "./store/auth-store";

const logger = createLogger("PasskeyAuth");

const PASSKEY_ERRORS: Record<string, string> = {
  NotSupportedError: "passkey_not_supported",
  NotAllowedError: "passkey_cancelled",
  SecurityError: "passkey_security_error",
  InvalidStateError: "passkey_invalid_state",
};

function decodeBase64Url(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function buildPublicKeyOptions(options: PasskeyOptionsResponse): PublicKeyCredentialRequestOptions {
  return {
    challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
    timeout: options.timeout || 60000,
    rpId: options.rpId,
    userVerification: (options.userVerification as UserVerificationRequirement) || "required",
    allowCredentials: options.allowCredentials?.map((cred) => ({
      ...cred,
      id: decodeBase64Url(cred.id),
    })),
  };
}

function formatCredentialForServer(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
    response: {
      authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
      clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
      signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
    },
    type: credential.type,
  };
}

function extractAndSetSignInId(tokenResponse: TokenResponse) {
  if (tokenResponse.sid) {
    authStore.setSignInId(tokenResponse.sid);
    return;
  }

  // Fallback: extract sid from JWT token payload
  try {
    const decoded = jwtDecode<TokenPayload>(tokenResponse.jwt);
    if (decoded.sid) {
      authStore.setSignInId(decoded.sid);
    }
  } catch {
    // Failed to decode JWT token to extract sid, continue without it
  }
}

function handlePasskeyError(error: unknown) {
  logger.error("Passkey error:", error);

  let errorMessage = "passkey_error";
  if (error instanceof DOMException) {
    errorMessage = PASSKEY_ERRORS[error.name] || "passkey_error";
  }

  authStore.setFieldError("passkey", errorMessage);
  authStore.setLoading(false);
}

export async function authenticateWithPasskey(client: UnidyClient, onSuccess: (response: TokenResponse) => void) {
  authStore.setLoading(true);
  authStore.clearErrors();

  if (!window.PublicKeyCredential) {
    authStore.setFieldError("passkey", "passkey_not_supported");
    authStore.setLoading(false);
    return;
  }

  try {
    const [optionsError, options] = await client.auth.getPasskeyOptions(authState.sid ? { signInId: authState.sid } : undefined);

    if (optionsError || !options) {
      authStore.setFieldError("passkey", optionsError || "bad_request");
      authStore.setLoading(false);
      return;
    }

    const publicKeyOptions = buildPublicKeyOptions(options as PasskeyOptionsResponse);

    const credential = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      authStore.setFieldError("passkey", "passkey_cancelled");
      authStore.setLoading(false);
      return;
    }

    const formattedCredential = formatCredentialForServer(credential);

    const [verifyError, tkResponse] = await client.auth.authenticateWithPasskey({
      payload: { credential: formattedCredential },
    });

    const tokenResponse = tkResponse as TokenResponse;
    if (verifyError || !tokenResponse) {
      authStore.setGlobalError("auth", verifyError || "authentication_failed");
      authStore.setLoading(false);
      return;
    }

    authStore.setToken(tokenResponse.jwt);
    extractAndSetSignInId(tokenResponse);
    onSuccess(tokenResponse);
  } catch (error) {
    handlePasskeyError(error);
  }
}
