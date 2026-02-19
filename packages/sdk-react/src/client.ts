import type { TokenResponse } from "@unidy.io/sdk/standalone";
import {
  AuthService,
  NewsletterService,
  ProfileService,
  StandaloneApiClient,
  StandaloneUnidyClient,
  type StandaloneUnidyClientConfig,
  SubscriptionsService,
  TicketsService,
} from "@unidy.io/sdk/standalone";
import { jwtDecode } from "jwt-decode";
import { authStorage } from "./auth/auth-storage";

const TOKEN_EXPIRATION_BUFFER_SECONDS = 10;

interface JwtPayload {
  exp?: number;
  sid?: string;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return true;
    return payload.exp <= Date.now() / 1000 + TOKEN_EXPIRATION_BUFFER_SECONDS;
  } catch {
    return true;
  }
}

function decodeSid(token: string): string | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    return typeof payload.sid === "string" ? payload.sid : null;
  } catch {
    return null;
  }
}

class ReactStandaloneApiClient extends StandaloneApiClient {
  protected getRequestOptions(): RequestInit {
    return {
      mode: "cors",
      credentials: "include",
    };
  }
}

/**
 * Extended client that stores the baseUrl for use by hooks (e.g. social auth URL building)
 * and defaults `getIdToken` to read from sessionStorage, bridging auth tokens written by `useLogin`/`useSession`.
 *
 * On authenticated requests, if the token is expired we first try to refresh it using the
 * stored refresh token before returning an ID token to the requesting service.
 */
export class ReactUnidyClient extends StandaloneUnidyClient {
  public readonly baseUrl: string;
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(config: StandaloneUnidyClientConfig) {
    const customGetIdToken = config.deps?.getIdToken;
    let clientRef: ReactUnidyClient | null = null;

    const enhancedConfig: StandaloneUnidyClientConfig = {
      ...config,
      deps: {
        ...config.deps,
        getIdToken: async () => {
          const token = customGetIdToken ? await customGetIdToken() : authStorage.getToken();
          if (!clientRef) return token;
          return clientRef.getValidIdToken(token);
        },
      },
    };

    super(enhancedConfig);

    clientRef = this;
    this.baseUrl = config.baseUrl;

    // Use browser request options (credentials include) so cookie-based
    // auth checks like `auth.signedIn()` behave like the Stencil SDK.
    const apiClient = new ReactStandaloneApiClient(enhancedConfig);
    const deps = enhancedConfig.deps;
    this.auth = new AuthService(apiClient, deps);
    this.newsletters = new NewsletterService(apiClient, deps);
    this.profile = new ProfileService(apiClient, deps);
    this.tickets = new TicketsService(apiClient, deps);
    this.subscriptions = new SubscriptionsService(apiClient, deps);
  }

  private async getValidIdToken(token: string | null): Promise<string | null> {
    if (token && !isTokenExpired(token)) {
      return token;
    }

    return this.refreshTokenIfPossible(token);
  }

  private async refreshTokenIfPossible(expiredToken: string | null): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = (async () => {
      const refreshToken = authStorage.getRefreshToken();
      const signInId = authStorage.getSignInId() ?? (expiredToken ? decodeSid(expiredToken) : null);

      if (!refreshToken || !signInId) {
        return null;
      }

      const [error, response] = await this.auth.refreshToken({ signInId, refreshToken });
      if (error) {
        authStorage.clearAll();
        return null;
      }

      const tokenResponse = response as TokenResponse;
      authStorage.setToken(tokenResponse.jwt);
      authStorage.setRefreshToken(tokenResponse.refresh_token);
      authStorage.setSignInId(tokenResponse.sid ?? signInId);
      return tokenResponse.jwt;
    })().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }
}

/**
 * Create a standalone Unidy client enhanced for React.
 *
 * Differences from the base `createStandaloneClient`:
 * - `getIdToken` defaults to reading from sessionStorage (bridging tokens written by `useLogin`/`useSession`)
 * - Exposes `baseUrl` for use by social auth URL building
 */
export function createStandaloneClient(config: StandaloneUnidyClientConfig): ReactUnidyClient {
  return new ReactUnidyClient(config);
}
