import { Component, Element, Prop, State, h } from "@stencil/core";

@Component({
  tag: "error-message",
  styleUrl: "error-message.css",
  shadow: true,
})
export class ErrorMessage {
  @Element() el!: HTMLElement;

  @Prop() message: string = "";
  @State() isVisible: boolean = true;

  private closeError() {
    this.isVisible = false;
  }

  render() {
    if (!this.isVisible || !this.message) {
      return null;
    }
    return (
      <div class="error-message">
        <span>{this.message}</span>
        <button onClick={() => this.closeError()}>Close</button>
      </div>
    );
  }
}
