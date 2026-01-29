import { Component, Element, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { hasSlotContent } from "../../../shared/component-utils";
import { getOAuthProvider, type OAuthProviderElement } from "../context";

@Component({
  tag: "u-oauth-cancel",
  shadow: false,
})
export class OAuthCancel {
  @Element() el!: HTMLElement;

  /**
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private hasSlot = false;
  private provider: OAuthProviderElement | null = null;

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    this.provider = getOAuthProvider(this.el);

    if (!this.provider) {
      console.warn("[u-oauth-cancel] Must be used inside a u-oauth-provider");
    }
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.provider) {
      console.error("[u-oauth-cancel] No oauth-provider found");
      return;
    }

    await this.provider.cancel();
  };

  private renderContent() {
    if (this.hasSlot) {
      return <slot />;
    }
    return t("buttons.cancel");
  }

  render() {
    return (
      <button
        type="button"
        class={this.componentClassName}
        onClick={this.handleClick}
      >
        {this.renderContent()}
      </button>
    );
  }
}
