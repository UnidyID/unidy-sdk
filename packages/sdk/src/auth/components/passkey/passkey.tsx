import { Component, h, Prop, State, Host } from "@stencil/core";
import { t } from "../../../i18n";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth";

@Component({
  tag: "u-passkey",
  shadow: false,
})
export class Passkey {
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";
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
    if (!authState.availableLoginOptions?.passkey) {
      return null;
    }

    if (!this.isSupported) {
      return null;
    }

    const isDisabled = this.disabled || authState.loading;
    const text = t("auth.passkey.button_text", { defaultValue: "Sign in with Passkey" });
    const loadingText = t("auth.passkey.loading_text", { defaultValue: "Authenticating..." });

    return (
      <Host>
        <button
          type="button"
          disabled={isDisabled}
          onClick={this.handleClick}
          class={this.componentClassName}
          aria-live="polite"
          aria-describedby={this.ariaDescribedBy || undefined}
        >
          {authState.loading ? loadingText : text}
        </button>
      </Host>
    );
  }
}
