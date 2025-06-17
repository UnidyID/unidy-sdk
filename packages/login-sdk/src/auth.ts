import { jwtDecode } from "jwt-decode";

export interface UnidyAuthConfig<Scope extends string = string> {
  clientId: string;
  scope?: Scope;
  responseType?: string;
  prompt?: string;
  redirectUrl?: string;
  storeTokenInSession?: boolean;
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

export class Auth<
  CustomPayload = Record<string, unknown>,
  Scope extends string = string,
  BasePayload = {
    sub: string;
    exp: number;
    iat: number;
    [key: string]: string | number | boolean | undefined;
  } & (Scope extends `${string}email${string}`
    ? { email: string }
    : // biome-ignore lint/complexity/noBannedTypes: <explanation>
      {}),
> {
  /** The base URL of the Unidy authentication server, example: https://your-domain.unidy.de */
  public readonly baseUrl: string;
  /** Configuration options for the authentication process */
  public readonly config: UnidyAuthConfig<Scope>;
  /** The web component instance which contains the authentication UI and handles the authentication process */
  public readonly component: HTMLUnidyLoginElement;
  /** The state of the initialization process */
  private initState: "loading" | "done" | null = null;

  private storeTokenInSession = true;

  constructor(baseUrl: string, config: UnidyAuthConfig<Scope>) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.component = document.createElement("unidy-login");
    this.storeTokenInSession = config.storeTokenInSession ?? true;
  }

  mountComponent() {
    if (this.initState) return;

    this.initState = "loading";

    Object.assign(this.component, {
      baseUrl: this.baseUrl,
      clientId: this.config.clientId,
      scope: this.config.scope,
      responseType: this.config.responseType,
      prompt: this.config.prompt,
      redirectUrl: this.config.redirectUrl,
    });

    this.component.addEventListener("Auth", (event: CustomEvent) => {
      const { token } = event.detail;
      if (token) {
        this.validateAndStoreToken(token);
      }
    });

    document.body.appendChild(this.component);

    this.initState = "done";
  }

  parse(): BasePayload & CustomPayload {
    return {
      ...this.userTokenData(),
      ...this.config.onAuth,
    } as any;
  }

  /**
   * Initiates the authentication process
   * @param {Object} options - Authentication options
   * @param {boolean} [options.silent=false] - If true, attempts silent authentication without showing UI
   * @returns {Promise<AuthResult>} Promise resolving to authentication result containing success status and token/error
   */
  async auth({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) {
      await this.show();
    }

    return this.component.auth({ trySilentAuth: silent });
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
    if (!this.storeTokenInSession) {
      return null;
    }

    return sessionStorage.getItem(UNIDY_ID_TOKEN_SESSION_KEY);
  }

  get isInitialized(): boolean {
    return !!this.initState;
  }

  async isAuthenticated(token_: string | null = null, fallbackToSilentAuthRequest = false): Promise<boolean> {
    let token = token_ || this.idToken;

    if (!token && fallbackToSilentAuthRequest) {
      const res = await this.component.auth({ trySilentAuth: true });

      if (res.success) {
        token = res.token;
      } else {
        return false;
      }
    } else {
      return false;
    }

    if (!token) {
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

      if (!payload) {
        return false;
      }

      return payload.exp > now;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }

  private validateAndStoreToken(token: string) {
    const tokenValid = Auth.validateToken(token);

    if (!tokenValid) {
      return;
    }

    if (this.storeTokenInSession) {
      sessionStorage.setItem(UNIDY_ID_TOKEN_SESSION_KEY, token);
    }

    this.config.onAuth?.(token);
  }
}
