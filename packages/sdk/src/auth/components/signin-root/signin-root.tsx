import {Component, Host, h, Prop, Event, type EventEmitter, Element} from "@stencil/core";
import type { TokenResponse } from "../../api/auth";
import { authStore } from "../../store/auth-store";

@Component({
  tag: "u-signin-root",
  shadow: true,
})
export class SigninRoot {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";

  @Event() authEvent!: EventEmitter<TokenResponse>;
  @Event() errorEvent!: EventEmitter<{ error: string }>;

  componentDidLoad() {
    authStore.setRootComponentRef(this);
    const signInSteps = this.el.querySelectorAll("u-signin-step").values();
    if ([...signInSteps].some((step: HTMLUSigninStepElement) => step.name == "single-login")) {
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
    if (authStore.state.authenticated) {
      return null;
    }

    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
