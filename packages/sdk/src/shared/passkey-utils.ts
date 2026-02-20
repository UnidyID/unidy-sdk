export const PASSKEY_ERRORS: Record<string, string> = {
  NotSupportedError: "passkey_not_supported",
  NotAllowedError: "passkey_cancelled",
  SecurityError: "passkey_security_error",
  InvalidStateError: "passkey_invalid_state",
};

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export function decodeBase64Url(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function encodeToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface PasskeyCreationOptions {
  challenge: string;
  timeout: number;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: string; alg: number }[];
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
  excludeCredentials?: { type: string; id: string; transports?: string[] }[];
  attestation?: string;
}

export function buildPublicKeyCreationOptions(options: PasskeyCreationOptions): PublicKeyCredentialCreationOptions {
  return {
    challenge: decodeBase64Url(options.challenge).buffer as ArrayBuffer,
    timeout: options.timeout || 60000,
    rp: options.rp,
    user: {
      id: decodeBase64Url(options.user.id).buffer as ArrayBuffer,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams.map((param) => ({
      type: param.type as PublicKeyCredentialType,
      alg: param.alg,
    })),
    authenticatorSelection: options.authenticatorSelection
      ? {
          authenticatorAttachment: options.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment | undefined,
          residentKey: options.authenticatorSelection.residentKey as ResidentKeyRequirement | undefined,
          requireResidentKey: options.authenticatorSelection.requireResidentKey,
          userVerification: options.authenticatorSelection.userVerification as UserVerificationRequirement | undefined,
        }
      : undefined,
    excludeCredentials: options.excludeCredentials?.map((cred) => ({
      type: cred.type as PublicKeyCredentialType,
      id: decodeBase64Url(cred.id).buffer as ArrayBuffer,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    })),
    attestation: (options.attestation as AttestationConveyancePreference) || "none",
  };
}

export function formatCreationCredentialForServer(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: encodeToBase64Url(credential.rawId),
    response: {
      attestationObject: encodeToBase64Url(response.attestationObject),
      clientDataJSON: encodeToBase64Url(response.clientDataJSON),
    },
    type: credential.type,
  };
}
