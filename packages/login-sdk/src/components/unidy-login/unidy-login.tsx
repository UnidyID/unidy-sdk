import { Component, h, Prop, State, Listen, Element, Method, Event, type EventEmitter } from "@stencil/core";

@Component({
  tag: "unidy-login",
  styleUrl: "unidy-login.css",
  shadow: true,
})
export class UnidyLogin {
  @Element() el!: HTMLElement;

  @Prop() baseUrl = "";
  @Prop() clientId = "";
  @Prop() scope = "openid email";
  @Prop() responseType = "id_token";
  @Prop() prompt = "login";

  @State() isVisible = false;
  @State() iframeUrl = "";
  @State() isLoading = false;

  @Event() onAuth: EventEmitter<{ token: string }>;
  @Event() onClose: EventEmitter<void>;

  private dialog?: HTMLDialogElement;

  @Listen("keydown", { target: "document" })
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isVisible) {
      this.hide();
    }
  }

  componentDidLoad() {
    this.dialog = this.el.shadowRoot.querySelector("dialog") as HTMLDialogElement;
  }

  @Method()
  async auth() {
    this.setIframeUrl();
    this.show();
  }

  @Method()
  async logout() {
    this.iframeUrl = `${this.baseUrl}/oauth/logout`;
  }

  @Method()
  async show() {
    this.dialog.showModal();
    this.isVisible = true;
  }

  @Method()
  async hide() {
    this.dialog.close();
    this.isVisible = false;
    this.isLoading = false;
    this.onClose.emit();
  }

  private setIframeUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scope,
      response_type: this.responseType,
      prompt: this.prompt,
      redirect_uri: window.location.origin,
    });

    const url = `${this.baseUrl}/oauth/authorize?${params.toString()}`;

    if (url !== this.iframeUrl) {
      this.iframeUrl = url;
      this.isLoading = true;
    }
  }

  private handleIframeLoad(event: Event) {
    const iframe = event.target as HTMLIFrameElement;
    this.isLoading = false;

    try {
      const iframeUrl = iframe.contentWindow?.location.href;

      if (iframeUrl) {
        const url = new URL(iframeUrl);

        // Redirect url has same origin
        if (url.origin === window.location.origin) {
          const token = url.hash
            .substring(1)
            .split("&")
            .find((param) => param.startsWith("id_token="))
            ?.split("=")[1];

          if (token) {
            this.hide();
            this.onAuth.emit({ token });
          }
        }
      }
    } catch (error) {
      // Different origin location access blocked, this is expected but would still like to avoid this...
      console.debug("Cross-origin iframe error:", error);
    }
  }

  render() {
    return (
      <dialog class="unidy-dialog">
        <div class="dialog-content">
          <button type="button" class="close-button" onClick={() => this.hide()}>
            ×
          </button>

          {this.isLoading && (
            <div class="loading-spinner">
              <svg class="spinner" viewBox="0 0 50 50" role="status" aria-label="Loading">
                <circle class="spinner-circle" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
                <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
              </svg>
            </div>
          )}

          <iframe
            src={this.iframeUrl}
            onLoad={(e) => this.handleIframeLoad(e)}
            id="unidy-login-iframe"
            class="login-iframe"
            title="Unidy Login"
          />
        </div>
      </dialog>
    );
  }
}
