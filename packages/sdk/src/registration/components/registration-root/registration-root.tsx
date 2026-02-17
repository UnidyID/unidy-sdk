import { Component, Event, type EventEmitter, h, Method, Prop } from "@stencil/core";
import type { RegistrationFlowResponse } from "../../../auth/api/register";
import { Registration } from "../../registration";
import { registrationState, registrationStore } from "../../store/registration-store";

@Component({
  tag: "u-registration-root",
  shadow: false,
})
export class RegistrationRoot {
  @Prop({ attribute: "registration-url" }) registrationUrl!: string;
  @Prop({ attribute: "brand-id" }) brandId?: number;
  @Prop() steps = "[]";
  @Prop({ attribute: "auto-resume" }) autoResume = true;

  @Event() registrationComplete!: EventEmitter<RegistrationFlowResponse>;
  @Event() stepChange!: EventEmitter<{ stepName: string; stepIndex: number }>;
  @Event() errorEvent!: EventEmitter<{ error: string }>;

  private registrationInstance: Registration | null = null;

  async componentWillLoad() {
    this.registrationInstance = await Registration.getInstance();
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

    // Auto-resume if enabled and rid is present
    if (this.autoResume) {
      await this.tryAutoResume();
    }
  }

  private async tryAutoResume() {
    // Check for resume rid in URL
    const url = new URL(window.location.href);
    const resumeRid = url.searchParams.get("registration_rid");

    if (resumeRid) {
      const success = await this.registrationInstance?.helpers.getRegistration(resumeRid);
      if (success) {
        // Clean the URL
        url.searchParams.delete("registration_rid");
        const cleanUrl = `${url.origin}${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
        window.history.replaceState(null, "", cleanUrl);
      }
      return;
    }

    // Try to resume from stored rid
    if (registrationState.rid) {
      await this.registrationInstance?.helpers.getRegistration();
    }
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

  @Method()
  async getRegistrationUrl(): Promise<string> {
    return this.registrationUrl;
  }

  @Method()
  async getBrandId(): Promise<number | undefined> {
    return this.brandId;
  }

  @Method()
  async advanceToNextStep(): Promise<void> {
    const steps = registrationState.steps;
    let nextIndex = registrationState.currentStepIndex + 1;

    while (nextIndex < steps.length) {
      // TODO: Add skipping logic
      nextIndex++;
    }

    if (nextIndex < steps.length) {
      registrationStore.setCurrentStepIndex(nextIndex);
      this.onStepChange(registrationState.currentStepName, registrationState.currentStepIndex);
    }
  }

  @Method()
  async goToPreviousStep(): Promise<void> {
    if (registrationState.currentStepIndex > 0) {
      registrationStore.goToPreviousStep();
      this.onStepChange(registrationState.currentStepName, registrationState.currentStepIndex);
    }
  }

  @Method()
  async isComplete(): Promise<boolean> {
    return registrationState.flowResponse?.status === "completed";
  }

  render() {
    return <slot />;
  }
}
