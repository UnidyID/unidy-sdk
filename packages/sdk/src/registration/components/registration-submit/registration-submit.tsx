import { Component, Element, Prop, h } from "@stencil/core";
import { registrationState } from "../../store/registration-store";
import { getParentRegistrationStep } from "../helpers";

@Component({
  tag: "u-registration-submit",
  styleUrl: "registration-submit.css",
  shadow: false,
})
export class RegistrationSubmit {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName?: string;

  private handleClick = async (e: Event) => {
    e.preventDefault();
    (await getParentRegistrationStep(this.el))?.submit();
  };

  private isDisabled(): boolean {
    return registrationState.loading || registrationState.submitting;
  }

  render() {
    return (
      <button
        type="submit"
        class={this.componentClassName}
        onClick={this.handleClick}
        disabled={this.isDisabled()}
      >
        <slot />
      </button>
    );
  }
}
