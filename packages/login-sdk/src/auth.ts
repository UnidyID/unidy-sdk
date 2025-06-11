import { jwtDecode } from "jwt-decode";

export interface UnidyAuthConfig {
  clientId: string;
  scope?: string;
  responseType?: string;
  prompt?: string;
  redirectUrl?: string;
  storeTokenInSession: boolean;
  onAuth?: (token: string) => void;
}

const UNIDY_ID_TOKEN = "UnidyIDToken";

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
  public readonly component: HTMLUnidyLoginElement;
  private isInitialized = false;
  private storeToken = true;

  constructor(baseUrl: string, config: UnidyAuthConfig) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.component = document.createElement("unidy-login");
    this.storeToken = config.storeTokenInSession;
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

  async auth(silent = false) {
    if (!silent) {
      this.show();
    }

    return this.component.auth(silent);
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
    if (!this.storeToken) {
      return null;
    }

    return sessionStorage.getItem(UNIDY_ID_TOKEN);
  }

  isAuthenticated(token_: string = null): boolean {
    const token = this.idToken || token_;
    if (!token) return false;

    try {
      const payload = this.parseTokenPayload();
      if (!payload) return false;

      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  parseTokenPayload(token_: string = null): TokenPayload | null {
    const token = this.idToken || token_;
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
        if (this.storeToken) {
          sessionStorage.setItem(UNIDY_ID_TOKEN, token);
        }

        this.config.onAuth?.(token);
        return true;
      }

      console.log("ID Token expired");
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
  }
}
