import { getUnidyClient } from "../api";
import type { ApiError } from "../api/shared";
import { t } from "../i18n";
import { createLogger } from "../logger";
import { captchaManager, isCaptchaError } from "../shared/captcha";
import { Flash } from "../shared/store/flash-store";
import type { MeNewsletterSubscription } from "./api/me-newsletters";
import {
  type AdditionalFieldsData,
  type CheckedNewsletters,
  type ExistingSubscription,
  type NewsletterErrorIdentifier,
  newsletterStore,
  persist,
} from "./store/newsletter-store";

const logger = createLogger("NewsletterHelpers");

function buildAdditionalFieldsPayload(additionalFields: AdditionalFieldsData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, node] of Object.entries(additionalFields)) {
    if (node.value === undefined || node.value === null || (typeof node.value === "string" && node.value.trim() === "")) continue;

    if (key.startsWith("custom_attributes.")) {
      // custom attributes
      const attrKey = key.replace("custom_attributes.", "");
      payload.custom_attributes = payload.custom_attributes || {};
      (payload.custom_attributes as Record<string, unknown>)[attrKey] = node.value;
    } else {
      // standard user attributes
      payload[key] = node.value;
    }
  }

  return payload;
}

const PERSIST_KEY_PREFIX = "unidy_newsletter_";

export function newsletterLogout(): void {
  newsletterStore.state.preferenceToken = "";
  newsletterStore.state.existingSubscriptions = [];
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
}

/**
 * A signed-in user without a preference token manages their own subscriptions on V2 `/me`. A preference
 * token wins, as it does on V1, and it and the anonymous sign-up stay on V1.
 */
function managesOwnSubscriptions(): boolean {
  return newsletterStore.state.isAuthenticated && !newsletterStore.state.preferenceToken;
}

function isSignedOutError(error: string): boolean {
  return error === "unauthorized" || error === "missing_id_token";
}

function handleSignedOut(): void {
  Flash.error.addMessage(t("newsletter.errors.unauthorized"));
  newsletterLogout();
}

function toExistingSubscription(subscription: MeNewsletterSubscription): ExistingSubscription {
  return {
    newsletter_internal_name: subscription.newsletter_slug,
    confirmed: subscription.confirmed_at !== null,
    preference_identifiers: subscription.preference_identifiers,
  };
}

export async function resendDoi(internalName: string): Promise<boolean> {
  if (managesOwnSubscriptions()) {
    return requestOwnConfirmation(internalName);
  }

  const { preferenceToken } = newsletterStore.state;

  const [error] = await getUnidyClient().newsletters.resendDoi({
    internalName,
    payload: { redirect_to_after_confirmation: redirectToAfterConfirmationUrl() },
    options: preferenceToken ? { preferenceToken } : undefined,
  });

  if (error === null) {
    return true;
  }

  if (error === "unauthorized") {
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    newsletterLogout();
    return false;
  }

  return false;
}

async function requestOwnConfirmation(internalName: string): Promise<boolean> {
  const [error] = await getUnidyClient().newsletters.me.requestConfirmation({
    slug: internalName,
    redirectToAfterConfirmation: redirectToAfterConfirmationUrl(),
  });

  if (error === null) {
    return true;
  }

  if (isSignedOutError(error)) {
    handleSignedOut();
  }

  return false;
}

export type LoginEmailResult = { success: true } | { success: false; error: "rate_limit_exceeded" | "not_found" | "unknown" };

export async function sendLoginEmail(email: string, redirectUri?: string): Promise<LoginEmailResult> {
  const [error] = await getUnidyClient().newsletters.sendLoginEmail({
    payload: {
      email,
      redirect_uri: redirectUri || redirectToAfterConfirmationUrl(),
    },
  });

  if (error === null) {
    Flash.info.addMessage(t("newsletter.success.login_email_sent"));
    return { success: true };
  } else if (error === "rate_limit_exceeded") {
    Flash.error.addMessage(t("newsletter.errors.rate_limit_exceeded", { defaultValue: "Too many requests. Please try again later." }));
    return { success: false, error: "rate_limit_exceeded" };
  } else if (error === "not_found") {
    Flash.error.addMessage(t("newsletter.errors.login_email_not_found", { defaultValue: "Email address not found" }));
    return { success: false, error: "not_found" };
  } else {
    Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
    return { success: false, error: "unknown" };
  }
}

