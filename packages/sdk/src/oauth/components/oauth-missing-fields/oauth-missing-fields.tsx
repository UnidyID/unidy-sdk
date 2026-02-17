import { Component, forceUpdate, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { state as profileState } from "../../../profile/store/profile-store";
import { UnidyComponent } from "../../../shared/base/component";
import { oauthState, onChange } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-missing-fields",
  shadow: false,
})
export class OAuthMissingFields extends UnidyComponent() {
  /** CSS classes to apply to the container element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** CSS classes to apply to each field element. */
  @Prop({ attribute: "field-class-name" }) fieldClassName = "";

  @State() profileLoaded = false;
  @State() loading = false;

  private unsubscribe?: () => void;

  connectedCallback() {
    // Subscribe to missingFields changes to trigger re-renders
    this.unsubscribe = onChange("missingFields", () => {
      forceUpdate(this);
      // Fetch profile data when missing fields change
      if (oauthState.missingFields.length > 0 && !this.profileLoaded) {
        this.fetchProfileData();
      }
    });
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  private async fetchProfileData() {
    if (this.loading || this.profileLoaded) return;

    this.loading = true;
    try {
      const [error, data] = await getUnidyClient().profile.get();

      if (!error && data) {
        profileState.data = JSON.parse(JSON.stringify(data));
        profileState.configuration = JSON.parse(JSON.stringify(data));
        this.profileLoaded = true;
      }
    } catch (err) {
      this.logger.error("Failed to fetch profile data:", err);
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (oauthState.missingFields.length === 0) {
      return null;
    }

    if (this.loading) {
      return (
        <div class={this.componentClassName}>
          <u-spinner />
        </div>
      );
    }

    return (
      <div class={this.componentClassName}>
        {oauthState.missingFields.map((fieldName) => (
          <u-field key={fieldName} field={fieldName} renderDefaultLabel={true} required={true} class-name={this.fieldClassName} />
        ))}
      </div>
    );
  }
}
