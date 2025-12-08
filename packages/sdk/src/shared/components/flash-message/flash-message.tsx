import { Component, Prop, h } from "@stencil/core";
import { Flash, flashState } from "../../store/flash-store";

@Component({
  tag: "u-flash-message",
  styleUrl: "flash-message.css",
  shadow: false,
})
export class FlashMessage {
  @Prop() closeText = "Close";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop({ attribute: "close-button-class" }) closeButtonClassName = "";

  private handleClose() {
    Flash.clear();
  }

  render() {
    const message = flashState.message;

    if (!message) {
      return null;
    }

    return (
      <div class={`u-flash-message u-flash-${message.variant} ${this.componentClassName}`} role="alert" aria-live="polite">
        <span class="u-flash-content">
          <slot name="content">{message.text}</slot>
        </span>
        <button type="button" class={`u-flash-close ${this.closeButtonClassName}`} onClick={() => this.handleClose()}>
          <slot name="close">{this.closeText}</slot>
        </button>
      </div>
    );
  }
}
