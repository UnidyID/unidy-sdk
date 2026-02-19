// Provider

// Re-export commonly needed SDK types
export type {
  CreateSignInResponse,
  CreateSubscriptionsPayload,
  CreateSubscriptionsResponse,
  Newsletter,
  NewsletterSubscription,
  PaginationMeta,
  Preference,
  PreferenceGroup,
  StandaloneUnidyClientConfig,
  Subscription,
  Ticket,
  TokenResponse,
  UserProfileData,
  UserProfileFormError,
} from "@unidy.io/sdk/standalone";
// Re-export the base client class
export { StandaloneUnidyClient } from "@unidy.io/sdk/standalone";
// Auth utilities
export { authStorage } from "./auth/auth-storage";
// Auth hooks
export { useLogin } from "./auth/hooks/use-login";
export { useSession } from "./auth/hooks/use-session";
export type {
  AuthErrors,
  AuthStep,
  LoginOptions,
  UseLoginOptions,
  UseLoginReturn,
  UseSessionOptions,
  UseSessionReturn,
} from "./auth/types";
// Enhanced client (auto-wires getIdToken to auth storage)
export { createStandaloneClient } from "./client";
// Newsletter hooks
export type { UseNewsletterLoginReturn } from "./hooks/newsletter/use-newsletter-login";
export { useNewsletterLogin } from "./hooks/newsletter/use-newsletter-login";
export type {
  ExistingSubscription,
  UseNewsletterPreferenceCenterArgs,
  UseNewsletterPreferenceCenterReturn,
} from "./hooks/newsletter/use-newsletter-preference-center";
export { useNewsletterPreferenceCenter } from "./hooks/newsletter/use-newsletter-preference-center";
export type { UseNewsletterResendConfirmationReturn } from "./hooks/newsletter/use-newsletter-resend-confirmation";
export { useNewsletterResendConfirmation } from "./hooks/newsletter/use-newsletter-resend-confirmation";
export type { SubscribeArgs, UseNewsletterSubscribeReturn } from "./hooks/newsletter/use-newsletter-subscribe";
export { useNewsletterSubscribe } from "./hooks/newsletter/use-newsletter-subscribe";
export type { UseProfileOptions, UseProfileReturn } from "./hooks/profile/use-profile";
// Profile hook
export { useProfile } from "./hooks/profile/use-profile";
export type { UsePaginationOptions, UsePaginationReturn } from "./hooks/ticketable/use-pagination";
// Ticketable hooks
export { usePagination } from "./hooks/ticketable/use-pagination";
export type {
  ExportFormat,
  ExportLinkResponse,
  TicketableFilter,
  TicketableType,
  UseTicketablesOptions,
  UseTicketablesReturn,
} from "./hooks/ticketable/use-ticketables";
export { useTicketables } from "./hooks/ticketable/use-ticketables";
export { UnidyProvider, useUnidyClient } from "./provider";

// Types
export type { HookCallbacks } from "./types";

// Utility
export { isSuccess } from "./utils";