export async function fetchSubscriptions(): Promise<void> {
  if (managesOwnSubscriptions()) {
    return fetchOwnSubscriptions();
  }

  const { preferenceToken } = newsletterStore.state;

  // either preference token is needed or the user must be authenticated
  if (!preferenceToken && !newsletterStore.state.isAuthenticated) {
    logger.error("Preference token or authentication is required to fetch subscriptions");
    return;
  }

  newsletterStore.state.fetchingSubscriptions = true;

  const [error, data] = await getUnidyClient().newsletters.list({
    options: preferenceToken ? { preferenceToken } : undefined,
  });

  newsletterStore.state.fetchingSubscriptions = false;

  if (error === "unauthorized") {
    newsletterLogout();
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    return;
  }

  if (error === null && data && Array.isArray(data)) {
    applyFetchedSubscriptions(
      data.map(
        (sub): ExistingSubscription => ({
          newsletter_internal_name: sub.newsletter_internal_name,
          confirmed: sub.confirmed_at !== null,
          preference_identifiers: sub.preference_identifiers || [],
        }),
      ),
    );
  }
}

async function fetchOwnSubscriptions(): Promise<void> {
  newsletterStore.state.fetchingSubscriptions = true;
  const [error, subscriptions] = await getUnidyClient().newsletters.me.listAll();
  newsletterStore.state.fetchingSubscriptions = false;

  if (error === null && Array.isArray(subscriptions)) {
    applyFetchedSubscriptions(subscriptions.map(toExistingSubscription));
  } else if (isSignedOutError(error)) {
    handleSignedOut();
  } else {
    logger.error("Failed to fetch newsletter subscriptions", error);
  }
}

function applyFetchedSubscriptions(subscriptions: ExistingSubscription[]): void {
  newsletterStore.state.existingSubscriptions = subscriptions;

  // init checked newsletters and preferences
  const checkedNewsletters: CheckedNewsletters = { ...newsletterStore.state.checkedNewsletters };
  for (const sub of subscriptions) {
    checkedNewsletters[sub.newsletter_internal_name] = [...sub.preference_identifiers];
  }
  newsletterStore.state.checkedNewsletters = checkedNewsletters;
}

function handleAlreadySubscribedError(errors: Array<{ error_identifier: string; meta: { newsletter_internal_name: string } }>): void {
  if (!newsletterStore.state.isAuthenticated && !newsletterStore.state.preferenceToken) {
    return;
  }

  const existingNames = new Set(newsletterStore.state.existingSubscriptions.map((s) => s.newsletter_internal_name));

  const newSubscriptions: ExistingSubscription[] = errors
    .filter((err) => err.error_identifier === "already_subscribed" && !existingNames.has(err.meta.newsletter_internal_name))
    .map((err) => ({
      newsletter_internal_name: err.meta.newsletter_internal_name,
      confirmed: false, // We don't know the confirmation status for already_subscribed errors
      preference_identifiers: [],
    }));

  if (newSubscriptions.length > 0) {
    newsletterStore.state.existingSubscriptions = [...newsletterStore.state.existingSubscriptions, ...newSubscriptions];
  }
}

function requestedPreferences(internalName: string): string[] {
  const { checkedNewsletters, defaultPreferences } = newsletterStore.state;
  return internalName in checkedNewsletters ? checkedNewsletters[internalName] : [...(defaultPreferences[internalName] ?? [])];
}

