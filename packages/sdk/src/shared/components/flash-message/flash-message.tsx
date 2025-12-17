import { Component, Prop, h } from "@stencil/core";
import { flashState, Flash } from "../../store/flash-store";
import { CloseIcon } from "./close-icon";

const variantClasses = {
  error: "bg-red-50 border-red-300 text-red-800",
  success: "bg-green-50 border-green-400 text-green-800",
  info: "bg-blue-50 border-blue-300 text-blue-800",
};

@Component({
  tag: "u-flash-message",
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
      <div class={`u:flex u:flex-col u:gap-2 u:z-[500] u:min-w-64 u:max-w-lg ${this.componentClassName}`}>
        {flashState.messages.map((message) => (
          <div
            key={message.id}
            class={`u:flex u:items-start u:justify-between u:gap-3 u:p-3 u:rounded u:border ${variantClasses[message.variant]}`}
            role="alert"
            aria-live="polite"
          >
            <span class="break-all">{message.text}</span>
            <button
              type="button"
              class="u:cursor-pointer u:leading-none u:pt-1"
              onClick={() => Flash.remove(message.id)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    );
  }
}
