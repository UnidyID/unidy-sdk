import { Component, Element, Event, type EventEmitter, h, Host, Method, Prop, Watch } from "@stencil/core";
import { OAuthHelper } from "../../helpers";
import type { OAuthApplication } from "../../api/oauth";

export interface OAuthSuccessEvent {
  token: string;
  application: OAuthApplication;
  redirectUrl: string;
}

export interface OAuthErrorEvent {
  error: string;
  errorIdentifier?: string;
}

@Component({
  tag: "u-oauth-provider",
  shadow: false,
})
export class OAuthProvider {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "client-id" }) clientId!: string;
  @Prop() scopes?: string;
  @Prop({ attribute: "redirect-uri" }) redirectUri?: string;
  @Prop() newtab = false;
  @Prop({ attribute: "auto-redirect" }) autoRedirect = true;

  @Event() oauthSuccess!: EventEmitter<OAuthSuccessEvent>;
  @Event() oauthError!: EventEmitter<OAuthErrorEvent>;
  @Event() oauthCancel!: EventEmitter<void>;

  private helper!: OAuthHelper;

  @Watch("clientId")
  watchClientId(newValue: string) {
    this.helper.updateConfig({ clientId: newValue });
  }

  @Watch("scopes")
  watchScopes(newValue: string | undefined) {
    this.helper.updateConfig({ scopes: newValue });
  }

  @Watch("redirectUri")
  watchRedirectUri(newValue: string | undefined) {
    this.helper.updateConfig({ redirectUri: newValue });
  }

  @Watch("newtab")
  watchNewtab(newValue: boolean) {
    this.helper.updateConfig({ newtab: newValue });
  }

  componentWillLoad() {
    this.helper = new OAuthHelper(
      {
        clientId: this.clientId,
        scopes: this.scopes,
        redirectUri: this.redirectUri,
        newtab: this.newtab,
        autoRedirect: this.autoRedirect,
      },
      {
        onSuccess: (data) => this.oauthSuccess.emit(data),
        onError: (data) => this.oauthError.emit(data),
        onCancel: () => this.oauthCancel.emit(),
      }
    );
    this.helper.initialize();
  }

  disconnectedCallback() {
    this.helper.cleanup();
  }

  @Method()
  async connect(): Promise<void> {
    await this.helper.connect();
  }

  @Method()
  async submit(): Promise<void> {
    await this.helper.submit();
  }

  @Method()
  async cancel(): Promise<void> {
    this.helper.cancel();
  }

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
