import { Component, Host, h, Prop, Method } from "@stencil/core";
import { newsletterStore } from "../../store/store";
import type { Submittable } from "../../../shared/interfaces/submittable";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot implements Submittable {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  componentDidLoad() {
    console.log("newsletter root loaded");
  }

  @Method()
  async submit(): Promise<void> {
    // TODO: Implement newsletter submit logic
    console.log("TODO: Implement newsletter submit logic");
  }

  @Method()
  async isSubmitDisabled(): Promise<boolean> {
    return !newsletterStore.get("email");
  }

  @Method()
  async isLoading(): Promise<boolean> {
    // newsletter sdk doesn't have loading state yet
    return false;
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
