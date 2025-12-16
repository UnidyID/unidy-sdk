import { Component, Host, h, Prop, Element, Method } from "@stencil/core";
import { logger } from "../../../logger";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @Method()
  async submit() {
    // TODO: add submit logic here
  }

  componentDidLoad() {
    logger.debug(`[${this.constructor.name}] newsletter root loaded`);
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
