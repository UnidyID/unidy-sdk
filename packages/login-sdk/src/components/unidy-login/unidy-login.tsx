import { Component, h, Prop, State, Element, Method, Event, type EventEmitter } from "@stencil/core";
import { Utils } from "../../utils";

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

      const token = Utils.extractUrlParam(href, "id_token");

      if (token) {
        this.dialog.close();
        this.handleSuccessfulAuth(token);
      } else {
        const error_msg = Utils.extractUrlParam(href, "error") ?? "No token received";
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

        const token = Utils.extractUrlParam(this.popupWindow.location.href, "id_token");
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
    this.authEvent.emit({ token });

    this.authPromise?.resolve({ success: true, token });
    this.authPromise = null;
  }

  private setDialogRef = (el: HTMLDialogElement) => {
    this.dialog = el;
  };

  render() {
    return (
      <dialog
        class="m-auto p-0 border-none rounded-lg bg-transparent overflow-hidden"
        ref={(el) => this.setDialogRef(el as HTMLDialogElement)}
      >
        <div class="relative w-full h-full min-w-[320px] overflow-hidden">
          <button
            type="button"
            class="absolute top-2 right-2 w-7 h-7 border-none rounded-full bg-black/5 text-gray-600 cursor-pointer flex items-center justify-center transition-colors hover:bg-black/20"
            onClick={() => this.hide()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Close">
              <title>Close</title>
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          {this.isLoading && (
            <div class="absolute inset-0 bg-white z-[2]">
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] flex items-center justify-center">
                {/* biome-ignore lint/a11y/useSemanticElements: <explanation> */}
                <svg class="w-9 h-9 animate-[rotate_2s_linear_infinite]" viewBox="0 0 50 50" role="status" aria-label="Loading">
                  <circle class="stroke-gray-300 opacity-25" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
                  <circle
                    class="stroke-gray-600 stroke-round animate-[dash_1.5s_ease-in-out_infinite]"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke-width="5"
                  />
                </svg>
              </div>
            </div>
          )}

          {this.popupWindow && (
            <div class="absolute inset-0 bg-black/85 z-10 flex items-center justify-center rounded-lg">
              <h2 class="text-white font-semibold text-xl m-0 text-center px-5">Continue in popup window</h2>
            </div>
          )}

          <iframe
            src={this.iframeUrl}
            onLoad={(e) => this.handleIframeLoad(e)}
            id="unidy-login-iframe"
            class="w-full h-full border-none rounded-lg bg-white overflow-hidden block"
            title="Unidy Login"
          />
        </div>
      </dialog>
    );
  }
}
