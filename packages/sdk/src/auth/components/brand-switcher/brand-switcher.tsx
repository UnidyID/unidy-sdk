import { Component, Event, type EventEmitter, Host, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import type { Brand } from "../../api/auth";
import { authState, authStore } from "../../store/auth-store";

export interface BrandSelectedEvent {
  brand: Brand;
}

/**
 * Lists the other brands the signing-in user has an account on, so they can continue there instead.
 *
 * A brand is a separate login host, so switching is a navigation to that brand's `url` — the backend
 * derives the brand from the host it is called on. Place this inside the `<u-signin-step>` you want it
 * to appear in; the step controls visibility.
 */
@Component({
  tag: "u-brand-switcher",
  styleUrl: "brand-switcher.css",
  shadow: false,
})
export class BrandSwitcher extends UnidyComponent() {
  /** CSS classes to apply to the wrapper element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** CSS classes to apply to each brand link. */
  @Prop({ attribute: "item-class-name" }) itemClassName = "";
  /** CSS classes to apply to the heading. */
  @Prop({ attribute: "heading-class-name" }) headingClassName = "";
  /** If true, also lists the brand the user is currently on, turning this into a full brand selector. */
  @Prop() showCurrent = false;
  /** If true, renders brand names without their logos. */
  @Prop() hideLogos = false;

  /**
   * Fired when a brand is chosen, before navigating to it. Call `preventDefault()` on the event to
   * suppress the navigation and route to the brand yourself.
   */
  @Event({ cancelable: true }) brandSelected!: EventEmitter<BrandSelectedEvent>;

  private get brands(): Brand[] {
    // On the email step no user has been looked up yet, so any brands still in the store belong to a
    // previous lookup.
    if (authState.step === "email") return [];

    return this.showCurrent ? authState.brands : authStore.otherBrands;
  }

  private onSelect = (event: MouseEvent, brand: Brand) => {
    const emitted = this.brandSelected.emit({ brand });

    if (emitted.defaultPrevented) {
      event.preventDefault();
    }
  };

  // Decorative only - the brand name next to it carries the meaning.
  private renderLogo(brand: Brand) {
    if (this.hideLogos || !brand.logo_url) return null;

    return <img src={brand.logo_url} alt="" aria-hidden="true" class="u:size-8 u:shrink-0 u:object-contain" />;
  }

  render() {
    const brands = this.brands;

    if (brands.length === 0) return null;

    return (
      <Host class="u:block">
        <div class={this.componentClassName}>
          <slot name="heading">
            <p class={this.headingClassName}>{t("auth.brands.other_accounts")}</p>
          </slot>

          {/* Named on the list itself rather than via aria-labelledby, so a slotted heading cannot
              leave a dangling IDREF. */}
          <ul aria-label={t("auth.brands.other_accounts")} class="u:m-0 u:flex u:list-none u:flex-col u:gap-2 u:p-0">
            {brands.map((brand) => (
              <li key={brand.name}>
                <a
                  href={brand.url}
                  class={`u:flex u:items-center u:gap-2 u:no-underline u:focus-visible:outline-2 u:focus-visible:outline-offset-2 ${this.itemClassName}`}
                  aria-label={t("auth.brands.continue_on", { brand: brand.display_name })}
                  aria-current={brand.current ? "true" : null}
                  onClick={(event) => this.onSelect(event, brand)}
                  part="brand-switcher-link"
                >
                  {this.renderLogo(brand)}
                  <span part="brand-switcher-name">{brand.display_name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Host>
    );
  }
}
