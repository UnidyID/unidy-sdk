import { Component, Event, type EventEmitter, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { Auth } from "../../auth";

@Component({
  tag: "u-logout-button",
  shadow: false,
})
export class LogoutButton extends UnidyComponent(HasSlotContent) {
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** If true, reloads the page after successful logout. */
  @Prop() reloadOnSuccess = true;
  /**
   * When set, overrides the default global-logout behaviour.
   * `true` requests termination of all server-side sessions (full OIDC session teardown).
   * `false` only invalidates the current SDK sign-in record.
   * When unset, the SDK decides based on how the session was established.
   */
  @Prop({ attribute: "global-logout" }) globalLogout?: boolean;

  /** Fired after successful logout. */
  @Event() logout!: EventEmitter<void>;

  private handleLogout = async () => {
    const authInstance = await Auth.getInstance();

    const result = await authInstance.logout(this.globalLogout);

    if (result === true) {
      this.logout.emit();

      if (this.reloadOnSuccess) {
        window.location.reload();
      }
    }
  };

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={this.handleLogout} aria-live="polite">
        {this.hasSlot ? <slot /> : t("buttons.logout")}
      </button>
    );
  }
}
