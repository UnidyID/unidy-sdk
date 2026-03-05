import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import type { InternalMatchingConfig, InternalMatchResult } from "../../../auth/api/register";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { Registration } from "../../registration";
import { onChange, registrationState, registrationStore } from "../../store/registration-store";
import { getParentRegistrationStep } from "../helpers";

type UIState = "loading" | "form" | "match-found";

interface AdditionalField {
  name: string;
  label: string;
  format?: string;
}

/** Payload emitted by the matchFound event. */
export interface MatchFoundEventDetail {
  /** Masked email address of the matched account (e.g. "j***@example.com"). */
  emailMasked: string;
  /** ISO 8601 creation date of the matched account. */
  createdAt: string;
}

@Component({
  tag: "u-registration-internal-matching",
  styleUrl: "registration-internal-matching.css",
  shadow: false,
})
export class RegistrationInternalMatching extends UnidyComponent(HasSlotContent) {
  /** CSS classes to apply to the wrapper element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /** CSS classes to apply to text and date input fields. */
  @Prop({ attribute: "input-class-name" }) inputClassName = "";

  /** CSS classes to apply to primary action buttons ("Find Account" and "Yes, use this account"). */
  @Prop({ attribute: "primary-button-class-name" }) primaryButtonClassName = "";

  /** CSS classes to apply to secondary action buttons ("Continue without linking" and "No, create new account"). */
  @Prop({ attribute: "secondary-button-class-name" }) secondaryButtonClassName = "";

  /** CSS classes to apply to error message elements. */
  @Prop({ attribute: "error-class-name" }) errorClassName = "";

  /**
   * Fired when an internal match is found after submitting the form.
   * Use this event to populate a custom `slot="match-preview"` element with the matched account data.
   */
  @Event() matchFound!: EventEmitter<MatchFoundEventDetail>;

  @State() private uiState: UIState = "loading";
  @State() private primaryLabel = "";
  @State() private primaryFormat: "text" | "date" = "text";
  @State() private additionalFields: AdditionalField[] = [];
  @State() private matchingValue = "";
  @State() private additionalValues: Record<string, string> = {};
  @State() private matchedUserId: string | number | null = null;
  @State() private matchedEmailMasked = "";
  @State() private matchedCreatedAt = "";
  @State() private error = "";
  @State() private submitting = false;

  private registrationInstance: Registration | null = null;
  private unsubscribers: (() => void)[] = [];

  async componentWillLoad() {
    this.registrationInstance = await Registration.getInstance();
    await this.maybeInitMatchingFlow();
  }

