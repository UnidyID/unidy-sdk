import {Component, h, Host} from "@stencil/core";

@Component({
  tag: "u-spinner",
  styleUrl: "spinner.css",
  shadow: true,
})
export class Spinner {
  render() {
    return (
      <Host class="inline-flex items-center justify-center">
        <div class="spinner-inner w-[1em] h-[1em] rounded-[50%] animate-spin" part="spinner" aria-label="Loading" />;
      </Host>
    );
  }
}
