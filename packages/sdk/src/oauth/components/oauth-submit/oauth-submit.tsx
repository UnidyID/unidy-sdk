import { Component, Element, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { hasSlotContent, renderButtonContent } from "../../../shared/component-utils";
import { getOAuthProvider, type OAuthProviderElement } from "../context";
import { oauthState, onChange } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-submit",
  shadow: false,
})
export class OAuthSubmit {
  @Element() el!: HTMLElement;

  /**
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() private loading = false;
  @State() private missingFields: string[] = [];
  @State() private fieldValues: Record<string, unknown> = {};

  private hasSlot = false;
  private provider: OAuthProviderElement | null = null;
  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    this.provider = getOAuthProvider(this.el);
    this.loading = oauthState.loading;
    this.missingFields = oauthState.missingFields;
    this.fieldValues = oauthState.fieldValues;

    if (!this.provider) {
      console.warn("[u-oauth-submit] Must be used inside a u-oauth-provider");
      return;
    }

    this.unsubscribers.push(
      onChange("loading", (loading) => {
        this.loading = loading;
      })
    );

    this.unsubscribers.push(
      onChange("missingFields", (fields) => {
        this.missingFields = fields;
      })
    );

    this.unsubscribers.push(
      onChange("fieldValues", (values) => {
        this.fieldValues = values;
      })
    );
  }

  disconnectedCallback() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.provider) {
      console.error("[u-oauth-submit] No oauth-provider found");
      return;
    }

    await this.provider.submit();
  };

  private allFieldsFilled(): boolean {
    if (this.missingFields.length === 0) return true;

    return this.missingFields.every((field) => {
      const value = this.fieldValues[field];
      return value !== undefined && value !== null && value !== "";
    });
  }

  render() {
    const isDisabled = this.loading || !this.provider || !this.allFieldsFilled();

    return (
      <button
        type="submit"
        disabled={isDisabled}
        class={this.componentClassName}
        onClick={this.handleClick}
        aria-live="polite"
      >
        {renderButtonContent(this.hasSlot, this.loading, t("buttons.confirm"))}
      </button>
    );
  }
}
