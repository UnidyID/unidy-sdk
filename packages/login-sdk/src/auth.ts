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

export const UNIDY_ID_TOKEN_SESSION_KEY = "unidy_id_token";

interface TokenPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  [key: string]: string | number | boolean | undefined;
}

export class Auth {
  public readonly baseUrl: string;
  public readonly config: UnidyAuthConfig;
  public readonly component: HTMLUnidyLoginElement;
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

    this.component.addEventListener("onAuth", (event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        this.validateAndStoreToken(token);
      }
    });

    document.body.appendChild(this.component);

    this.isInitialized = true;
  }

  async auth(silent = false) {
    if (!silent) {
      await this.show();
    }

    return this.component.auth(silent);
  }

  async logout() {
    sessionStorage.removeItem(UNIDY_ID_TOKEN_SESSION_KEY);

    return this.component.logout();
  }

  async show() {
    return this.component.show();
  }

  async hide() {
    return this.component.hide();
  }

  get idToken(): string | null {
    if (!this.config.storeTokenInSession) {
      return null;
    }

    return sessionStorage.getItem(UNIDY_ID_TOKEN_SESSION_KEY);
  }

  async isAuthenticated(token_: string | null = null, fallbackToSilentAuthRequest = false): Promise<boolean> {
    let token = token_ || this.idToken;

    if (!token && fallbackToSilentAuthRequest) {
      const res = await this.component.auth(true);

      if (res.success) {
        token = res.token;
      } else {
        return false;
      }
    } else {
      return false;
    }

    return Auth.validateToken(token);
  }

  userTokenData(token_: string | null = null): TokenPayload | null {
    const token = token_ || this.idToken;

    if (!token) return null;
    if (!Auth.validateToken(token)) return null;

    return Auth.safeParseToken(token);
  }

  static safeParseToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error("Failed to parse token:", error);
      return null;
    }
  }

  static validateToken(token: string) {
    try {
      const payload = Auth.safeParseToken(token);
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp > now) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }

  private validateAndStoreToken(token: string): boolean {
    const tokenValid = Auth.validateToken(token);

    if (!tokenValid) {
      return;
    }

    if (this.config.storeTokenInSession) {
      sessionStorage.setItem(UNIDY_ID_TOKEN_SESSION_KEY, token);
    }
    this.config.onAuth?.(token);
  }
}
