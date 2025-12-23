import { Component, h, Host } from "@stencil/core";

@Component({
  tag: "u-spinner",
  styleUrl: "spinner.css",
  shadow: true,
})
export class Spinner {
  render() {
    return (
      <Host class="u:inline-flex u:items-center u:justify-center">
        <div class="spinner-inner u:w-[1em] u:h-[1em] u:rounded-[50%] u:animate-spin" part="spinner" aria-label="Loading" />
      </Host>
    );
  }
}
