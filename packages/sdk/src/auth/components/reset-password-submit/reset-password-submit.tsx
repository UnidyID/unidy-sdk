import { Component, h, Prop, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth";
import { hasSlotContent } from "../../../shared/component-utils";

@Component({
  tag: "u-reset-password-submit",
  shadow: false,
})
export class ResetPasswordSubmit {
  @Element() el!: HTMLElement;

  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() text = "Reset Password";
  @Prop() loadingText = "Resetting...";

  private handleClick = async () => {
    if (this.disabled || authState.loading) return;

    const authInstance = await Auth.getInstance();
    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

    await authInstance.helpers.resetPassword();
  };

  render() {
    if (authState.step !== "reset-password") {
      return null;
    }

    return (
      <button
        type="button"
        disabled={this.disabled || authState.loading}
        onClick={this.handleClick}
        class={this.componentClassName}
        aria-live="polite"
      >
        {authState.loading ? this.loadingText : hasSlotContent(this.el) ? <slot /> : this.text}
      </button>
    );
  }
}
