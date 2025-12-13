import { Component, Host, h, Prop } from "@stencil/core";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  componentDidLoad() {
    console.log("newsletter root loaded");
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
