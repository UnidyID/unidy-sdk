import { Component, h } from "@stencil/core";
import { UnidyComponent } from "../../../shared/base/component";
import { oauthState } from "../../store/oauth-store";
import { getOAuthProvider, type OAuthProviderElement } from "../context";

@Component({
  tag: "u-oauth-modal",
  shadow: false,
})
export class OAuthModal extends UnidyComponent() {
  private provider: OAuthProviderElement | null = null;
  private dialogRef?: HTMLDialogElement;

  connectedCallback() {
    this.provider = getOAuthProvider(this.element);

    if (!this.provider) {
      this.logger.warn("Must be used inside a u-oauth-provider");
    }
  }

  componentDidRender() {
    const shouldBeOpen = oauthState.step === "consent" || oauthState.step === "submitting";

    if (shouldBeOpen && this.dialogRef && !this.dialogRef.open) {
      this.dialogRef.showModal();
    } else if (!shouldBeOpen && this.dialogRef?.open) {
      this.dialogRef.close();
    }
  }

  private handleDialogClose = () => {
    const isOpen = oauthState.step === "consent" || oauthState.step === "submitting";
    if (isOpen) {
      this.provider?.cancel();
    }
  };

  private handleBackdropClick = (event: MouseEvent | KeyboardEvent) => {
    if (event.target === this.dialogRef) {
      this.provider?.cancel();
    }
  };

  private setDialogRef = (el: HTMLDialogElement | undefined) => {
    this.dialogRef = el;
  };

  render() {
    // Access oauthState.step to subscribe to state changes and trigger re-renders
    void oauthState.step;

    if (!this.provider) {
      return null;
    }

    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: dialog handles keyboard via onClose
      <dialog
        ref={this.setDialogRef}
        onClose={this.handleDialogClose}
        onClick={this.handleBackdropClick}
        aria-labelledby="oauth-modal-title"
        aria-describedby="oauth-modal-description"
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: prevents backdrop click propagation */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by dialog */}
        <div class="u-oauth-modal-content" onClick={(e) => e.stopPropagation()}>
          <slot />
        </div>
      </dialog>
    );
  }
}
