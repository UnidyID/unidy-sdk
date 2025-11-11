import { Component, Host, h, Prop, Event, type EventEmitter } from "@stencil/core";
import type { TokenResponse } from "@unidy.io/sdk-api-client";
import { authStore } from "../../store/auth-store.js";

@Component({
  tag: "u-signin-root",
  shadow: true,
})
export class SigninRoot {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @Event() authEvent!: EventEmitter<TokenResponse>;
  @Event() errorEvent!: EventEmitter<{ error: string }>;

  componentDidLoad() {
    authStore.setRootComponentRef(this);
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
