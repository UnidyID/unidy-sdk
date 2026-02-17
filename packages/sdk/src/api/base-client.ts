import { SDK_VERSION } from "../version";

/**
 * Base API client with shared functionality for both browser and standalone environments.
 */

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  status: number;
  headers: Headers;
  error?: Error | string;
  connectionError?: boolean;
}

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
  onConnectionChange?: (isConnected: boolean) => void;
}

/** Query parameters that can be passed to GET requests */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Abstract base class for API clients.
 * Provides shared functionality for making HTTP requests.
 */
export abstract class BaseApiClient {
  /**
   * Error messages that indicate a connection failure rather than a server error.
   * Grouped by source/environment.
   */
  protected static readonly CONNECTION_ERROR_MESSAGES = [
    // Browser fetch API errors
    "Failed to fetch", // Generic browser fetch failure (Chrome)
    "NetworkError", // Firefox network error
    "Load failed", // Safari network error
    "The network connection was lost", // Safari connection lost

    // Chromium/V8 error codes (used by Node.js and Chrome)
    "ERR_CONNECTION_REFUSED", // Server not accepting connections
    "ERR_NETWORK", // General network error
    "ERR_INTERNET_DISCONNECTED", // No internet connection

    // Node.js system error codes
    "ECONNREFUSED", // Connection refused by server
    "ENOTFOUND", // DNS lookup failed
    "EAI_AGAIN", // Temporary DNS failure
  ];

  protected onConnectionChange?: (isConnected: boolean) => void;

  public baseUrl: string;
  public api_key: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.api_key = config.apiKey;
    this.onConnectionChange = config.onConnectionChange;
  }

  protected isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      return BaseApiClient.CONNECTION_ERROR_MESSAGES.some((msg) => error.message.includes(msg));
    }
    return false;
  }

  protected setConnectionStatus(isConnected: boolean): void {
    this.onConnectionChange?.(isConnected);
  }

  protected baseHeaders(): Headers {
    const h = new Headers();
    h.set("Content-Type", "application/json");
    h.set("Accept", "application/json");
    h.set("Authorization", `Bearer ${this.api_key}`);
    h.set("SDK-Version", SDK_VERSION);
    return h;
  }

  protected mergeHeaders(base: Headers, extra?: HeadersInit): Headers {
    const out = new Headers(base);
    if (extra) {
      new Headers(extra).forEach((v, k) => {
        out.set(k, v);
      });
    }
    return out;
  }

  /**
   * Builds a query string from params, filtering out undefined/null values.
   */
  protected buildQueryString(params?: QueryParams): string {
    if (!params) return "";

    const filtered = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]);

    if (filtered.length === 0) return "";

    return `?${new URLSearchParams(Object.fromEntries(filtered)).toString()}`;
  }

  /**
   * Override this in subclasses to add environment-specific request options.
   */
  protected abstract getRequestOptions(): RequestInit;

  /**
   * Override this in subclasses to handle connection errors (e.g., Sentry reporting).
   */
  protected abstract handleConnectionError(error: unknown, endpoint: string, method: string): void;

  protected async request<T>(method: string, endpoint: string, body?: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    let res: Response | null = null;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        ...this.getRequestOptions(),
        headers: this.mergeHeaders(this.baseHeaders(), headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      let data: T | undefined;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }

      this.setConnectionStatus(true);

      return {
        data,
        status: res.status,
        headers: res.headers,
        success: res.ok,
        connectionError: false,
      };
    } catch (error) {
      const connectionFailed = this.isConnectionError(error);

      if (connectionFailed) {
        this.setConnectionStatus(false);
        this.handleConnectionError(error, endpoint, method);
      }

      return {
        status: res?.status ?? (connectionFailed ? 0 : 500),
        error: error instanceof Error ? error.message : String(error),
        headers: res?.headers ?? new Headers(),
        success: false,
        data: undefined,
        connectionError: connectionFailed,
      };
    }
  }

  async get<T>(endpoint: string, headers?: HeadersInit, params?: QueryParams): Promise<ApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.request<T>("GET", `${endpoint}${queryString}`, undefined, headers);
  }

  async post<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, body, headers);
  }

  async patch<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, body, headers);
  }

  async delete<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, headers);
  }
}
