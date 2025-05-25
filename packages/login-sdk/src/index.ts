import type { UnidyAuthConfig, UnidyAuthOptions, UnidyAuthInstance } from "./types";

interface UnidyLoginElement extends HTMLElement {
  show: () => void;
  hide: () => void;
}

// TODO move this out from index.ts

class UnidyAuth implements UnidyAuthInstance {
  private baseUrl: string;
  private config: UnidyAuthConfig;
  private options: UnidyAuthOptions;
  private component: UnidyLoginElement;
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
      maxAge: this.config.maxAge,
    });

    this.component.addEventListener("onAuth", ((event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        sessionStorage.setItem("idToken", token);
        this.options.onAuth?.(token);
      }
    }) as EventListener);

    document.body.appendChild(this.component);
    this.isInitialized = true;
  }

  async show() {
    await this.initialize();
    this.component.show();
  }

  hide() {
    this.component.hide();
    this.options.onClose?.();
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem("idToken");
  }

  getIdToken(): string | null {
    return sessionStorage.getItem("idToken");
  }
}

export const Unidy = {
  auth: (baseUrl: string, config: UnidyAuthConfig, options?: UnidyAuthOptions): UnidyAuthInstance => {
    return new UnidyAuth(baseUrl, config, options);
  },
};
