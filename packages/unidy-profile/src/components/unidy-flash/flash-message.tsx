import { Component, Element, Prop, State, h } from "@stencil/core";

@Component({
  tag: "flash-message",
  styleUrl: "flash-message.css",
  shadow: true,
})
export class FlashMessage {
  @Element() el!: HTMLElement;

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
        <span>{this.variant === "error" ? "✘" : "✓"} {this.message}</span>
        <button onClick={() => this.closeError()}>Close</button>
      </div>
    );
  }
}
