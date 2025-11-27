import { Component, h, Element } from "@stencil/core";
import { state as profileState } from "../../../profile/store/profile-store";
import { authState, authStore, missingFieldNames } from "../../store/auth-store";
import type { ProfileRaw } from "../../../profile/store/profile-store";

@Component({
  tag: "u-missing-field",
  shadow: false,
})
export class MissingField {
  @Element() el!: HTMLElement;

  private onPopState = () => {
    let sdkStartUrl: string | null = null;
    try {
      sdkStartUrl = window.location.href;
    } catch (e) {
      console.error("Failed to read sdk_start_url:", e);
    }
    sessionStorage.removeItem("unidy_missing_required_fields");
    sessionStorage.removeItem("unidy_step");
    authStore.reset();
    profileState.data = {} as ProfileRaw;
    authState.step = "email";

    if (sdkStartUrl) {
      window.location.href = sdkStartUrl;
    } else {
      window.history.back();
    }
  };

  componentWillLoad() {
    this.restoreMissingFieldsFromSession();
  }

  componentDidLoad() {
    if (typeof window !== "undefined") {
      window.history.pushState({ missingFields: true }, "", window.location.href);
      window.addEventListener("popstate", this.onPopState);
    }
  }

  private restoreMissingFieldsFromSession() {
    if (authState.step === "missing-fields") {
      return;
    }

    try {
      const step = sessionStorage.getItem("unidy_step");
      const fieldsFromSession = sessionStorage.getItem("unidy_missing_required_fields");

      if (step !== "missing-fields" && !fieldsFromSession) {
        return;
      }

      const fields = JSON.parse(fieldsFromSession);

      authStore.setMissingFields(fields);
      profileState.data = fields as ProfileRaw;
      authStore.setStep("missing-fields");
    } catch (e) {
      console.error("Failed to restore missing fields from session:", e);

      sessionStorage.removeItem("unidy_missing_required_fields");
      sessionStorage.removeItem("unidy_step");
    }
  }

  render() {
    if (authState.step !== "missing-fields") return null;

    const fieldNames = missingFieldNames();

    return (
      <div class="missing-fields">
          <form>
            {fieldNames.map((fieldName) => (
              <u-field
                key={fieldName}
                field={fieldName}
                renderDefaultLabel={true}
              />
            ))}
          </form>
      </div>
    );
  }
}
