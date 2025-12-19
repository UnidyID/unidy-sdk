import { getUnidyClient } from "../api";
import { Flash } from "../shared/store/flash-store";
import { t } from "../i18n";
import { newsletterStore, persist, type NewsletterErrorIdentifier, type ExistingSubscription } from "./store/newsletter-store";
import { Auth } from "../auth/auth";

const PERSIST_KEY_PREFIX = "unidy_newsletter_";

export function newsletterLogout(): void {
  newsletterStore.state.preferenceToken = "";
  newsletterStore.state.existingSubscriptions = [];
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
}

export async function resendDoi(internalName: string): Promise<boolean> {
  const { preferenceToken } = newsletterStore.state;

  const authInstance = await Auth.getInstance();
  const idToken = await authInstance.getToken();

  const response = await getUnidyClient().newsletters.resendDoi(internalName, {
    preferenceToken: typeof preferenceToken === "string" ? preferenceToken : "",
    idToken: typeof idToken === "string" ? idToken : "",
  });

  if (response.status === 204) {
    return true;
  }

  if (response.status === 401) {
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    newsletterLogout();
    return false;
  }

  return false;
}

export async function sendLoginEmail(email: string): Promise<void> {
  const response = await getUnidyClient().newsletters.sendLoginEmail({
    email,
    redirect_uri: returnToAfterConfirmationUrl(),
  });

  if (response.status === 204) {
    Flash.info.addMessage(t("newsletter.success.login_email_sent"));
  } else {
    Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  }
}

export async function fetchSubscriptions(): Promise<void> {
  const { preferenceToken } = newsletterStore.state;

  // either preference token is needed or the user must be authenticated
  if (!preferenceToken && !newsletterStore.state.isAuthenticated) {
    // TODO: call logger
    return;
  }

  const authInstance = await Auth.getInstance();
  const idToken = await authInstance.getToken();

  newsletterStore.state.fetchingSubscriptions = true;

  const response = await getUnidyClient().newsletters.listSubscriptions({
    preferenceToken,
    idToken: typeof idToken === "string" ? idToken : "",
  });

  newsletterStore.state.fetchingSubscriptions = false;

  if (response.status === 401) {
    newsletterLogout();
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    return;
  }

  if (response.success && response.data) {
    newsletterStore.state.existingSubscriptions = response.data.map(
      (sub): ExistingSubscription => ({
        newsletter_internal_name: sub.newsletter_internal_name,
        confirmed: sub.confirmed_at !== null,
      }),
    );
  }
}

async function handleAlreadySubscribedError(
  email: string,
  errors: Array<{ error_identifier: string; meta: { newsletter_internal_name: string } }>,
): Promise<void> {
  if (newsletterStore.state.isAuthenticated || newsletterStore.state.preferenceToken) {
    const existingNames = new Set(newsletterStore.state.existingSubscriptions.map((s) => s.newsletter_internal_name));

    const newSubscriptions: ExistingSubscription[] = errors
      .filter((err) => err.error_identifier === "already_subscribed" && !existingNames.has(err.meta.newsletter_internal_name))
      .map((err) => ({
        newsletter_internal_name: err.meta.newsletter_internal_name,
        confirmed: null,
      }));

    if (newSubscriptions.length > 0) {
      newsletterStore.state.existingSubscriptions = [...newsletterStore.state.existingSubscriptions, ...newSubscriptions];
    }
  } else {
    await sendLoginEmail(email);
  }
}

