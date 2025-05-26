import type { UnidyAuthConfig, UnidyAuthOptions, UnidyAuthInstance } from "./types";

interface UnidyLoginComponent extends HTMLElement {
  auth: () => void;
  logout: () => void;
  show: () => void;
  hide: () => void;
}

const UNIDY_ID_TOKEN = "UnidyIdToken";

export class Auth implements UnidyAuthInstance {
  private baseUrl: string;
  private config: UnidyAuthConfig;
  private options: UnidyAuthOptions;
  private component: UnidyLoginComponent;
  private isInitialized = false;

  constructor(baseUrl: string, config: UnidyAuthConfig, options: UnidyAuthOptions = {}) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.options = options;
    this.component = document.createElement("unidy-login");
  }

  private async initialize() {
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

  async auth() {
    await this.initialize();
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
    this.options.onClose();
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem(UNIDY_ID_TOKEN);
  }

  getIdToken(): string | null {
    return sessionStorage.getItem(UNIDY_ID_TOKEN);
  }

  private initEventListeners() {
    this.component.addEventListener("onAuth", (event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        sessionStorage.setItem(UNIDY_ID_TOKEN, token);
        this.options.onAuth?.(token);
      }
    });

    this.component.addEventListener("onClose", () => {
      this.options.onClose?.();
    });
  }
}