/** Maps a failed V2 subscribe onto the identifiers `<u-error-message>` translates; null when it names no newsletter problem. */
function subscribeErrorFor(error: string, data: unknown): NewsletterErrorIdentifier | null {
  if (error === "not_found") return "newsletter_not_found";
  if (error !== "unprocessable_content") return null;

  const details: ApiError["details"] = data && typeof data === "object" && "details" in data ? (data as ApiError).details : [];
  const has = (field: string, code?: string) => details.some((d) => d.field === field && (code === undefined || d.code === code));

  if (has("payload.data.newsletter_id", "taken")) return "already_subscribed";
  if (has("payload.data.newsletter_id")) return "newsletter_not_found";
  if (has("payload.data.preference_identifiers")) return "preferences_not_found";
  // An email error names no field: the email is the account's.
  if (details.some((d) => !d.field)) return "invalid_email";
  return null;
}

/** V2 subscribes to one newsletter per call, so the newsletters are subscribed to side by side and their errors gathered. */
async function createOwnSubscriptions(internalNames: string[], showSuccessMessage: boolean): Promise<boolean> {
  if (Object.keys(buildAdditionalFieldsPayload(newsletterStore.state.additionalFields)).length > 0) {
    logger.warn("Additional fields are not sent for a signed-in user; their profile holds them");
  }

  const me = getUnidyClient().newsletters.me;
  const redirectToAfterConfirmation = redirectToAfterConfirmationUrl();
  const results = await Promise.all(
    internalNames.map(async (slug) => {
      const [error, data] = await me.create({ slug, preferenceIdentifiers: requestedPreferences(slug), redirectToAfterConfirmation });
      return { slug, error, data };
    }),
  );

  if (results.some(({ error }) => error !== null && isSignedOutError(error))) {
    handleSignedOut();
    return false;
  }

  const created: ExistingSubscription[] = [];
  const errorMap: Record<string, NewsletterErrorIdentifier> = {};
  let unexpectedError = false;

  for (const { slug, error, data } of results) {
    if (error === null) {
      created.push(toExistingSubscription(data as MeNewsletterSubscription));
      continue;
    }

    const reason = subscribeErrorFor(error, data);
    if (reason === "invalid_email") {
      errorMap.email = reason;
    } else if (reason) {
      errorMap[slug] = reason;
      if (reason === "newsletter_not_found") errorMap.general = reason;
    } else {
      logger.error(`Failed to subscribe to newsletter '${slug}'`, error, data);
      unexpectedError = true;
    }
  }

  if (Object.values(errorMap).includes("already_subscribed")) {
    // Load the existing subscriptions as they are rather than guessing their state.
    await fetchOwnSubscriptions();
  } else if (created.length > 0) {
    newsletterStore.state.existingSubscriptions = [...newsletterStore.state.existingSubscriptions, ...created];
  }

  if (created.length === results.length) {
    if (showSuccessMessage) {
      Flash.success.addMessage(t("newsletter.success.subscribe"));
    }
    return true;
  }

  newsletterStore.state.errors = errorMap;
  if (unexpectedError) {
    Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  }
  return false;
}

