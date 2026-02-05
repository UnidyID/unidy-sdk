import { Component, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { slotFallbackText } from "../../../shared/component-utils";
import { Auth } from "../..";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-brand-connect-button",
  shadow: false,
})
export class BrandConnectButton extends UnidyComponent(HasSlotContent) {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() action: "connect" | "cancel" = "connect";
  @State() isLoading = false;

  private async onClick() {
    this.isLoading = true;
    try {
      const authInstance = await Auth.getInstance();
      if (this.action === "cancel") {
        await authInstance.helpers.cancelBrandConnect();
      } else {
        await authInstance.helpers.connectBrand();
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={() => this.onClick()} disabled={authState.loading} aria-live="polite">
        {slotFallbackText(t(`buttons.${this.action}`), { hasSlot: this.hasSlot, loading: this.isLoading })}
      </button>
    );
  }
}
