import { Component, Element, h, Host, State } from "@stencil/core";
import { getOAuthProvider, type OAuthProviderElement } from "../context";
import { oauthState, onChange, type OAuthStep } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-modal",
  shadow: false,
})
export class OAuthModal {
  @Element() el!: HTMLElement;

  @State() private isOpen = false;

  private provider: OAuthProviderElement | null = null;
  private unsubscribers: Array<() => void> = [];
  private dialogRef?: HTMLDialogElement;

  componentWillLoad() {
    this.provider = getOAuthProvider(this.el);

    if (!this.provider) {
      console.warn("[u-oauth-modal] Must be used inside a u-oauth-provider");
      return;
    }

    const step = oauthState.step;
    this.isOpen = step === "consent" || step === "submitting";

    this.unsubscribers.push(
      onChange("step", (step: OAuthStep) => {
        const shouldBeOpen = step === "consent" || step === "submitting";
        if (shouldBeOpen !== this.isOpen) {
          this.isOpen = shouldBeOpen;
        }
      })
    );
  }

  componentDidUpdate() {
    if (this.isOpen && this.dialogRef && !this.dialogRef.open) {
      this.dialogRef.showModal();
    } else if (!this.isOpen && this.dialogRef?.open) {
      this.dialogRef.close();
    }
  }

  disconnectedCallback() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  private handleDialogClose = () => {
    // Dialog was closed (e.g., by pressing Escape)
    if (this.isOpen) {
      this.provider?.cancel();
    }
  };

  private handleBackdropClick = (event: MouseEvent) => {
    // Close when clicking on the backdrop (the dialog element itself)
    if (event.target === this.dialogRef) {
      this.provider?.cancel();
    }
  };

  render() {
    if (!this.provider) {
      return null;
    }

    return (
      <Host>
        <dialog
          ref={(el) => (this.dialogRef = el)}
          onClose={this.handleDialogClose}
          onClick={this.handleBackdropClick}
          aria-labelledby="oauth-modal-title"
          aria-describedby="oauth-modal-description"
        >
          <div class="u-oauth-modal-content" onClick={(e) => e.stopPropagation()}>
            <slot />
          </div>
        </dialog>
      </Host>
    );
  }
}