async function handleCreateSubscriptionRequest(email: string, internalNames: string[], showSuccessMessage = true): Promise<boolean> {
  if (managesOwnSubscriptions()) {
    return createOwnSubscriptions(internalNames, showSuccessMessage);
  }

  const { additionalFields } = newsletterStore.state;

  const additionalFieldsPayload = buildAdditionalFieldsPayload(additionalFields);

  // Execute captcha if enabled for newsletter
  let captchaToken: string | undefined;
  try {
    const captchaResult = await captchaManager.execute("newsletter");
    captchaToken = captchaResult?.token;
  } catch (captchaError) {
    logger.error("Captcha execution failed:", captchaError);
    Flash.error.addMessage(t("errors.captcha_execution_failed"));
    return false;
  }

  const [error, response] = await getUnidyClient().newsletters.create({
    payload: {
      email,
      newsletter_subscriptions: internalNames.map((newsletter) => ({
        newsletter_internal_name: newsletter,
        preference_identifiers: requestedPreferences(newsletter),
      })),
      redirect_to_after_confirmation: redirectToAfterConfirmationUrl(),
      ...(Object.keys(additionalFieldsPayload).length > 0 && { additional_fields: additionalFieldsPayload }),
      ...(captchaToken && { captcha_token: captchaToken }),
    },
  });

  if (error === null && response && "results" in response) {
    if (response.results.length > 0) {
      const newSubscriptions: ExistingSubscription[] = response.results.map((result) => ({
        newsletter_internal_name: result.newsletter_internal_name,
        confirmed: result.confirmed_at !== null,
        preference_identifiers: result.preference_identifiers || [],
      }));

      newsletterStore.state.existingSubscriptions = [...newsletterStore.state.existingSubscriptions, ...newSubscriptions];
    }

    if (showSuccessMessage) {
      Flash.success.addMessage(t("newsletter.success.subscribe"));
    }

    return true;
  }

  if (error && isCaptchaError(error)) {
    captchaManager.reset();
    Flash.error.addMessage(t(`errors.${error}`));
    return false;
  }

  if (error === "unauthorized") {
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    newsletterLogout();
    return false;
  }

  if (error === "newsletter_error" && response) {
    const errors = response.errors || [];
    const errorMap: Record<string, NewsletterErrorIdentifier> = {};
    const additionalFieldErrors: Record<string, string> = {};

    // For authenticated users (or those with a preference token), add already-subscribed newsletters
    // to existingSubscriptions. Anonymous users see the per-newsletter "already_subscribed" error and
    // can click the "Already subscribed? Click here..." link to request a login email.
    const hasAlreadySubscribedError = errors.some((err) => err.error_identifier === "already_subscribed");
    if (hasAlreadySubscribedError) {
      handleAlreadySubscribedError(errors);
    }

    const newsletterNotFoundError = errors.some((err) => err.error_identifier === "newsletter_not_found");
    if (newsletterNotFoundError) {
      errorMap.general = "newsletter_not_found";
    }

    const hasInvalidEmailError = errors.some(
      (err) => err.error_identifier === "validation_error" && err.error_details && "email" in err.error_details,
    );

    const userValidationErrors = errors.filter((err) => err.error_identifier === "user_validation_error" && err.error_details);
    for (const err of userValidationErrors) {
      for (const [field, messages] of Object.entries(err.error_details || {})) {
        if (Array.isArray(messages) && messages.length > 0) {
          additionalFieldErrors[field] = messages[0];
        }
      }
    }

    if (hasInvalidEmailError) {
      errorMap.email = "invalid_email";
    } else {
      for (const err of errors) {
        // Skip user_validation_error - handled via additionalFieldErrors
        if (err.error_identifier === "user_validation_error") continue;
        errorMap[err.meta.newsletter_internal_name] = err.error_identifier as NewsletterErrorIdentifier;
      }
    }

    newsletterStore.state.errors = errorMap;
    newsletterStore.state.additionalFieldErrors = additionalFieldErrors;
  } else {
    Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  }

  return false;
}

export async function subscribeToNewsletter(internalName: string, email: string): Promise<boolean> {
  return handleCreateSubscriptionRequest(email, [internalName], false);
}

export async function createSubscriptions({ email }: { email: string }): Promise<boolean> {
  const internalNames = Object.keys(newsletterStore.state.checkedNewsletters);
  return handleCreateSubscriptionRequest(email, internalNames, true);
}

export async function deleteSubscription(internalName: string): Promise<boolean> {
  if (managesOwnSubscriptions()) {
    return deleteOwnSubscription(internalName);
  }

  const { preferenceToken } = newsletterStore.state;

  // either preference token is needed or the user must be authenticated to delete a subscription
  if (!preferenceToken && !newsletterStore.state.isAuthenticated) {
    logger.error("Preference token or authentication is required to delete a subscription");
    return false;
  }

  const [error, data] = await getUnidyClient().newsletters.delete({
    internalName,
    options: preferenceToken ? { preferenceToken } : undefined,
  });

  if (error === null) {
    if (data && "new_preference_token" in data) {
      // if user is not authenticated, we need to store the new preference token which is used for the next request
      if (!newsletterStore.state.isAuthenticated) {
        newsletterStore.state.preferenceToken = data.new_preference_token;
        persist("preferenceToken");
      }
    }

    removeSubscription(internalName);
    return true;
  }

  if (error === "unauthorized") {
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    newsletterLogout();
    return false;
  }

  if (error === "not_found") {
    return false;
  }

  // 422 Unprocessable Entity - silently fail (e.g., trying to delete something that can't be deleted)
  if (error === "unprocessable_entity") {
    return false;
  }

  Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  return false;
}

