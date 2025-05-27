export interface UnidyAuthConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  maxAge?: number;
  onAuth?: (token: string) => void;
  onClose?: () => void;
}

const UNIDY_ID_TOKEN = "UnidyIdToken";

export class Auth {
  private baseUrl: string;
  private config: UnidyAuthConfig;
  private component: HTMLUnidyLoginElement;
  private isInitialized = false;

  constructor(baseUrl: string, config: UnidyAuthConfig) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.component = document.createElement("unidy-login");

    this.extractTokenIfPresent();
  }

  auth() {
    this.initAuth();
    this.component.auth();
  }

  logout() {
    this.component.logout();
  }

  show() {
    this.component.show();
  }

  hide() {
    this.component.hide();
    this.config.onClose();
  }

  get isAuthenticated(): boolean {
    return !!sessionStorage.getItem(UNIDY_ID_TOKEN);
  }

  get idToken(): string | null {
    return sessionStorage.getItem(UNIDY_ID_TOKEN);
  }

  private initAuth() {
    if (this.isInitialized) return;

    Object.assign(this.component, {
      baseUrl: this.baseUrl,
      clientId: this.config.clientId,
      scope: this.config.scope,
      responseType: this.config.responseType,
      prompt: this.config.prompt,
    });

    this.initEventListeners();

    document.body.appendChild(this.component);

    this.isInitialized = true;
  }

  private initEventListeners() {
    this.component.addEventListener("onAuth", (event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        sessionStorage.setItem(UNIDY_ID_TOKEN, token);
        this.config.onAuth?.(token);
      }
    });

    this.component.addEventListener("onClose", () => {
      this.config.onClose?.();
    });
  }

  private extractTokenIfPresent() {
    const hash = window.location.hash;
    if (hash) {
      const token = hash
        .substring(1)
        .split("&")
        .find((param) => param.startsWith("id_token="))
        ?.split("=")[1];

      if (token) {
        this.config.onAuth?.(token);
      }
    }
  }

  // TODO silent login
  // check iframe
}
