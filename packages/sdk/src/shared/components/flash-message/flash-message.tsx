import { Component, Prop, State, h } from "@stencil/core";

@Component({
  tag: "u-flash-message",
  styleUrl: "flash-message.css",
  shadow: true,
})
export class FlashMessage {
  @Prop() message = "";
  @Prop() variant: "error" | "success" | "info" = "info";
  @State() isVisible = true;

  private closeError() {
    this.isVisible = false;
  }

  render() {
    if (!this.isVisible || !this.message) {
      return null;
    }
    return (
      <div class={`${this.variant}-message`}>
        <span>
          {this.variant === "error" ? "✘" : "✓"} {this.message}
        </span>
        <button type="button" onClick={() => this.closeError()} aria-live="polite">
          Close
        </button>
      </div>
    );
  }
}