async function deleteOwnSubscription(internalName: string): Promise<boolean> {
  const [error] = await getUnidyClient().newsletters.me.delete({ slug: internalName });

  if (error === null) {
    removeSubscription(internalName);
    return true;
  }

  if (isSignedOutError(error)) {
    handleSignedOut();
  } else if (error !== "not_found") {
    Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  }
  return false;
}

function removeSubscription(internalName: string): void {
  newsletterStore.state.existingSubscriptions = newsletterStore.state.existingSubscriptions.filter(
    (sub) => sub.newsletter_internal_name !== internalName,
  );

  // Reset checked preferences to defaults (preferences marked with checked='true')
  const defaultPrefs = newsletterStore.state.defaultPreferences[internalName];
  newsletterStore.state.checkedNewsletters = {
    ...newsletterStore.state.checkedNewsletters,
    [internalName]: defaultPrefs ? [...defaultPrefs] : [],
  };
}

export function getSubscription(internalName: string): ExistingSubscription | undefined {
  return newsletterStore.state.existingSubscriptions.find((sub) => sub.newsletter_internal_name === internalName);
}

export function isSubscribed(internalName: string): boolean {
  return newsletterStore.state.existingSubscriptions.some((sub) => sub.newsletter_internal_name === internalName);
}

export function isConfirmed(internalName: string): boolean {
  const sub = getSubscription(internalName);
  return sub?.confirmed ?? false;
}

function redirectToAfterConfirmationUrl(): string {
  const baseUrl = `${location.origin}${location.pathname}`;
  const params = new URLSearchParams(location.search);
  for (const key of ["email", "newsletter_error"]) {
    params.delete(key);
  }
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function getSubscriptionPreferences(internalName: string): string[] {
  const subscription = getSubscription(internalName);
  return subscription?.preference_identifiers || [];
}

export async function updateSubscriptionPreferences(internalName: string): Promise<boolean> {
  const { preferenceToken } = newsletterStore.state;

  // Either preference token is needed or the user must be authenticated
  if (!preferenceToken && !newsletterStore.state.isAuthenticated) {
    logger.error("Preference token or authentication is required to update subscription preferences");
    return false;
  }

  // Check if the subscription exists
  if (!isSubscribed(internalName)) {
    logger.error(`Cannot update preferences: not subscribed to newsletter '${internalName}'`);
    return false;
  }

  const preferenceIdentifiers = newsletterStore.state.checkedNewsletters[internalName] || [];

  const newsletters = getUnidyClient().newsletters;
  const [error, data] = managesOwnSubscriptions()
    ? await newsletters.me.update({ slug: internalName, preferenceIdentifiers })
    : await newsletters.update({
        internalName,
        payload: { preference_identifiers: preferenceIdentifiers },
        options: preferenceToken ? { preferenceToken } : undefined,
      });

  if (isSignedOutError(error)) {
    handleSignedOut();
    return false;
  }

  if (error === null && data && "preference_identifiers" in data) {
    // Update the local subscription with the new preferences
    const subscriptionIndex = newsletterStore.state.existingSubscriptions.findIndex((sub) => sub.newsletter_internal_name === internalName);

    if (subscriptionIndex !== -1) {
      const updatedSubscriptions = [...newsletterStore.state.existingSubscriptions];
      updatedSubscriptions[subscriptionIndex] = {
        ...updatedSubscriptions[subscriptionIndex],
        preference_identifiers: data.preference_identifiers || [],
      };
      newsletterStore.state.existingSubscriptions = updatedSubscriptions;
    }

    Flash.success.addMessage(t("newsletter.success.preferences_updated"));
    return true;
  }

  Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  return false;
}
