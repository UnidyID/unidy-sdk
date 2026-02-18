import { Component, Host, Prop, State, h } from "@stencil/core";
import { isWebAuthnSupported } from "../../../shared/passkey-utils";
import { Registration } from "../../registration";
import { onChange, registrationState } from "../../store/registration-store";

@Component({
  tag: "u-registration-passkey",
  styleUrl: "registration-passkey.css",
  shadow: false,
})
export class RegistrationPasskey {
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /** Optional name for the passkey (defaults to "Passkey"). */
  @Prop({ attribute: "passkey-name" }) passkeyName?: string;

  /** Disable the button. */
  @Prop() disabled = false;

  @State() private isSupported = false;
  @State() private renderTrigger = 0;

  private registrationInstance: Registration | null = null;
  private unsubscribers: (() => void)[] = [];

  async componentWillLoad() {
    this.isSupported = isWebAuthnSupported();
    this.registrationInstance = await Registration.getInstance();
  }

  connectedCallback() {
    const triggerRender = () => {
      this.renderTrigger++;
    };
    this.unsubscribers.push(onChange("hasPasskey", triggerRender));
    this.unsubscribers.push(onChange("loading", triggerRender));
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }

  private handleClick = async () => {
    if (this.disabled || registrationState.loading) return;

    if (registrationState.hasPasskey) {
      await this.registrationInstance?.helpers.removePasskey();
    } else {
      await this.registrationInstance?.helpers.registerPasskey(this.passkeyName);
    }
  };

  render() {
    void this.renderTrigger;

    if (!this.isSupported) {
      return null;
    }

    const isDisabled = this.disabled || registrationState.loading;

    return (
      <Host>
        <button
          type="button"
          disabled={isDisabled}
          onClick={this.handleClick}
          class={this.componentClassName}
          aria-live="polite"
        >
          <slot />
          {registrationState.hasPasskey && (
            <span role="img" aria-label="Passkey registered"> &#x2713;</span>
          )}
        </button>
      </Host>
    );
  }
}
