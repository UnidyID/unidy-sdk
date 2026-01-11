import { Component, h, Prop, State, forceUpdate, Element } from "@stencil/core";
import { Auth } from "../../auth";
import { authState, onChange } from "../../store/auth-store";
import { getUnidyClient } from "../../api-client";
import { unidyState } from "../../../shared/store/unidy-store";
import { t } from "../../../i18n";
import { hasSlotContent } from "../../../shared/component-utils";

@Component({
  tag: "u-jump-to-unidy",
  shadow: false,
})
export class JumpToUnidy {
  @Element() el!: HTMLElement;

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
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /**
   * The text displayed on the button. If not provided, renders slot content instead.
   */
  @Prop() text?: string;

  @State() loading = false;
  private unsubscribe?: () => void;
  private hasSlot = false;

  /**
   * Validates that the path prop is valid (not empty and starts with "/").
   * @returns true if path is valid, false otherwise
   */
  private isValidPath(): boolean {
    return !!this.path && this.path.startsWith("/");
  }

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    if (!this.isValidPath()) {
      console.error(`[u-jump-to-unidy] Invalid path prop: "${this.path}". Path must be provided and start with "/".`);
    }
  }

  // TODO: Figure out a way to share this across components
  connectedCallback() {
    this.unsubscribe = onChange("authenticated", () => {
      forceUpdate(this);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.isValidPath()) {
      console.error(`[u-jump-to-unidy] Invalid path: "${this.path}". Path must be provided and start with "/".`);
      return;
    }

    if (!unidyState.baseUrl) {
      console.error("baseUrl is not set. Make sure <u-config> is rendered with a valid base-url.");
      return;
    }

    const auth = await Auth.getInstance();
    const isAuthenticated = await auth.isAuthenticated();

    if (!isAuthenticated) {
      console.error("[u-jump-to-unidy] User is not authenticated. Please log in first.");
      return;
    }

    const userData = await auth.userData();
    if (!userData || !userData.email) {
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
        this.loading = false;
        return;
      }

      const redirectUrl = new URL("/one_time_login", unidyState.baseUrl);
      // @ts-expect-error - TOKEN IS A STRING, BUT we need to enable strict for it to work
      redirectUrl.searchParams.set("token", token);

      const finalUrl = redirectUrl.toString();

      if (this.newtab) {
        window.open(finalUrl, "_blank");
      } else {
        window.location.href = finalUrl;
      }
    } catch (error) {
      console.error("Error jumping to Unidy:", error);
    } finally {
      this.loading = false;
    }
  };

  private isDisabled(): boolean {
    return !authState.authenticated || this.loading || !this.isValidPath();
  }

  render() {
    return (
      <button type="button" disabled={this.isDisabled()} class={this.componentClassName} onClick={this.handleClick} aria-live="polite">
        {this.loading ? <u-spinner /> : this.text ? this.text : this.hasSlot ? <slot /> : t("buttons.jump_to_unidy")}
      </button>
    );
  }
}
