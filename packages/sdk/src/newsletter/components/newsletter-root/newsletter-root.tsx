import { Component, Host, h, Prop, Element, Method } from "@stencil/core";
import { UnidyComponent } from "../../../logger";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot extends UnidyComponent {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @Method()
  async submit() {
    // TODO: add submit logic here
  }

  componentDidLoad() {
    this.logger.debug("newsletter root loaded");
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
