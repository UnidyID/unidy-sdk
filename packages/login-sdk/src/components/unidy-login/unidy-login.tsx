import { Component, h, Prop, State, Element, Method, Event, type EventEmitter } from "@stencil/core";

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

  @State() iframeUrl = "";
  @State() isLoading = false;
  @State() popupWindow: Window | null = null;

  @Event() onAuth: EventEmitter<{ token: string }>;
  @Event() onClose: EventEmitter<void>;

  private dialog?: HTMLDialogElement;
  private popupCheckInterval?: number;

  componentDidLoad() {
    this.dialog = this.el.shadowRoot.querySelector("dialog") as HTMLDialogElement;
  }

  connectedCallback() {
    window.addEventListener("message", this.handleIframeMessage.bind(this));
  }

  @Method()
  async auth() {
    this.setAuthorizeUrl();
  }

  @Method()
  async logout() {
    this.iframeUrl = `${this.baseUrl}/oauth/logout`;
  }

  @Method()
  async show() {
    this.dialog.showModal();
  }

  @Method()
  async hide() {
    this.dialog.close();
    this.isLoading = false;
    this.onClose.emit();
  }

  private setAuthorizeUrl() {
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
      const token = this.tryExtractToken(iframe.contentWindow?.location.href);

      if (token) {
        this.dialog.close();
        this.isLoading = false;
        this.onAuth.emit({ token });
      }
    } catch (error) {
      // Different origin location access blocked, this is expected but would still like to avoid this
      console.debug("Cross-origin iframe error:", error);
    }
  }

  private handleIframeMessage(event: MessageEvent) {
    if (event.source !== this.el.shadowRoot?.querySelector("iframe")?.contentWindow) {
      return;
    }

    if (event.data?.type === "SOCIAL_LOGIN_STARTED") {
      const { url } = event.data;

      this.openPopupWithForm(url);
    }
  }

  private openPopupWithForm(url: string) {
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    this.popupWindow = window.open(
      url,
      "Unidy",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`,
    );

    this.dialog.close();
    this.startPopupTokenCheck();
  }

  private startPopupTokenCheck() {
    this.popupCheckInterval = window.setInterval(() => {
      try {
        const token = this.tryExtractToken(this.popupWindow.location.href);

        if (token) {
          this.popupWindow.close();

          clearInterval(this.popupCheckInterval);
          this.popupCheckInterval = undefined;

          this.onAuth.emit({ token });
        }
      } catch (error) {
        console.debug("Cross-origin error:", error);
      }
    }, 100);
  }

  private tryExtractToken(windowHref: string) {
    const url = new URL(windowHref);

    if (url.origin === window.location.origin) {
      const token = url.hash
        .substring(1)
        .split("&")
        .find((param) => param.startsWith("id_token="))
        ?.split("=")[1];
      return token;
    }
  }

  render() {
    return (
      <dialog class="unidy-dialog">
        <div class="dialog-content">
          <button type="button" class="close-button" onClick={() => this.hide()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Close">
              <title>Close</title>
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
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
