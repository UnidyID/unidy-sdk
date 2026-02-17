import { Component, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { slotFallbackText } from "../../../shared/component-utils";
import { unidyState } from "../../../shared/store/unidy-store";
import { redirectWithToken } from "../../../shared/utils/redirect-with-token";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-jump-to-unidy",
  shadow: false,
})
export class JumpToUnidy extends UnidyComponent(HasSlotContent) {
  /**
   * The Unidy path to redirect to. Must start with "/".
   * @example "/subscriptions"
   * @example "/tickets"
   */
  @Prop() path!: string;

  /**
   * If true, opens the URL in a new tab. Defaults to false.
   */
  @Prop() newtab = false;

  /**
   * If true, skips authentication and redirects directly to the Unidy path.
   * Useful for public pages like terms of service.
   */
  @Prop({ attribute: "no-auth" }) noAuth = false;

  /**
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() loading = false;

  private isValidPath(): boolean {
    return !!this.path && this.path.startsWith("/");
  }

  componentWillLoad() {
    if (!this.isValidPath()) {
      console.error(`[u-jump-to-unidy] Invalid path prop: "${this.path}". Path must be provided and start with "/".`);
    }
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.isValidPath()) {
      console.error(`[u-jump-to-unidy] Invalid path: "${this.path}". Path must be provided and start with "/".`);
      return;
    }

    // If no-auth mode, redirect directly to the path without authentication
    if (this.noAuth) {
      const finalUrl = new URL(this.path, unidyState.baseUrl).toString();
      if (this.newtab) {
        window.open(finalUrl, "_blank");
      } else {
        window.location.href = finalUrl;
      }
      return;
    }

    const auth = await Auth.getInstance();
    if (!(await auth.isAuthenticated())) {
      console.error("[u-jump-to-unidy] User is not authenticated. Please log in first.");
      return;
    }

    const userData = await auth.userTokenPayload();
    if (!userData?.email) {
      console.error("Failed to get user email from authentication token");
      return;
    }

    this.loading = true;

    try {
      const client = getUnidyClient();
      const [error, token] = await client.auth.jumpToUnidy({
        email: userData.email,
        path: this.path,
      });

      if (error) {
        console.error("Failed to get jump token:", error);
        return;
      }

      redirectWithToken({
        // @ts-expect-error - TOKEN IS A STRING, BUT we need to enable strict for it to work
        token,
        newTab: this.newtab,
      });
    } catch (error) {
      console.error("Error jumping to Unidy:", error);
    } finally {
      this.loading = false;
    }
  };

  private isDisabled(): boolean {
    if (this.noAuth) {
      return this.loading || !this.isValidPath();
    }
    return !authState.authenticated || this.loading || !this.isValidPath();
  }

  render() {
    return (
      <button type="button" disabled={this.isDisabled()} class={this.componentClassName} onClick={this.handleClick} aria-live="polite">
        {slotFallbackText(t("buttons.jump_to_unidy"), { hasSlot: this.hasSlot, loading: this.loading })}
      </button>
    );
  }
}
