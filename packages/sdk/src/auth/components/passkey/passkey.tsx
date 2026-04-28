import { Component, Host, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";
import { PasskeyIcon } from "./passkey-icon";

const ICON_CLASSNAME = "u:w-5 u:h-5 u:block";

@Component({
  tag: "u-passkey",
  styleUrl: "passkey.css",
  shadow: false,
})
export class Passkey {
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() ariaDescribedBy? = "";
  /** When true, renders and triggers a discoverable-credential flow without requiring a prior email step. */
  @Prop() discoverable = false;

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
    if (!this.discoverable && !authState.availableLoginOptions?.passkey) {
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
          <div class="u:flex u:items-center u:justify-center">
            <slot name="icon">
              <span aria-hidden="true">
                <PasskeyIcon className={ICON_CLASSNAME} />
              </span>
            </slot>
            <span class="u:ml-4">{authState.loading ? loadingText : text}</span>
          </div>
        </button>
      </Host>
    );
  }
}
