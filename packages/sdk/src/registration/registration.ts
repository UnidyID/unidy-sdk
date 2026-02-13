import type { UnidyClient } from "../api";
import { registrationStore, registrationState } from "./store/registration-store";
import { RegistrationHelpers } from "./registration-helpers";
import { waitForConfig } from "../shared/store/unidy-store";
import { getUnidyClient } from "../auth/api-client";

export class Registration {
  private static instance: Registration;

  readonly helpers: RegistrationHelpers;

  private constructor(client: UnidyClient) {
    this.helpers = new RegistrationHelpers(client);
  }

  static Errors = {
    email: {
      ALREADY_REGISTERED: "email_already_registered",
      REQUIRED: "email_required",
    },
    registration: {
      NOT_FOUND: "registration_not_found",
      EXPIRED: "registration_expired",
      FLOW_ALREADY_EXISTS: "registration_flow_already_exists",
      CANNOT_FINALIZE: "cannot_finalize",
      AUTH_METHOD_REQUIRED: "auth_method_required",
    },
    verification: {
      CODE_RECENTLY_SENT: "verification_code_recently_sent",
      INVALID_CODE: "invalid_code",
      CODE_EXPIRED: "code_expired",
    },
  } as const;

  static async getInstance(): Promise<Registration> {
    if (!Registration.isInitialized()) {
      await waitForConfig();

      return Registration.initialize(getUnidyClient());
    }

    return Registration.instance;
  }

  static initialize(client: UnidyClient): Registration {
    Registration.instance = new Registration(client);

    // Handle social auth redirect if present
    Registration.instance.helpers.handleSocialAuthRedirect();

    return Registration.instance;
  }

  static isInitialized(): boolean {
    return !!Registration.instance;
  }

  /**
   * Check if a registration flow is in progress.
   */
  isFlowInProgress(): boolean {
    return !!registrationState.rid;
  }

  /**
   * Get the current step name.
   */
  getCurrentStep(): string {
    return registrationState.currentStepName;
  }

  /**
   * Get the current step index.
   */
  getCurrentStepIndex(): number {
    return registrationState.currentStepIndex;
  }

  /**
   * Check if the email is verified.
   */
  isEmailVerified(): boolean {
    return registrationState.emailVerified;
  }

  /**
   * Check if the registration can be finalized.
   */
  canFinalize(): boolean {
    return registrationState.canFinalize;
  }

  /**
   * Reset the registration flow.
   */
  reset(): void {
    registrationStore.reset();
  }
}
