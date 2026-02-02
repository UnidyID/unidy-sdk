import { Component, Element, h, Prop } from "@stencil/core";
import { Auth } from "../..";
import { t } from "../../../i18n";
import { hasSlotContent } from "../../../shared/component-utils";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-cancel-brand-connect-button",
  shadow: false,
})
export class CancelBrandConnectButton {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private hasSlot = false;

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
  }

  private async onClick() {
    const authInstance = await Auth.getInstance();
    await authInstance.helpers.cancelBrandConnect();
  }

  render() {
    if (authState.step !== "connect-brand") return null;

    return (
      <button type="button" class={this.componentClassName} onClick={() => this.onClick()} disabled={authState.loading} aria-live="polite">
        {this.hasSlot ? <slot /> : t("buttons.cancel")}
      </button>
    );
  }
}