  connectedCallback() {
    // Named-slot detection must be cached before first render in shadow:false components.
    // `this.hasSlot` is provided by HasSlotContent and checked in render.
    this.hasSlot = !!this.element.querySelector('[slot="match-preview"]');
    this.unsubscribers.push(onChange("currentStepName", () => this.maybeInitMatchingFlow()));
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  private async maybeInitMatchingFlow(): Promise<void> {
    const parentStep = getParentRegistrationStep(this.element);
    if (!parentStep) return;
    if (registrationState.currentStepName !== parentStep.name) return;

    // Reset to loading each time the step becomes active so back-navigation
    // re-runs the config fetch and starts from a clean state.
    this.uiState = "loading";
    await this.initMatchingFlow();
  }

  private async initMatchingFlow(): Promise<void> {
    const helpers = this.registrationInstance?.helpers;
    if (!helpers) return;

    const config: InternalMatchingConfig | null = await helpers.getInternalMatchingConfig();

    if (!config?.enabled) {
      await this.triggerStepAdvance();
      return;
    }

    this.primaryLabel = config.matching_attribute?.label ?? t("registration.internal_matching.default_primary_label");
    this.primaryFormat = config.matching_attribute?.format === "date" ? "date" : "text";
    this.additionalFields = config.additional_fields ?? [];
    this.uiState = "form";
  }

  private async handleCheckMatch(): Promise<void> {
    if (!this.matchingValue.trim()) {
      this.error = t("errors.field_required");
      return;
    }

    this.submitting = true;
    this.error = "";

    const helpers = this.registrationInstance?.helpers;
    if (!helpers) {
      this.submitting = false;
      return;
    }

    const outcome = await helpers.checkInternalMatch(
      this.matchingValue.trim(),
      Object.fromEntries(Object.entries(this.additionalValues).map(([k, v]) => [k, v.trim()])),
    );

    this.submitting = false;

    if (outcome.status === "error") {
      this.error = t("registration.internal_matching.error_generic");
      return;
    }

    if (outcome.status === "not_found") {
      this.error = t("registration.internal_matching.error_no_match");
      return;
    }

    const result: InternalMatchResult = outcome.data;
    this.matchedUserId = result.matching_user_id;
    this.matchedEmailMasked = result.matched_user_preview?.email_masked ?? "";
    this.matchedCreatedAt = result.matched_user_preview?.created_at ?? "";
    this.matchFound.emit({ emailMasked: this.matchedEmailMasked, createdAt: this.matchedCreatedAt });
    this.uiState = "match-found";
  }

  private async handleConfirmMatch(): Promise<void> {
    if (this.matchedUserId === null) return;

    this.submitting = true;
    this.error = "";

    const helpers = this.registrationInstance?.helpers;
    if (!helpers) {
      this.submitting = false;
      return;
    }

    const success = await helpers.confirmInternalMatch(this.matchedUserId);

    this.submitting = false;

    if (!success) {
      this.error = t("registration.internal_matching.error_generic");
      return;
    }

    await this.triggerStepAdvance();
  }

  private async handleSkip(): Promise<void> {
    this.submitting = true;
    this.error = "";

    const helpers = this.registrationInstance?.helpers;
    if (!helpers) {
      this.submitting = false;
      return;
    }

    const success = await helpers.skipInternalMatch();

    this.submitting = false;

    if (!success) {
      this.error = t("registration.internal_matching.error_generic");
      return;
    }

    await this.triggerStepAdvance();
  }

  private async triggerStepAdvance(): Promise<void> {
    const isLastStep = registrationState.currentStepIndex === registrationState.steps.length - 1;

    if (isLastStep) {
      const ok = await this.registrationInstance?.helpers.finalizeRegistration();
      if (ok && registrationState.flowResponse) {
        registrationStore.getRootComponentRef()?.onComplete(registrationState.flowResponse);
      }
    } else {
      registrationStore.getRootComponentRef()?.advanceToNextStep();
    }
  }

  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  render() {
    if (this.uiState === "loading") {
      return (
        <Host class={this.componentClassName}>
          <u-spinner />
        </Host>
      );
    }

    if (this.uiState === "match-found") {
      return (
        <Host class={this.componentClassName}>
          <section aria-label={t("registration.internal_matching.match_found_title")}>
            <p aria-live="polite">{t("registration.internal_matching.match_found_title")}</p>
            <p>{t("registration.internal_matching.match_found_description")}</p>

            {this.hasSlot ? (
              <slot name="match-preview" />
            ) : (
              <ul aria-label={t("registration.internal_matching.match_found_description")}>
                <li>
                  <span>{t("registration.internal_matching.preview_email")}</span> <span>{this.matchedEmailMasked}</span>
                </li>
                {this.matchedCreatedAt && (
                  <li>
                    <span>{t("registration.internal_matching.preview_created_at")}</span>{" "}
                    <span>{this.formatDate(this.matchedCreatedAt)}</span>
                  </li>
                )}
              </ul>
            )}

            <p>{t("registration.internal_matching.match_confirm_question")}</p>

            {this.error && (
              <div role="alert" class={this.errorClassName}>
                {this.error}
              </div>
            )}

            <button
              type="button"
              class={this.primaryButtonClassName}
              disabled={this.submitting}
              onClick={() => this.handleConfirmMatch()}
              aria-busy={String(this.submitting)}
            >
              {this.submitting ? t("registration.internal_matching.confirming") : t("registration.internal_matching.confirm_button")}
            </button>

            <button
              type="button"
              class={this.secondaryButtonClassName}
              disabled={this.submitting}
              onClick={() => this.handleSkip()}
              aria-busy={String(this.submitting)}
            >
              {this.submitting ? t("registration.internal_matching.rejecting") : t("registration.internal_matching.reject_button")}
            </button>
          </section>
        </Host>
      );
    }

    // Form state
    return (
      <Host class={this.componentClassName}>
        <form
          aria-label={this.primaryLabel || t("registration.internal_matching.default_primary_label")}
          onSubmit={(e) => {
            e.preventDefault();
            void this.handleCheckMatch();
          }}
        >
          <div>
            <label htmlFor="u-im-primary-field">{this.primaryLabel}</label>
            <input
              id="u-im-primary-field"
              type={this.primaryFormat}
              class={this.inputClassName}
              value={this.matchingValue}
              disabled={this.submitting}
              required
              aria-required="true"
              aria-describedby={this.error ? "u-im-error" : undefined}
              onInput={(e) => {
                this.matchingValue = (e.target as HTMLInputElement).value;
              }}
            />
          </div>

          {this.additionalFields.map((field) => (
            <div key={field.name}>
              <label htmlFor={`u-im-field-${field.name}`}>{field.label}</label>
              <input
                id={`u-im-field-${field.name}`}
                type={field.format === "date" ? "date" : "text"}
                class={this.inputClassName}
                value={this.additionalValues[field.name] ?? ""}
                disabled={this.submitting}
                required
                aria-required="true"
                aria-describedby={this.error ? "u-im-error" : undefined}
                onInput={(e) => {
                  this.additionalValues = {
                    ...this.additionalValues,
                    [field.name]: (e.target as HTMLInputElement).value,
                  };
                }}
              />
            </div>
          ))}

          {this.error && (
            <div id="u-im-error" role="alert" class={this.errorClassName}>
              {this.error}
            </div>
          )}

          <button type="submit" class={this.primaryButtonClassName} disabled={this.submitting} aria-busy={String(this.submitting)}>
            {this.submitting ? t("registration.internal_matching.checking") : t("registration.internal_matching.check_button")}
          </button>

          <button
            type="button"
            class={this.secondaryButtonClassName}
            disabled={this.submitting}
            onClick={() => this.handleSkip()}
            aria-busy={String(this.submitting)}
          >
            {this.submitting ? t("registration.internal_matching.skipping") : t("registration.internal_matching.skip_button")}
          </button>
        </form>
      </Host>
    );
  }
}
