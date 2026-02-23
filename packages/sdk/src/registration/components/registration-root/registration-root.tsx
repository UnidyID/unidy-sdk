import { Component, Event, type EventEmitter, h, Method, Prop } from "@stencil/core";
import type { RegistrationFlowResponse } from "../../../auth/api/register";
import { onChange as authOnChange, authState, authStore } from "../../../auth/store/auth-store";
import { UnidyComponent } from "../../../shared/base/component";
import { Registration } from "../../registration";
import { registrationState, registrationStore } from "../../store/registration-store";

@Component({
  tag: "u-registration-root",
  shadow: false,
})
export class RegistrationRoot extends UnidyComponent() {
  /** URL of the registration page. Used as the redirect target in resume emails. Defaults to the current page URL (origin + pathname) if not set. */
  @Prop({ attribute: "registration-url" }) registrationUrl?: string;

  /** Brand ID to associate with the registration flow. Only needed in multi-brand setups. */
  @Prop({ attribute: "brand-id" }) brandId?: number;

  /** JSON array string of step names that define the registration flow order. Each name must match a `<u-registration-step name="...">` child. */
  @Prop() steps = "[]";

  /** Whether to automatically resume an existing registration flow on load. Checks for `registration_rid` in the URL (from resume emails) or a stored rid in localStorage. */
  @Prop({ attribute: "auto-resume" }) autoResume = true;

  /** Fired when the registration flow is finalized and the user account is created. */
  @Event() registrationComplete!: EventEmitter<RegistrationFlowResponse>;

  /** Fired when the active step changes. */
  @Event() stepChange!: EventEmitter<{ stepName: string; stepIndex: number }>;

  /** Fired when an error occurs during the registration flow. */
  @Event() errorEvent!: EventEmitter<{ error: string }>;

  private registrationInstance: Registration | null = null;
  private unsubscribeAuthEmail?: () => void;

  async componentWillLoad() {
    try {
      this.registrationInstance = await Registration.getInstance();
    } catch {
      // Config not ready yet (e.g. hard reload) — will be retried on first interaction
    }
    registrationStore.setRootComponentRef(this);

    // Parse and set steps
    try {
      const stepsArray = JSON.parse(this.steps);
      if (Array.isArray(stepsArray) && stepsArray.length > 0) {
        registrationStore.setSteps(stepsArray);
      }
    } catch (e) {
      console.error("[u-registration-root] Invalid steps prop. Expected JSON array string.", e);
    }

    // Pre-populate email from auth state when embedded in the signin flow
    if (!registrationState.email && authState.email) {
      registrationStore.setEmail(authState.email);
    }

    // Reactively sync email from auth state (e.g. when user enters email in signin, then gets redirected to registration)
    this.unsubscribeAuthEmail = authOnChange("email", (email) => {
      if (email && !registrationState.email) {
        registrationStore.setEmail(email);
      }
    });

    // Auto-resume if enabled and rid is present.
    // Not awaited — the API call must not block the initial render, otherwise the
    // registration-root slot stays empty while the request is in flight and the user
    // can navigate to the registration step before the children are visible.
    if (this.autoResume) {
      this.tryAutoResume();
    }
  }

  disconnectedCallback() {
    this.unsubscribeAuthEmail?.();
  }

