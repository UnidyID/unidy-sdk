import { Component, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-back-button",
  shadow: false,
})
export class BackButton extends UnidyComponent(HasSlotContent) {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /**
   * If true, restarts the entire flow instead of going back one step.
   * Use this for "Start over" buttons.
   */
  @Prop() restart = false;

  private canGoBack(): boolean {
    if (this.restart) {
      const initialStep = authState._initialStep ?? "email";
      return authState.step !== initialStep && authState.step !== undefined;
    }
    return (authState._stepHistory?.length ?? 0) > 0;
  }

  private handleClick = async () => {
    const authInstance = await Auth.getInstance();

    if (this.restart) {
      authInstance.restart();
    } else {
      authInstance.goBack();
    }
  };

  private getButtonText() {
    if (this.restart) {
      return t("auth.navigation.restart", { defaultValue: "Start over" });
    }
    return t("auth.navigation.back", { defaultValue: "Back" });
  }

  render() {
    if (!this.canGoBack()) {
      console.log("canGoBack is false");
      return null;
    }

    return (
      <button type="button" onClick={this.handleClick} class={this.componentClassName}>
        {this.hasSlot ? <slot /> : this.getButtonText()}
      </button>
    );
  }
}
