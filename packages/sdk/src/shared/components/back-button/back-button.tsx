import { Component, h, Prop } from "@stencil/core";
import { Auth } from "../../../auth/auth";
import { t } from "../../../i18n";
import { getParentRegistrationRoot } from "../../../registration/components/helpers";
import { registrationState } from "../../../registration/store/registration-store";
import { UnidyComponent } from "../../base/component";
import { HasSlotContent } from "../../base/has-slot-content";

@Component({
  tag: "u-back-button",
  shadow: false,
})
export class BackButton extends UnidyComponent(HasSlotContent) {
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /**
   * If true, restarts the entire auth flow instead of going back one step.
   * Only applies when used outside a registration flow.
   */
  @Prop() restart = false;

  private handleClick = async () => {
    // Registration context: navigate within registration steps
    const registrationRoot = getParentRegistrationRoot(this.element);
    if (registrationRoot) {
      if (registrationState.loading || registrationState.submitting) return;
      await registrationRoot.goToPreviousStep();
      return;
    }

    // Auth context: navigate auth flow steps
    const authInstance = await Auth.getInstance();
    if (this.restart) {
      authInstance.restart();
    } else {
      authInstance.goBack();
    }
  };

  private isDisabled(): boolean {
    const registrationRoot = getParentRegistrationRoot(this.element);
    if (registrationRoot) {
      return registrationState.currentStepIndex === 0 || registrationState.loading || registrationState.submitting;
    }
    return false;
  }

  private getButtonText() {
    if (this.restart) {
      return t("auth.navigation.restart", { defaultValue: "Start over" });
    }
    return t("auth.navigation.back", { defaultValue: "Back" });
  }

  render() {
    return (
      <button type="button" onClick={this.handleClick} class={this.componentClassName} disabled={this.isDisabled()}>
        {this.hasSlot ? <slot /> : this.getButtonText()}
      </button>
    );
  }
}
