import { Component, Event, type EventEmitter, Host, h, Prop } from "@stencil/core";
import { UnidyComponent } from "../../../shared/base/component";
import type { TokenResponse } from "../../api/auth";
import { authStore } from "../../store/auth-store";

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

  componentDidLoad() {
    authStore.setRootComponentRef(this);

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
