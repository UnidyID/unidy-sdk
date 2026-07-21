import { Component, Event, type EventEmitter, Host, h, Prop } from "@stencil/core";
import { UnidyComponent } from "../../../shared/base/component";
import type { TokenResponse } from "../../api/auth";
import { authStore, onChange } from "../../store/auth-store";

@Component({
  tag: "u-signin-root",
  shadow: false,
})
export class SigninRoot extends UnidyComponent() {
  /** CSS classes to apply to the host element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /** Fired on successful authentication. Contains the JWT and refresh token. */
  @Event() authEvent!: EventEmitter<TokenResponse>;
  /** Fired on authentication failure. Contains the error code. */
  @Event() errorEvent!: EventEmitter<{ error: string }>;

  private cleanups: (() => void)[] = [];

  connectedCallback() {
    // Re-apply the initial step after logout so the modal doesn't render empty
    // when the component stays mounted or is re-inserted after a logout.
    this.cleanups.push(
      onChange("authenticated", (authenticated) => {
        if (!authenticated) this.applyInitialStep();
      }),
    );
  }

  componentDidLoad() {
    authStore.setRootComponentRef(this);
    this.applyInitialStep();
  }

  disconnectedCallback() {
    for (const unsub of this.cleanups) unsub();
    this.cleanups = [];
  }

  private applyInitialStep() {
    const signInSteps = this.element.querySelectorAll("u-signin-step").values();
    if ([...signInSteps].some((step: HTMLUSigninStepElement) => step.name === "single-login")) {
      authStore.setInitialStep("single-login");
    } else {
      authStore.setInitialStep("email");
    }
  }

  onAuth(response: TokenResponse) {
    this.authEvent.emit(response);
  }

  onError(error: string) {
    this.errorEvent.emit({ error: error });
  }

  render() {
    const shouldShow = !authStore.state.authenticated;

    return (
      <Host
        class={this.componentClassName}
        hidden={!shouldShow}
        style={{ display: shouldShow ? undefined : "none" }}
        aria-hidden={!shouldShow ? "true" : null}
        aria-live="polite"
      >
        <slot />
      </Host>
    );
  }
}
