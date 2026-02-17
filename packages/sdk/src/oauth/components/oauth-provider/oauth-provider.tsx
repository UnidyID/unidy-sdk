import { Component, Element, Event, type EventEmitter, h, Method, Prop, Watch } from "@stencil/core";
import type { OAuthApplication } from "../../api/oauth";
import { OAuthHelper } from "../../helpers";

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

  /** The OAuth application client ID. */
  @Prop({ attribute: "client-id" }) clientId!: string;
  /** Comma-separated list of OAuth scopes to request (e.g., "openid,profile,email"). */
  @Prop() scopes?: string;
  /** The URL to redirect to after authorization. Must match one of the application's allowed redirect URIs. */
  @Prop({ attribute: "redirect-uri" }) redirectUri?: string;
  /** If true, opens the OAuth flow in a new tab instead of the current window. */
  @Prop() newtab = false;
  /** If true, automatically redirects to the authorization URL after successful consent. */
  @Prop({ attribute: "auto-redirect" }) autoRedirect = true;

  /** Fired on successful OAuth authorization. Contains the token, application details, and redirect URL. */
  @Event() oauthSuccess!: EventEmitter<OAuthSuccessEvent>;
  /** Fired when an error occurs during the OAuth flow. Contains the error message and optional identifier. */
  @Event() oauthError!: EventEmitter<OAuthErrorEvent>;
  /** Fired when the user cancels the OAuth consent flow. */
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
      },
    );
    this.helper.initialize();
  }

  disconnectedCallback() {
    this.helper.cleanup();
  }

  /** Initiates the OAuth consent flow by fetching application details and displaying the consent UI. */
  @Method()
  async connect(): Promise<void> {
    await this.helper.connect();
  }

  /** Submits the OAuth consent form, granting authorization to the application. */
  @Method()
  async submit(): Promise<void> {
    await this.helper.submit();
  }

  /** Cancels the OAuth consent flow and emits the oauthCancel event. */
  @Method()
  async cancel(): Promise<void> {
    this.helper.cancel();
  }

  render() {
    return <slot />;
  }
}
