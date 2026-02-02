import type { ApiClient } from "../../api";

// Re-export shared types
export { type CommonErrors, type ErrorResponse, type TokenResponse, type RequiredFieldsResponse } from "./shared";

// Re-export sign-in types and schemas
export type {
  CreateSignInPayload,
  CreateSignInResponse,
  SendMagicCodeResponse,
  SendMagicCodeError,
  PasskeyOptionsResponse,
  PasskeyCredential,
  CreateSignInResult,
  AuthenticateResultShared,
  SendMagicCodeResult,
  AuthenticateWithPasswordResult,
  AuthenticateWithMagicCodeResult,
  RefreshTokenResult,
  ResetPasswordResult,
  SignOutResult,
  GetPasskeyOptionsResult,
  AuthenticateWithPasskeyResult,
} from "./sign_in";

// Re-export registration types
export type {
  RegistrationProfileData,
  NewsletterPreferences,
  RegistrationFlowResponse,
  CreateRegistrationPayload,
  UpdateRegistrationPayload,
  SendVerificationCodeResponse,
  VerifyEmailPayload,
  SendResumeLinkPayload,
  CannotFinalizeError,
  RegistrationOptions,
  CreateRegistrationResult,
  GetRegistrationResult,
  UpdateRegistrationResult,
  CancelRegistrationResult,
  FinalizeRegistrationResult,
  SendVerificationCodeResult,
  VerifyEmailResult,
  SendResumeLinkResult,
} from "./register";

// Re-export jump-to types
export type {
  JumpToServicePayload,
  JumpToUnidyPayload,
  JumpToResponse,
  JumpToError,
  JumpToServiceResult,
  JumpToUnidyResult,
} from "./jump_to";

// Import functions from submodules
import * as signIn from "./sign_in";
import * as register from "./register";
import * as jumpTo from "./jump_to";

/**
 * AuthService provides authentication, registration, and jump-to functionality.
 * Methods delegate to specialized submodules for better code organization.
 */
export class AuthService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  // ============================================
  // Sign-in methods
  // ============================================

  createSignIn(email: string): Promise<signIn.CreateSignInResult> {
    return signIn.createSignIn(this.client, email);
  }

  sendMagicCode(signInId: string): Promise<signIn.SendMagicCodeResult> {
    return signIn.sendMagicCode(this.client, signInId);
  }

  authenticateWithPassword(signInId: string, password: string): Promise<signIn.AuthenticateWithPasswordResult> {
    return signIn.authenticateWithPassword(this.client, signInId, password);
  }

  authenticateWithMagicCode(signInId: string, code: string): Promise<signIn.AuthenticateWithMagicCodeResult> {
    return signIn.authenticateWithMagicCode(this.client, signInId, code);
  }

  // biome-ignore lint/suspicious/noExplicitAny: dynamic user fields
  updateMissingFields(signInId: string, user: Record<string, any>): Promise<signIn.AuthenticateResultShared> {
    return signIn.updateMissingFields(this.client, signInId, user);
  }

  refreshToken(signInId: string): Promise<signIn.RefreshTokenResult> {
    return signIn.refreshToken(this.client, signInId);
  }

  sendResetPasswordEmail(signInId: string): Promise<signIn.ResetPasswordResult> {
    return signIn.sendResetPasswordEmail(this.client, signInId);
  }

  signOut(signInId: string): Promise<signIn.SignOutResult> {
    return signIn.signOut(this.client, signInId);
  }

  getPasskeyOptions(sid?: string): Promise<signIn.GetPasskeyOptionsResult> {
    return signIn.getPasskeyOptions(this.client, sid);
  }

  authenticateWithPasskey(credential: signIn.PasskeyCredential): Promise<signIn.AuthenticateWithPasskeyResult> {
    return signIn.authenticateWithPasskey(this.client, credential);
  }

  // ============================================
  // Registration methods
  // ============================================

  createRegistration(payload: register.CreateRegistrationPayload): Promise<register.CreateRegistrationResult> {
    return register.createRegistration(this.client, payload);
  }

  getRegistration(options?: register.RegistrationOptions): Promise<register.GetRegistrationResult> {
    return register.getRegistration(this.client, options);
  }

  updateRegistration(
    payload: register.UpdateRegistrationPayload,
    options?: register.RegistrationOptions,
  ): Promise<register.UpdateRegistrationResult> {
    return register.updateRegistration(this.client, payload, options);
  }

  cancelRegistration(options?: register.RegistrationOptions): Promise<register.CancelRegistrationResult> {
    return register.cancelRegistration(this.client, options);
  }

  finalizeRegistration(options?: register.RegistrationOptions): Promise<register.FinalizeRegistrationResult> {
    return register.finalizeRegistration(this.client, options);
  }

  sendEmailVerificationCode(options?: register.RegistrationOptions): Promise<register.SendVerificationCodeResult> {
    return register.sendEmailVerificationCode(this.client, options);
  }

  verifyEmail(
    payload: register.VerifyEmailPayload,
    options?: register.RegistrationOptions,
  ): Promise<register.VerifyEmailResult> {
    return register.verifyEmail(this.client, payload, options);
  }

  sendResumeLink(payload: register.SendResumeLinkPayload): Promise<register.SendResumeLinkResult> {
    return register.sendResumeLink(this.client, payload);
  }

  // ============================================
  // Jump-to methods
  // ============================================

  jumpToService(serviceId: string, payload?: jumpTo.JumpToServicePayload): Promise<jumpTo.JumpToServiceResult> {
    return jumpTo.jumpToService(this.client, serviceId, payload);
  }

  jumpToUnidy(payload: jumpTo.JumpToUnidyPayload): Promise<jumpTo.JumpToUnidyResult> {
    return jumpTo.jumpToUnidy(this.client, payload);
  }
}
