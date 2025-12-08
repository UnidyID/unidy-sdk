import { Component, Prop, h } from "@stencil/core";
import { Flash, flashState } from "../../store/flash-store";
import { CloseIcon } from "./close-icon";

@Component({
  tag: "u-flash-message",
  styleUrl: "flash-message.css",
  shadow: false,
})
export class FlashMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop({ attribute: "content-class-name" }) contentClassName = "";
  @Prop({ attribute: "close-button-class-name" }) closeButtonClassName = "";

  private handleClose() {
    Flash.clear();
  }

  render() {
    const message = flashState.message;

    if (!message) {
      return null;
    }

    return (
      <div class={`u-flash-message u-flash-message--${message.variant} ${this.componentClassName}`} role="alert" aria-live="polite">
        <span class="u-flash-content" part="content" class-name={this.contentClassName}>
          {message.text}
        </span>
        <button
          type="button"
          class="u-flash-close"
          part="close-button"
          class-name={this.closeButtonClassName}
          onClick={() => this.handleClose()}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>
    );
  }
}
