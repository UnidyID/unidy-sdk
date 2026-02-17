import { BaseService, type ApiClientInterface, type ServiceDependencies } from "../../api/base-service";
import type { JumpToServiceRequest, JumpToUnidyRequest } from "./schemas";
import type { HandleResponseFn } from "./shared";

// Import submodules
import * as signIn from "./sign_in";
import * as register from "./register";
import * as jumpTo from "./jump_to";

// Re-export SDK version for external use (generated from package.json at build time)
export { SDK_VERSION } from "../../version";

// Re-export schema types for external use
export type {
  BrandConnectionRequiredResponse,
  CreateSignInResponse,
  ErrorResponse,
  InvalidPasswordResponse,
  LoginOptions,
  PasskeyCredential,
  PasskeyOptionsResponse,
  RequiredFieldsResponse,
  SendMagicCodeError,
  SendMagicCodeResponse,
  TokenResponse,
} from "./schemas";

// Re-export sign-in types
export type {
  CreateSignInArgs,
  SendMagicCodeArgs,
  AuthenticateWithPasswordArgs,
  AuthenticateWithMagicCodeArgs,
  UpdateMissingFieldsArgs,
  RefreshTokenArgs,
  SendResetPasswordEmailArgs,
  ResetPasswordArgs,
  ValidateResetPasswordTokenArgs,
  SignOutArgs,
  GetPasskeyOptionsArgs,
  AuthenticateWithPasskeyArgs,
  ConnectBrandArgs,
  CreateSignInResult,
  AuthenticateResultShared,
  SendMagicCodeResult,
  AuthenticateWithPasswordResult,
  AuthenticateWithMagicCodeResult,
  RefreshTokenResult,
  SendResetPasswordEmailResult,
  ResetPasswordResult,
  ValidateResetPasswordTokenResult,
  SignOutResult,
  SignedInResult,
  GetPasskeyOptionsResult,
  AuthenticateWithPasskeyResult,
  ConnectBrandResult,
} from "./sign_in";

// Re-export jump-to types
export type { JumpToServiceResult, JumpToUnidyResult } from "./jump_to";

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

/**
 * AuthService provides authentication, registration, and jump-to functionality.
 * Methods delegate to specialized submodules for better code organization.
 */
export class AuthService extends BaseService {
  private readonly respond: HandleResponseFn;

  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "AuthService", deps);
    this.respond = this.handleResponse.bind(this);
  }

  // ============================================
  // Sign-in methods
  // ============================================

  createSignIn(args: signIn.CreateSignInArgs): Promise<signIn.CreateSignInResult> {
    return signIn.createSignIn(this.client, args, this.respond);
  }

  sendMagicCode(args: signIn.SendMagicCodeArgs): Promise<signIn.SendMagicCodeResult> {
    return signIn.sendMagicCode(this.client, args, this.respond);
  }

  authenticateWithPassword(args: signIn.AuthenticateWithPasswordArgs): Promise<signIn.AuthenticateWithPasswordResult> {
    return signIn.authenticateWithPassword(this.client, args, this.respond);
  }

  authenticateWithMagicCode(args: signIn.AuthenticateWithMagicCodeArgs): Promise<signIn.AuthenticateWithMagicCodeResult> {
    return signIn.authenticateWithMagicCode(this.client, args, this.respond);
  }

  updateMissingFields(args: signIn.UpdateMissingFieldsArgs): Promise<signIn.AuthenticateResultShared> {
    return signIn.updateMissingFields(this.client, args, this.respond);
  }

  refreshToken(args: signIn.RefreshTokenArgs): Promise<signIn.RefreshTokenResult> {
    return signIn.refreshToken(this.client, args, this.respond);
  }

  sendResetPasswordEmail(args: signIn.SendResetPasswordEmailArgs): Promise<signIn.SendResetPasswordEmailResult> {
    return signIn.sendResetPasswordEmail(this.client, args, this.respond);
  }

  resetPassword(args: signIn.ResetPasswordArgs): Promise<signIn.ResetPasswordResult> {
    return signIn.resetPassword(this.client, args, this.respond);
  }

  validateResetPasswordToken(args: signIn.ValidateResetPasswordTokenArgs): Promise<signIn.ValidateResetPasswordTokenResult> {
    return signIn.validateResetPasswordToken(this.client, args, this.respond);
  }

  async signOut(args: signIn.SignOutArgs): Promise<signIn.SignOutResult> {
    const idToken = await this.getIdToken();
    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken ?? undefined });
    return signIn.signOut(this.client, args, this.respond, headers);
  }

  signedIn(): Promise<signIn.SignedInResult> {
    return signIn.signedIn(this.client, this.respond);
  }

  // ============================================
  // Passkey methods
  // ============================================

  getPasskeyOptions(args?: signIn.GetPasskeyOptionsArgs): Promise<signIn.GetPasskeyOptionsResult> {
    return signIn.getPasskeyOptions(this.client, args, this.respond);
  }

  authenticateWithPasskey(args: signIn.AuthenticateWithPasskeyArgs): Promise<signIn.AuthenticateWithPasskeyResult> {
    return signIn.authenticateWithPasskey(this.client, args, this.respond);
  }

  // ============================================
  // Brand connect methods
  // ============================================

  connectBrand(args: signIn.ConnectBrandArgs): Promise<signIn.ConnectBrandResult> {
    return signIn.connectBrand(this.client, args, this.respond);
  }

  // ============================================
  // Jump-to methods
  // ============================================

  jumpToService(serviceId: string, request: JumpToServiceRequest): Promise<jumpTo.JumpToServiceResult> {
    return jumpTo.jumpToService(this.client, serviceId, request, this.respond);
  }

  jumpToUnidy(request: JumpToUnidyRequest): Promise<jumpTo.JumpToUnidyResult> {
    return jumpTo.jumpToUnidy(this.client, request, this.respond);
  }

  // ============================================
  // Registration methods
  // ============================================

  createRegistration(payload: register.CreateRegistrationPayload): Promise<register.CreateRegistrationResult> {
    return register.createRegistration(this.client, payload, this.respond);
  }

  getRegistration(options?: register.RegistrationOptions): Promise<register.GetRegistrationResult> {
    return register.getRegistration(this.client, options, this.respond);
  }

  updateRegistration(
    payload: register.UpdateRegistrationPayload,
    options?: register.RegistrationOptions,
  ): Promise<register.UpdateRegistrationResult> {
    return register.updateRegistration(this.client, payload, options, this.respond);
  }

  cancelRegistration(options?: register.RegistrationOptions): Promise<register.CancelRegistrationResult> {
    return register.cancelRegistration(this.client, options, this.respond);
  }

  finalizeRegistration(options?: register.RegistrationOptions): Promise<register.FinalizeRegistrationResult> {
    return register.finalizeRegistration(this.client, options, this.respond);
  }

  sendEmailVerificationCode(options?: register.RegistrationOptions): Promise<register.SendVerificationCodeResult> {
    return register.sendEmailVerificationCode(this.client, options, this.respond);
  }

  verifyEmail(
    payload: register.VerifyEmailPayload,
    options?: register.RegistrationOptions,
  ): Promise<register.VerifyEmailResult> {
    return register.verifyEmail(this.client, payload, options, this.respond);
  }

  sendResumeLink(payload: register.SendResumeLinkPayload): Promise<register.SendResumeLinkResult> {
    return register.sendResumeLink(this.client, payload, this.respond);
  }
}