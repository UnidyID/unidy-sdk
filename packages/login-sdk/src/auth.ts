import { jwtDecode } from "jwt-decode";
import { Utils } from "./utils";
import { Logger } from "./logger";

/**
 * Error thrown when trying to use authentication methods before the unidy-login component is mounted
 */
export class UnidyNotMounted extends Error {
  constructor() {
    super("Unidy component is not mounted");
    this.name = "UnidyNotMounted";
  }
}

export interface UnidyAuthConfig<Scope extends string = string> {
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
  /** Whether to fallback to silent auth request when checking authentication status, defaults to false */
  fallbackToSilentAuthRequest?: boolean;
  /** Callback function called when authentication is successful */
  onAuth?: (token: string) => void;
  /** Whether to enable logging, defaults to true */
  enableLogging?: boolean;
}

export const UNIDY_ID_TOKEN_SESSION_KEY = "unidy_id_token";

export type BasePayload<Scope extends string> = {
  /** The subject of the token */
  sub: string;
  /** The expiration time of the token */
  exp: number;
  /** The issued at time of the token */
  iat: number;
  /** The issuer of the token */
  iss: string;
  /** The audience of the token */
  aud: string;
  /** The nonce of the token */
  nonce: string;
  /** The authentication time of the token */
  auth_time: number;
  [key: string]: string | number | boolean | undefined;
} & (Scope extends `${string}email${string}`
  ? { email: string; email_verified: boolean }
  : // biome-ignore lint/complexity/noBannedTypes: <explanation>
    {}) &
  (Scope extends `${string}profile${string}`
    ? {
        name: string;
        given_name: string;
        family_name: string;
        gender: "male" | "female" | "other";
        updated_at: number;
      }
    : // biome-ignore lint/complexity/noBannedTypes: <explanation>
      {});

export type AuthResult<CustomPayload extends Record<string, unknown> = Record<string, unknown>, Scope extends string = string> =
  | { success: true; token: string; userTokenData: (BasePayload<Scope> & CustomPayload) | null }
  | { success: false; error: string };
export type LogoutResult = { success: boolean };

export type PromptOption = "none" | "login" | "consent" | "select_account" | null;
export type ResponseType = "code" | "id_token" | "token";

export class Auth<CustomPayload extends Record<string, unknown> = Record<string, unknown>, Scope extends string = string> {
  /** The base URL of the Unidy authentication server, example: https://your-domain.unidy.de */
  public readonly baseUrl: string;
  /** Configuration options for the authentication process */
  public readonly config: UnidyAuthConfig<Scope>;
  /** The web component instance which contains the authentication UI and handles the authentication process */
  public readonly component: HTMLUnidyLoginElement;
  /** The state of the initialization process */
  private initState: "loading" | "done" | null = null;
  /** Whether to store the token in session storage, defaults to true */
  private storeTokenInSession = true;
  /** Whether to fallback to silent auth request when checking authentication status, defaults to false */
  private fallbackToSilentAuthRequest = false;

  private readonly logger: Logger;

  /**
   * Initializes a new instance of the Auth class.
   * @param baseUrl - The base URL of the Unidy authentication server.
   * @param config - Configuration options for the authentication process.
   */
  constructor(baseUrl: string, config: UnidyAuthConfig<Scope>) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.component = document.createElement("unidy-login");
    this.storeTokenInSession = config.storeTokenInSession ?? true;
    this.fallbackToSilentAuthRequest = config.fallbackToSilentAuthRequest ?? false;
    this.logger = new Logger(config.enableLogging ?? false);

