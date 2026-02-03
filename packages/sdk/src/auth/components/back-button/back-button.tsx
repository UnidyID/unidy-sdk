import { Component, h, Prop, State, Watch } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { Auth } from "../../auth";
import { authState, onChange } from "../../store/auth-store";

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

  @State() canGoBack = false;

  private unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.updateCanGoBack();

    this.unsubscribe = onChange("step", () => {
      this.updateCanGoBack();
    });
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  @Watch("restart")
  updateCanGoBack() {
    try {
      if (this.restart) {
        const initialStep = authState._initialStep ?? "email";
        this.canGoBack = authState.step !== initialStep && authState.step !== undefined;
      } else {
        this.canGoBack = (authState._stepHistory?.length ?? 0) > 0;
      }
    } catch {
      this.canGoBack = false;
    }
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
    if (!this.canGoBack) {
      return null;
    }

    return (
      <button type="button" onClick={this.handleClick} class={this.componentClassName}>
        {this.hasSlot ? <slot /> : this.getButtonText()}
      </button>
    );
  }
}
