import { Component, Host, h, Method, Prop, State } from "@stencil/core";
import { UnidyComponent } from "../../../shared/base/component";
import { Registration } from "../../registration";
import { onChange, registrationState, registrationStore } from "../../store/registration-store";
import { getParentRegistrationRoot } from "../helpers";

@Component({
  tag: "u-registration-step",
  shadow: false,
})
export class RegistrationStep extends UnidyComponent() {
  /** The step identifier. Must match an entry in the parent `<u-registration-root>`'s `steps` array. */
  @Prop() name!: string;

  /** If true, the step's content is always rendered regardless of which step is active. */
  @Prop({ attribute: "always-render" }) alwaysRender = false;

  /** If true, this step is automatically skipped when the user's email is already verified. */
  @Prop({ attribute: "requires-email-verification" }) requiresEmailVerification = false;

  /** If true, this step is automatically skipped for social login or passwordless flows. */
  @Prop({ attribute: "requires-password" }) requiresPassword = false;

  @State() private renderTrigger = 0;

  private registrationInstance: Registration | null = null;
  private unsubscribers: (() => void)[] = [];

  async componentWillLoad() {
    try {
      this.registrationInstance = await Registration.getInstance();
    } catch {
      // Config not ready yet — will be retried on submit
    }
  }

  connectedCallback() {
    const triggerRender = () => {
      this.renderTrigger++;
    };
    this.unsubscribers.push(onChange("currentStepName", triggerRender));
    this.element.addEventListener("keydown", this.handleKeyDown);
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.element.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      // Force the input's change event so the store is updated before submit
      e.target.dispatchEvent(new Event("change", { bubbles: true }));
      this.submit();
    }
  };

  /** Returns whether this step is currently the active step in the registration flow. */
  @Method()
  async isActive(): Promise<boolean> {
    return registrationState.currentStepName === this.name || this.alwaysRender;
  }

  /** Returns whether this step should be skipped based on the current flow state (e.g. email already verified, passwordless flow). */
  @Method()
  async shouldSkip(): Promise<boolean> {
    if (this.requiresEmailVerification && registrationState.emailVerified) {
      return true;
    }

    if (this.requiresPassword) {
      if (registrationState.passwordlessFlag || registrationState.socialProvider) {
        return true;
      }
    }

    return false;
  }

  /** Submits the current step. Creates or updates the registration flow, then advances to the next step or finalizes registration. */
  @Method()
  async submit(): Promise<void> {
    if (registrationState.loading || registrationState.submitting) {
      return;
    }

    // Abort if client-side validation errors exist (e.g. password confirmation mismatch, pattern errors)
    const hasErrors = Object.values(registrationState.errors).some((err) => err != null);
    if (hasErrors) {
      return;
    }

    const root = getParentRegistrationRoot(this.element);
    if (!root) {
      console.error("[u-registration-step] No parent u-registration-root found");
      return;
    }

    const registrationUrl = await root.getRegistrationUrl();
    const brandId = await root.getBrandId();

    // Retry initialization if it failed during componentWillLoad (e.g. config timeout on hard reload)
    if (!this.registrationInstance) {
      this.registrationInstance = await Registration.getInstance();
    }

    const helpers = this.registrationInstance?.helpers;

    if (!helpers) {
      console.error("[u-registration-step] Registration helpers not available");
      return;
    }

    const isFirstStep = registrationState.currentStepIndex === 0;
    const isLastStep = registrationState.currentStepIndex === registrationState.steps.length - 1;
    const isSingleStep = registrationState.steps.length === 1;

    let success = false;

    if (isFirstStep && !registrationState.rid) {
      success = await helpers.createRegistration(registrationUrl, brandId);
    } else {
      success = await helpers.updateRegistration();
    }

    if (!success) {
      return;
    }

    if (isLastStep || isSingleStep) {
      const finalizeSuccess = await helpers.finalizeRegistration();

      if (finalizeSuccess && registrationState.flowResponse) {
        registrationStore.getRootComponentRef()?.onComplete(registrationState.flowResponse);
      }
    } else {
      await this.advanceToNextStepWithSkipLogic(root);
    }
  }

  private async advanceToNextStepWithSkipLogic(root: HTMLURegistrationRootElement): Promise<void> {
    const steps = registrationState.steps;
    let nextIndex = registrationState.currentStepIndex + 1;

    while (nextIndex < steps.length) {
      const nextStepName = steps[nextIndex];
      const nextStepEl = root.querySelector(`u-registration-step[name="${nextStepName}"]`) as HTMLURegistrationStepElement | null;

      if (nextStepEl) {
        const shouldSkip = await nextStepEl.shouldSkip();
        if (!shouldSkip) {
          break;
        }
      } else {
        break;
      }

      nextIndex++;
    }

    if (nextIndex >= steps.length) {
      const finalizeSuccess = await this.registrationInstance?.helpers.finalizeRegistration();
      if (finalizeSuccess && registrationState.flowResponse) {
        registrationStore.getRootComponentRef()?.onComplete(registrationState.flowResponse);
      }
      return;
    }

    registrationStore.setCurrentStepIndex(nextIndex);
    registrationStore.getRootComponentRef()?.onStepChange(registrationState.currentStepName, registrationState.currentStepIndex);
  }

  render() {
    void this.renderTrigger;
    const isActive = registrationState.currentStepName === this.name;

    return (
      <Host hidden={!isActive && !this.alwaysRender}>
        <slot />
      </Host>
    );
  }
}