  private async tryAutoResume() {
    // Ensure the Registration singleton is available (may have failed during componentWillLoad)
    if (!this.registrationInstance) {
      try {
        this.registrationInstance = await Registration.getInstance();
      } catch {
        return;
      }
    }

    // Check for resume rid in URL (present when Registration singleton hasn't cleaned it yet)
    const url = new URL(window.location.href);
    const resumeRid = url.searchParams.get("registration_rid");

    if (resumeRid) {
      const success = await this.registrationInstance.helpers.getRegistration(resumeRid);
      if (success) {
        // Clean the URL
        url.searchParams.delete("registration_rid");
        const cleanUrl = `${url.origin}${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
        window.history.replaceState(null, "", cleanUrl);
        this.switchToRegistrationStep();
        this.advancePastCompletedSteps();
      }
      return;
    }

    // Try to resume from stored rid (set by handleSocialAuthRedirect or localStorage)
    if (registrationState.rid) {
      const success = await this.registrationInstance.helpers.getRegistration();
      if (success) {
        this.switchToRegistrationStep();
        this.advancePastCompletedSteps();
      }
    }
  }

  /**
   * Navigate the parent signin flow to the "registration" step.
   * This runs during componentWillLoad (before signin-root's componentDidLoad sets the initial step),
   * so authState.step may still be undefined. We bootstrap it to the initial step first so that
   * setStep("registration") correctly records the previous step in the history for back navigation.
   */
  private switchToRegistrationStep() {
    if (authStore.state.step === undefined) {
      authStore.setStep(authStore.state.initialStep, false);
    }
    authStore.setStep("registration");
  }

  private advancePastCompletedSteps() {
    // The first step (email/flow creation) was already completed — skip past it
    // and any other steps that should be skipped.
    // We read HTML attributes directly instead of calling child @Method()s
    // to avoid a deadlock during componentWillLoad (children aren't initialized yet).
    const steps = registrationState.steps;
    let nextIndex = 1;

    while (nextIndex < steps.length) {
      const stepEl = this.element.querySelector(`u-registration-step[name="${steps[nextIndex]}"]`);

      if (!stepEl || !this.shouldSkipStepByAttributes(stepEl)) {
        break;
      }

      nextIndex++;
    }

    if (nextIndex < steps.length) {
      registrationStore.setCurrentStepIndex(nextIndex);
    }
  }

  private shouldSkipStepByAttributes(stepEl: Element): boolean {
    if (stepEl.hasAttribute("requires-email-verification") && registrationState.emailVerified) {
      return true;
    }

    if (stepEl.hasAttribute("requires-password")) {
      if (registrationState.passwordlessFlag || registrationState.socialProvider) {
        return true;
      }
    }

    return false;
  }

  onComplete(response: RegistrationFlowResponse) {
    this.registrationComplete.emit(response);
  }

  onStepChange(stepName: string, stepIndex: number) {
    this.stepChange.emit({ stepName, stepIndex });
  }

  onError(error: string) {
    this.errorEvent.emit({ error });
  }

  /** Returns the registration URL. Falls back to the current page URL if not explicitly set. */
  @Method()
  async getRegistrationUrl(): Promise<string> {
    return this.registrationUrl || `${window.location.origin}${window.location.pathname}`;
  }

  /** Returns the configured brand ID, if any. */
  @Method()
  async getBrandId(): Promise<number | undefined> {
    return this.brandId;
  }

  /** Programmatically advance to the next step in the registration flow. */
  @Method()
  async advanceToNextStep(): Promise<void> {
    const steps = registrationState.steps;
    let nextIndex = registrationState.currentStepIndex + 1;

    while (nextIndex < steps.length) {
      const stepEl = this.element.querySelector(`u-registration-step[name="${steps[nextIndex]}"]`) as HTMLURegistrationStepElement | null;
      if (!stepEl) break;
      const shouldSkip = await stepEl.shouldSkip();
      if (!shouldSkip) break;
      nextIndex++;
    }

    if (nextIndex < steps.length) {
      registrationStore.setCurrentStepIndex(nextIndex);
      this.onStepChange(registrationState.currentStepName, registrationState.currentStepIndex);
    }
  }

  /** Programmatically go back to the previous step in the registration flow. */
  @Method()
  async goToPreviousStep(): Promise<void> {
    if (registrationState.currentStepIndex > 0) {
      registrationStore.goToPreviousStep();
      this.onStepChange(registrationState.currentStepName, registrationState.currentStepIndex);
    }
  }

  /** Returns whether the registration flow has been completed. */
  @Method()
  async isComplete(): Promise<boolean> {
    return registrationState.flowResponse?.status?.completed === true;
  }

  render() {
    return <slot />;
  }
}