    this.mountComponent();
  }

  /**
   * Mounts the authentication web component <unidy-login> to the DOM.
   * This method should be called once to initialize the component.
   */
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
      enableLogging: this.logger.enabled,
    });

    this.component.addEventListener("authEvent", (event: CustomEvent) => {
      const { token } = event.detail;

      if (token && this.validateToken(token)) {
        this.storeToken(token);
        this.config.onAuth?.(token);
      }
    });

    document.body.appendChild(this.component);

    // Try to authenticate after redirect (after confirmation for example) if there is a token in the URL
    const token = Utils.extractHashUrlParam(window.location.href, "id_token");

    if (token && this.validateToken(token)) {
      this.storeToken(token);
      this.config.onAuth?.(token);
    }

    this.initState = "done";
  }

  /**
   * Initiates the authentication process
   * @param {Object} options - Authentication options
   * @param {boolean} [options.silent=false] - If true, attempts silent authentication without showing UI
   * @returns {Promise<AuthResult>} Promise resolving to authentication result containing success status and token/error
   */
  async auth({ silent = false }: { silent?: boolean } = {}): Promise<AuthResult> {
    if (this.initState !== "done") {
      throw new UnidyNotMounted();
    }

    if (!silent) {
      await this.show();
    }

    const result = await this.component.auth({ trySilentAuth: silent });

    if (result.success) {
      return { success: true, token: result.token, userTokenData: this.userTokenData() };
    }

    return result;
  }

  /**
   * Logs the user out by clearing the session token and performing a logout request to the Unidy authentication server
   * @returns A promise that resolves with the logout result.
   */
  async logout(): Promise<LogoutResult> {
    if (this.initState !== "done") {
      throw new UnidyNotMounted();
    }

    if (this.storeTokenInSession) {
      sessionStorage.removeItem(UNIDY_ID_TOKEN_SESSION_KEY);
    }

    return this.component.logout();
  }

  /**
   * Shows the authentication dialog.
   * @returns A promise that resolves when the dialog is shown.
   */
  async show(): Promise<void> {
    if (this.initState !== "done") {
      throw new UnidyNotMounted();
    }

    return this.component.show();
  }

  /**
   * Hides the authentication dialog.
   * @returns A promise that resolves when the dialog is hidden.
   */
  async hide(): Promise<void> {
    if (this.initState !== "done") {
      throw new UnidyNotMounted();
    }

    return this.component.hide();
  }

  /**
   * Retrieves the ID token from session storage.
   *
   * @returns The ID token, or null if not found or if `storeTokenInSession` is disabled (false).
   */
  get idToken(): string | null {
    if (!this.storeTokenInSession) {
      return null;
    }

    return sessionStorage.getItem(UNIDY_ID_TOKEN_SESSION_KEY);
  }

  /**
   * Checks if the authentication component has been initialized.
   * @returns True if the component is initialized (mounted with `mountComponent` to the DOM), false otherwise.
   */
  get isInitialized(): boolean {
    return !!this.initState;
  }

  /**
   * Checks if the user is authenticated.
   * If not authenticated and fallbackToSilentAuthRequest is enabled, it attempts a silent login.
   *
   * Note: method should be used if `storeTokenInSession` is enabled (true) which is the default behavior.
   * If storeTokenInSession is disabled (false), the method will always return false.
   *
   * @returns A promise that resolves to true if the user is authenticated, false otherwise.
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.idToken && this.fallbackToSilentAuthRequest) {
      const res = await this.component.auth({ trySilentAuth: true });

      if (!res.success) {
        return false;
      }

      this.storeToken(res.token);
    }

    return !!this.idToken && this.validateToken(this.idToken);
  }

  /**
   * Retrieves the decoded user token data.
   *
   * Note: method should be used if `storeTokenInSession` is enabled (true) which is the default behavior.
   * If `storeTokenInSession` is disabled (false), the method will always return null.
   *
   * @returns The decoded token payload, or null if the token is invalid or not present.
   */
  userTokenData(): (BasePayload<Scope> & CustomPayload) | null {
    if (!this.idToken) return null;

    const decoded_token = this.parseToken(this.idToken);

    if (!this.validateToken(decoded_token)) return null;

    return decoded_token;
  }

  /**
   * Parses a JWT token and returns the payload with proper typing.
   *
   * @param token - The JWT token to parse
   * @returns The parsed token payload or null if parsing fails
   */
  parseToken(token: string): (BasePayload<Scope> & CustomPayload) | null {
    try {
      return jwtDecode<BasePayload<Scope> & CustomPayload>(token);
    } catch (error) {
      this.logger.error("Failed to parse token:", error);
      return null;
    }
  }

  /**
   * Validates a JWT token by decoding it and checking its expiration time.
   *
   * @param token - The JWT token to validate (can be string or decoded token)
   * @returns True if the token is valid and not expired, false otherwise
   */
  validateToken(token: string | (BasePayload<Scope> & CustomPayload) | null): boolean {
    try {
      let decoded: (BasePayload<Scope> & CustomPayload) | null;

      if (typeof token === "string") {
        decoded = this.parseToken(token);
      } else {
        decoded = token;
      }

      if (!decoded) return false;

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp > now;
    } catch (error) {
      this.logger.error("Invalid token:", error);
      return false;
    }
  }

  private storeToken(token: string): void {
    if (this.storeTokenInSession) {
      sessionStorage.setItem(UNIDY_ID_TOKEN_SESSION_KEY, token);
    }
  }
}
