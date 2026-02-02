import { Component, Element, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { hasSlotContent } from "../../../shared/component-utils";
import { Auth } from "../..";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-brand-connect-button",
  shadow: false,
})
export class BrandConnectButton {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() action: "connect" | "cancel" = "connect";
  @State() isLoading = false;

  private hasSlot = false;

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
  }

  private async onClick() {
    if (this.action === "cancel") {
      const authInstance = await Auth.getInstance();
      await authInstance.helpers.cancelBrandConnect();
    } else {
      this.isLoading = true;
      const authInstance = await Auth.getInstance();
      await authInstance.helpers.connectBrand();
      this.isLoading = false;
    }
  }

  render() {
    return (
      <button
        type="button"
        class={this.componentClassName}
        onClick={() => this.onClick()}
        disabled={authState.loading}
        aria-live="polite"
      >
        {this.isLoading
            ? <u-spinner />
            : this.hasSlot
              ? <slot />
              : t(`buttons.${this.action}`)}
      </button>
    );
  }
}
