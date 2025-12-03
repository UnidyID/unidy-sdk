import { Component, h, Prop, State, Host } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth";

@Component({
  tag: "u-passkey",
  shadow: false,
})
export class Passkey {
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() text = "Sign in with Passkey";
  @Prop() loadingText = "Authenticating...";
  @Prop() ariaDescribedBy? = "";

  @State() isSupported = false;

  componentWillLoad() {
    // Check if WebAuthn is supported
    this.isSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
  }

  private handleClick = async () => {
    if (this.disabled || authState.loading || !this.isSupported) return;

    const authInstance = await Auth.getInstance();

    await authInstance.helpers.authenticateWithPasskey();
  };

  render() {
    if (!this.isSupported) {
      return null;
    }

    const isDisabled = this.disabled || authState.loading;

    return (
      <Host>
        <button type="button" disabled={isDisabled} onClick={this.handleClick} class={this.componentClassName}
                aria-live="polite" aria-describedby={this.ariaDescribedBy || undefined}>
          {authState.loading ? this.loadingText : this.text}
        </button>
      </Host>
    );
  }
}
