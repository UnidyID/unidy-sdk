import { Component, h } from "@stencil/core";

@Component({
  tag: "u-spinner",
  styleUrl: "spinner.css",
  shadow: true,
})
export class Spinner {
  render() {
    return <div class="spinner-inner" part="spinner" aria-label="Loading" />;
  }
}
