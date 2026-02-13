import { Component, Element, h, Prop, State, Watch } from "@stencil/core";
import type { CaptchaFeature } from "../../captcha";
import { captchaManager } from "../../captcha";
import { unidyState, onChange } from "../../store/unidy-store";

/**
 * Captcha field component that renders a captcha widget when required
 *
 * Usage:
 * ```html
 * <u-captcha-field feature="login"></u-captcha-field>
 * ```
 *
 * The component automatically:
 * - Hides itself when captcha is not configured or not enabled for the feature
 * - Shows a widget for challenge-based providers (Turnstile, hCaptcha, Friendly Captcha)
 * - Is invisible for reCAPTCHA v3 (score-based)
 */
@Component({
  tag: "u-captcha-field",
  styleUrl: "captcha-field.css",
  shadow: false,
})
export class CaptchaField {
  @Element() el!: HTMLElement;

  /** The feature this captcha protects (login, registration, newsletter) */
  @Prop() feature: CaptchaFeature = "login";

  /** Custom CSS class for the container */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /** Accessible label for the captcha */
  @Prop() ariaLabel = "Security verification";

  @State() isVisible = false;
  @State() isLoading = true;
  @State() hasError = false;

  private containerRef: HTMLDivElement | null = null;
  private unsubscribe: (() => void) | null = null;

  componentWillLoad() {
    this.updateVisibility();

    // Subscribe to captcha config changes
    this.unsubscribe = onChange("captchaConfig", () => {
      this.updateVisibility();
    });
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  @Watch("feature")
  onFeatureChange() {
    this.updateVisibility();
  }

  private updateVisibility() {
    const config = unidyState.captchaConfig;

    if (!config) {
      this.isVisible = false;
      this.isLoading = false;
      return;
    }

    // Check if captcha is enabled for this feature
    const isEnabled = captchaManager.isEnabledForFeature(this.feature);

    // reCAPTCHA v3 is invisible, no widget needed
    const requiresWidget = captchaManager.requiresWidget();

    this.isVisible = isEnabled && requiresWidget;
    this.isLoading = this.isVisible && !captchaManager.isReady();

    // Render widget if visible and ready
    if (this.isVisible && captchaManager.isReady() && this.containerRef) {
      this.renderWidget();
    }
  }

  private async renderWidget() {
    if (!this.containerRef) return;

    try {
      // Ensure provider is initialized
      await captchaManager.initialize();
      captchaManager.render(this.containerRef);
      this.isLoading = false;
      this.hasError = false;
    } catch (error) {
      console.error("Failed to render captcha widget:", error);
      this.hasError = true;
      this.isLoading = false;
    }
  }

  private handleContainerRef = (el: HTMLDivElement | null) => {
    this.containerRef = el;

    if (el && this.isVisible && captchaManager.isReady()) {
      this.renderWidget();
    }
  };

  render() {
    if (!this.isVisible) {
      return null;
    }

    return (
      <div class={`u-captcha-field ${this.componentClassName}`} role="group" aria-label={this.ariaLabel}>
        {this.isLoading && (
          <div class="u-captcha-loading" aria-live="polite">
            <span class="u:sr-only">Loading security verification...</span>
            <div class="u-captcha-spinner" aria-hidden="true" />
          </div>
        )}

        {this.hasError && (
          <div class="u-captcha-error" role="alert">
            <span>Failed to load captcha. Please refresh the page.</span>
          </div>
        )}

        <div ref={this.handleContainerRef} class={`u-captcha-container ${this.isLoading ? "u:hidden" : ""}`} aria-hidden={this.isLoading} />
      </div>
    );
  }
}
