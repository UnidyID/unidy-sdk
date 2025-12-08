import { Component, Prop, h } from "@stencil/core";
import { flashState, Flash } from "../../store/flash-store";
import { CloseIcon } from "./close-icon";

@Component({
  tag: "u-flash-message",
  styleUrl: "flash-message.css",
  shadow: false,
})
export class FlashMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() removeAfterSeconds: number | null = null;

  componentWillLoad() {
    if (this.removeAfterSeconds) {
      flashState.autoRemoveDelay = this.removeAfterSeconds * 1000;
    }
  }

  render() {
    if (flashState.messages.length === 0) {
      return null;
    }

    return (
      <div class={`u-flash-container ${this.componentClassName}`}>
        {flashState.messages.map((message) => (
          <div key={message.id} class={`u-flash-message u-flash-message--${message.variant}`} role="alert" aria-live="polite">
            <span class="u-flash-content">{message.text}</span>
            <button type="button" class="u-flash-close" onClick={() => Flash.remove(message.id)} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    );
  }
}
