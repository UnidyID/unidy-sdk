import { jwtDecode } from "jwt-decode";

export interface UnidyAuthConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  redirectUrl?: string;
  onAuth?: (token: string) => void;
  onClose?: () => void;
}

const UNIDY_ID_TOKEN = "UnidyIdToken";

interface TokenPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  [key: string]: string | number | boolean | undefined;
}

export class Auth {
  private baseUrl: string;
  private config: UnidyAuthConfig;
  private component: HTMLUnidyLoginElement;
  private isInitialized = false;

  constructor(baseUrl: string, config: UnidyAuthConfig) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.component = document.createElement("unidy-login");
  }

  mountComponent() {
    if (this.isInitialized) return;

    Object.assign(this.component, {
      baseUrl: this.baseUrl,
      clientId: this.config.clientId,
      scope: this.config.scope,
      responseType: this.config.responseType,
      prompt: this.config.prompt,
      redirectUrl: this.config.redirectUrl,
    });

    this.initEventListeners();

    document.body.appendChild(this.component);

    this.isInitialized = true;
  }

  auth(trySilentAuth = false) {
    this.component.auth(trySilentAuth);
  }

  logout() {
    sessionStorage.removeItem(UNIDY_ID_TOKEN);
    this.component.logout();
  }

  show() {
    this.component.show();
  }

  hide() {
    this.component.hide();
  }

  get idToken(): string | null {
    return sessionStorage.getItem(UNIDY_ID_TOKEN);
  }

  get isAuthenticated(): boolean {
    const token = this.idToken;
    if (!token) return false;

    try {
      const payload = this.parseTokenPayload();
      if (!payload) return false;

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  private parseTokenPayload(): TokenPayload | null {
    const token = this.idToken;
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error("Failed to parse token:", error);
      return null;
    }
  }

  private validateAndStoreToken(token: string): boolean {
    try {
      const payload = jwtDecode<TokenPayload>(token);
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp > now) {
        sessionStorage.setItem(UNIDY_ID_TOKEN, token);
        this.config.onAuth?.(token);
        return true;
      }

      console.warn("Token expired");
      return false;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }

  private initEventListeners() {
    this.component.addEventListener("onAuth", (event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        this.validateAndStoreToken(token);
      }
    });

    this.component.addEventListener("onClose", () => {
      this.config.onClose?.();
    });
  }
}
