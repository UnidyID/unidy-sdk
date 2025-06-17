import { jwtDecode } from "jwt-decode";
import type { PromptOption, ResponseType, AuthResult, LogoutResult } from "./components/unidy-login/unidy-login";

export interface UnidyAuthConfig<Scope extends string = string> {
  /** The base URL of the Unidy authentication server, example: https://your-domain.unidy.de */
  baseUrl: string;
  /** The client ID for the application */
  clientId: string;
  /** The OAuth scopes to request, defaults to "openid email" */
  scope?: Scope;
  /** The OAuth response type, defaults to "id_token" */
  responseType?: ResponseType;
  /** The prompt option for authentication, can be "none", "login", "consent", "select_account" or null */
  prompt?: PromptOption;
  /** The URL to redirect to after authentication, defaults to current origin */
  redirectUrl?: string;
  /** Whether to store the token in session storage, defaults to true */
  storeTokenInSession?: boolean;
  /** Callback function called when authentication is successful */
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
  async auth({ silent = false }: { silent?: boolean } = {}): Promise<AuthResult> {
    if (!silent) {
      await this.show();
    }

    return this.component.auth({ trySilentAuth: silent });
  }

  async logout(): Promise<LogoutResult> {
    if (this.storeTokenInSession) {
      sessionStorage.removeItem(UNIDY_ID_TOKEN_SESSION_KEY);
    }

    return this.component.logout();
  }

  async show(): Promise<void> {
    return this.component.show();
  }

  async hide(): Promise<void> {
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

    return this.validateToken(token);
  }

  userTokenData(token_: string | null = null): (BasePayload & CustomPayload) | null {
    const token = token_ || this.idToken;

    if (!token) return null;
    if (!this.validateToken(token)) return null;

    return this.safeParseToken(token);
  }

  /**
   * Parses a JWT token and returns the payload with proper typing.
   *
   * @param token - The JWT token to parse
   * @returns The parsed token payload or null if parsing fails
   */
  safeParseToken(token: string): (BasePayload & CustomPayload) | null {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded as BasePayload & CustomPayload;
    } catch (error) {
      console.error("Failed to parse token:", error);
      return null;
    }
  }

  /**
   * Validates a JWT token by checking its expiration time.
   *
   * @param token - The JWT token to validate
   * @returns True if the token is valid and not expired, false otherwise
   */
  validateToken(token: string): boolean {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (!decoded) return false;

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp > now;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  }

  private validateAndStoreToken(token: string) {
    const tokenValid = this.validateToken(token);

    if (!tokenValid) {
      return;
    }

    if (this.storeTokenInSession) {
      sessionStorage.setItem(UNIDY_ID_TOKEN_SESSION_KEY, token);
    }

    this.config.onAuth?.(token);
  }
}
