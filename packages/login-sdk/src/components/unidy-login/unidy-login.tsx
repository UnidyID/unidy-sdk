import { Component, h, Prop, State, Element, Method, Event, type EventEmitter } from "@stencil/core";

export type PromptOption = "none" | "login" | "consent" | "select_account" | null;
export type ResponseType = "code" | "id_token" | "token";

export type AuthResult = { success: true; token: string } | { success: false; error: string };
export type LogoutResult = { success: boolean };

@Component({
  tag: "unidy-login",
  styleUrl: "unidy-login.css",
  shadow: true,
})
export class UnidyLogin {
  @Element() el!: HTMLElement;

  /** The base URL of the Unidy authentication server, example: https://your-domain.unidy.de */
  @Prop() baseUrl!: string;
  /** The client ID for the application */
  @Prop() clientId!: string;
  /** The OAuth scopes to request, defaults to "openid email" */
  @Prop() scope = "openid email";
  /** The OAuth response type, defaults to "id_token" */
  @Prop() responseType: ResponseType = "id_token";
  /** The prompt option for authentication, can be "none", "login", "consent", "select_account" or null */
  @Prop() prompt: PromptOption = null;
  /** The URL to redirect to after authentication, defaults to current origin */
  @Prop() redirectUrl = window.location.origin;

  @State() iframeUrl = "";
  @State() isLoading = false;
  @State() popupWindow: Window | null = null;

  @Event() authEvent!: EventEmitter<{ token: string }>;

  private dialog!: HTMLDialogElement;
  private popupCheckInterval?: number;
  private authPromise: {
    promise: Promise<AuthResult>;
    resolve: (result: AuthResult) => void;
    reject: (reason?: unknown) => void;
  } | null = null;
  private logoutPromise: {
    promise: Promise<LogoutResult>;
    resolve: (result: LogoutResult) => void;
    reject: (reason?: unknown) => void;
  } | null = null;

  connectedCallback() {
    window.addEventListener("message", this.handleIframeMessage.bind(this));
  }

  /**
   * Initiates the authentication process
   *
   * @param options - Options for the authentication process
   * @param options.trySilentAuth - Whether to attempt silent authentication without showing UI (defaults to false)
   * @returns Promise that resolves with authentication result containing success status and token or error
   *
   * @example
   * ```typescript
   * // Default authentication, using the prompt prop
   * const result = await component.auth();
   *
   * // Silent authentication, will override the prompt prop with 'none'
   * const result = await component.auth({ trySilentAuth: true });
   *
   * if (result.success) {
   *   console.log('Token:', result.token);
   * } else {
   *   console.error('Auth failed:', result.error);
   * }
   * ```
   */
  @Method()
  async auth({ trySilentAuth = false }: { trySilentAuth?: boolean } = {}): Promise<AuthResult> {
    const token = this.extractParam(window.location.href, "id_token");
    if (token) {
      const result = { success: true, token } as const;
      this.handleSuccessfulAuth(token);
      return result;
    }

    if (this.authPromise) {
      return this.authPromise.promise;
    }

    this.authPromise = Promise.withResolvers<AuthResult>();

    const prompt = trySilentAuth ? "none" : this.prompt;
    this.setAuthorizeUrl(prompt);

    return this.authPromise.promise;
  }

  /**
   * Logs out the current user and clears any stored session data.
   *
   * @returns Promise that resolves with logout result indicating success status
   *
   * @example
   * ```typescript
   * const result = await component.logout();
   *
   * if (result.success) {
   *   console.log('Successfully logged out');
   * }
   * ```
   */
  @Method()
  async logout(): Promise<LogoutResult> {
    if (this.logoutPromise) {
      console.warn("Logout already in progress");
      return this.logoutPromise.promise;
    }

    this.logoutPromise = Promise.withResolvers<LogoutResult>();

    this.iframeUrl = `${this.baseUrl}/oauth/logout`;

    return this.logoutPromise.promise;
  }

  /**
   * Shows the authentication dialog modal to the user.
   *
   * @returns Promise that resolves when the dialog is shown
   *
   * @example
   * ```typescript
   * await component.show();
   * ```
   */
  @Method()
  async show() {
    this.dialog.showModal();
  }

  /**
   * Hides the authentication dialog modal.
   *
   * @returns Promise that resolves when the dialog is hidden
   *
   * @example
   * ```typescript
   * await component.hide();
   * ```
   */
  @Method()
  async hide() {
    this.dialog.close();
  }

  private setAuthorizeUrl(prompt: PromptOption = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scope,
      response_type: this.responseType,
      redirect_uri: this.redirectUrl,
    });

    if (prompt) {
      params.append("prompt", prompt);
    }

    const url = `${this.baseUrl}/oauth/authorize?${params.toString()}`;

    if (url !== this.iframeUrl) {
      this.iframeUrl = url;
      this.isLoading = true;
    }
  }

  private handleIframeLoad(event: Event) {
    const iframe = event.target as HTMLIFrameElement;
    this.isLoading = false;

    if (iframe.src.includes("oauth/logout")) {
      this.logoutPromise?.resolve({ success: true });
      this.logoutPromise = null;

      return;
    }
    try {
      const href = iframe.contentWindow?.location.href;
      if (!href) return;

      const token = this.extractParam(href, "id_token");

      if (token) {
        this.dialog.close();
        this.handleSuccessfulAuth(token);
      } else {
        const error_msg = this.extractParam(href, "error") ?? "No token received";
        this.authPromise?.resolve({ success: false, error: error_msg });
        this.authPromise = null;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "SecurityError") {
        // Ignore cross-origin errors as they are expected when accessing iframe content
        return;
      }
      console.warn("Unexpected error:", error);
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

    this.startPopupTokenCheck();
  }

  private startPopupTokenCheck() {
    this.popupCheckInterval = window.setInterval(() => {
      try {
        if (this.popupWindow?.closed) {
          this.popupWindow = null;
        }

        if (!this.popupWindow?.location.href) return;

        const token = this.extractParam(this.popupWindow.location.href, "id_token");
        if (!token) return;

        this.cleanupPopup();
        this.dialog.close();
        this.handleSuccessfulAuth(token);
      } catch (error) {
        console.debug("Cross-origin error:", error);
      }
    }, 100);
  }

  private cleanupPopup() {
    this.popupWindow?.close();
    this.popupWindow = null;
    clearInterval(this.popupCheckInterval);
    this.popupCheckInterval = undefined;
  }

  private handleSuccessfulAuth(token: string) {
    this.Auth.emit({ token });

    this.authPromise?.resolve({ success: true, token });
    this.authPromise = null;
  }

  private extractParam(windowHref: string, paramName: string) {
    const url = new URL(windowHref);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    return hashParams.get(paramName);
  }

  private setDialogRef = (el: HTMLDialogElement) => {
    this.dialog = el;
  };

  render() {
    return (
      <dialog class="unidy-dialog" ref={(el) => this.setDialogRef(el as HTMLDialogElement)}>
        <div class="dialog-content">
          <button type="button" class="close-button" onClick={() => this.hide()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Close">
              <title>Close</title>
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          {this.isLoading && (
            <div class="loading-spinner">
              {/* biome-ignore lint/a11y/useSemanticElements: */}
              <svg class="spinner" viewBox="0 0 50 50" role="status" aria-label="Loading">
                <circle class="spinner-circle" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
                <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
              </svg>
            </div>
          )}

          {this.popupWindow && (
            <div class="popup-overlay">
              <h2>Continue in popup window</h2>
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
