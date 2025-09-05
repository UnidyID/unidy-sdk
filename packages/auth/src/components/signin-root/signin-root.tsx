import { Component, Host, h, Prop, Event, type EventEmitter } from "@stencil/core";
import { type TokenResponse, UnidyClient } from "@unidy.io/sdk-api-client";
import { authStore } from "../../store/auth-store.js";
import { Auth } from "../../auth.js";

@Component({
  tag: "signin-root",
  shadow: false,
})
export class SigninRoot {
  @Prop() baseUrl = "";
  @Prop() apiKey = "";
  @Prop() className = "";

  @Event() authEvent!: EventEmitter<TokenResponse>;
  @Event() errorEvent!: EventEmitter<string>;

  componentWillLoad() {
    if (this.baseUrl && this.apiKey) {
      const client = new UnidyClient(this.baseUrl, this.apiKey);
      Auth.initialize(client);
    }
  }

  componentDidLoad() {
    authStore.setRootComponentRef(this);
  }

  onAuth(response: TokenResponse) {
    this.authEvent.emit(response);
  }

  onError(error: string) {
    this.errorEvent.emit(error);
  }

  render() {
    return (
      <Host class={this.className} style={{ width: "100%" }}>
        <slot />
      </Host>
    );
  }
}
