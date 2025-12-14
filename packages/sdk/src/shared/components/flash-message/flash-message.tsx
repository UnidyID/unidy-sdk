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
      <div class={`flex flex-col gap-2 z-[500] min-w-64 max-w-lg ${this.componentClassName}`}>
        {flashState.messages.map((message) => (
          <div
            key={message.id}
            class={`flex items-start justify-between gap-3 p-3 rounded border ${variantClasses[message.variant]}`}
            role="alert"
            aria-live="polite"
          >
            <span class="break-words">{message.text}</span>
            <button type="button" class="cursor-pointer leading-none pt-1" onClick={() => Flash.remove(message.id)} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    );
  }
}
