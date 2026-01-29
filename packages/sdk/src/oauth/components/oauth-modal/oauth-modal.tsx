import { Component, Element, h, Host } from "@stencil/core";
import { UnidyComponent } from "../../../logger";
import { getOAuthProvider, type OAuthProviderElement } from "../context";
import { oauthState } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-modal",
  shadow: false,
})
export class OAuthModal extends UnidyComponent {
  @Element() el!: HTMLElement;

  private provider: OAuthProviderElement | null = null;
  private dialogRef?: HTMLDialogElement;

  componentWillLoad() {
    this.provider = getOAuthProvider(this.el);

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

  private handleBackdropClick = (event: MouseEvent) => {
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
