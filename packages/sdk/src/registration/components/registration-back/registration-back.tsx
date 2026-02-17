import { Component, Element, h, Prop } from "@stencil/core";
import { registrationState } from "../../store/registration-store";
import { getParentRegistrationRoot } from "../helpers";

@Component({
  tag: "u-registration-back",
  styleUrl: "registration-back.css",
  shadow: false,
})
export class RegistrationBack {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName?: string;

  private handleClick = async () => {
    if (registrationState.loading || registrationState.submitting) return;

    const root = getParentRegistrationRoot(this.el);
    if (root) {
      await root.goToPreviousStep();
    }
  };

  private isDisabled(): boolean {
    return registrationState.currentStepIndex === 0 || registrationState.loading || registrationState.submitting;
  }

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={this.handleClick} disabled={this.isDisabled()}>
        <slot />
      </button>
    );
  }
}