async function handleCreateSubscriptionRequest(email: string, internalNames: string[], showSuccessMessage = true): Promise<boolean> {
  const authInstance = await Auth.getInstance();
  const idToken = await authInstance.getToken();

  const [error, response] = await getUnidyClient().newsletters.createSubscriptions(
    {
      email,
      newsletter_subscriptions: internalNames.map((newsletter) => ({
        newsletter_internal_name: newsletter,
        preference_identifiers: [],
      })),
      return_to_after_confirmation: returnToAfterConfirmationUrl(),
    },
    {
      idToken: typeof idToken === "string" ? idToken : "",
    },
  );

  if (error === null) {
    if (response.data?.results && response.data.results.length > 0) {
      const newSubscriptions: ExistingSubscription[] = response.data.results.map((result) => ({
        newsletter_internal_name: result.newsletter_internal_name,
        confirmed: result.confirmed_at !== null,
      }));

      newsletterStore.state.existingSubscriptions = [...newsletterStore.state.existingSubscriptions, ...newSubscriptions];
    }

    if (showSuccessMessage) {
      Flash.success.addMessage(t("newsletter.success.subscribe"));
    }

    return true;
  }

  if (error === "unauthorized") {
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    newsletterLogout();
    return false;
  }

  if (error === "newsletter_error") {
    const errors = response.data?.errors || [];
    const errorMap: Record<string, NewsletterErrorIdentifier> = {};

    // special error case which is handled differently: if user is not authenticated, we send a login email, otherwise we add the
    // already_subscribed subscriptions to the existing subscriptions
    const hasAlreadySubscribedError = errors.some((err) => err.error_identifier === "already_subscribed");
    if (hasAlreadySubscribedError) {
      await handleAlreadySubscribedError(email, errors);
    }

    const newsletterNotFoundError = errors.some((err) => err.error_identifier === "newsletter_not_found");
    if (newsletterNotFoundError) {
      errorMap.general = "newsletter_not_found";
    }

    const hasInvalidEmailError = errors.some(
      (err) => err.error_identifier === "validation_error" && err.error_details && "email" in err.error_details,
    );

    if (hasInvalidEmailError) {
      errorMap.email = "invalid_email";
    } else {
      for (const err of errors) {
        errorMap[err.meta.newsletter_internal_name] = err.error_identifier as NewsletterErrorIdentifier;
      }
    }

    newsletterStore.state.errors = errorMap;
  } else {
    Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  }

  return false;
}

export async function subscribeToNewsletter(internalName: string, email: string): Promise<boolean> {
  return handleCreateSubscriptionRequest(email, [internalName], false);
}

export async function createSubscriptions({ email, checkedNewsletters }: { email: string; checkedNewsletters: string[] }): Promise<void> {
  await handleCreateSubscriptionRequest(email, checkedNewsletters, true);
}

export async function deleteSubscription(internalName: string): Promise<boolean> {
  const { preferenceToken } = newsletterStore.state;

  // either preference token is needed or the user must be authenticated to delete a subscription
  if (!preferenceToken && !newsletterStore.state.isAuthenticated) {
    // TODO: call logger
    return false;
  }

  const authInstance = await Auth.getInstance();
  const idToken = await authInstance.getToken();

  const response = await getUnidyClient().newsletters.deleteSubscription(internalName, {
    preferenceToken,
    idToken: typeof idToken === "string" ? idToken : "",
  });

  if (response.status === 200 && response.data?.new_preference_token) {
    // if user is not authenticated, we need to store the new preference token which is used for the next request
    if (!newsletterStore.state.isAuthenticated) {
      newsletterStore.state.preferenceToken = response.data.new_preference_token;
      persist("preferenceToken");
    }

    newsletterStore.state.existingSubscriptions = newsletterStore.state.existingSubscriptions.filter(
      (sub) => sub.newsletter_internal_name !== internalName,
    );
    return true;
  }

  if (response.status === 204) {
    newsletterLogout();

    newsletterStore.state.checkedNewsletters = [];
    return true;
  }

  if (response.status === 401) {
    Flash.error.addMessage(t("newsletter.errors.unauthorized"));
    newsletterLogout();
    return false;
  }

  if (response.status === 422) {
    return false;
  }

  Flash.error.addMessage(t("errors.unknown", { defaultValue: "An unknown error occurred" }));
  return false;
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

function returnToAfterConfirmationUrl(): string {
  const baseUrl = `${location.origin}${location.pathname}`;
  const params = new URLSearchParams(location.search);
  for (const key of ["email", "selected", "newsletter_error"]) {
    params.delete(key);
  }
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
