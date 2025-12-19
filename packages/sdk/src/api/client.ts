import * as Sentry from "@sentry/browser";
import { t } from "../i18n";
import type * as z from "zod";
import { createLogger } from "../logger";

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  status: number;
  headers: Headers;
  error?: Error | string;
  connectionError?: boolean; // when backend is unreachable (network error, connection refused, etc.)
}

export type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  onConnectionChange?: (isConnected: boolean) => void;
};

export class ApiClient {
  private static readonly CONNECTION_ERROR_MESSAGES = [
    "Failed to fetch",
    "NetworkError",
    "ERR_CONNECTION_REFUSED",
    "ERR_NETWORK",
    "ERR_INTERNET_DISCONNECTED",
  ];

  private onConnectionChange?: (isConnected: boolean) => void;
  private logger = createLogger("ApiClient");

  constructor(
    public baseUrl: string,
    public api_key: string,
    onConnectionChange?: (isConnected: boolean) => void,
  ) {
    this.api_key = api_key;
    this.onConnectionChange = onConnectionChange;
  }

  private isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      return ApiClient.CONNECTION_ERROR_MESSAGES.some((msg) => error.message.includes(msg));
    }

    return false;
  }

  private setConnectionStatus(isConnected: boolean) {
    if (this.onConnectionChange) {
      this.onConnectionChange(isConnected);
    }
  }

  private baseHeaders(): Headers {
    const h = new Headers();
    h.set("Content-Type", "application/json");
    h.set("Accept", "application/json");
    h.set("Authorization", `Bearer ${this.api_key}`);
    return h;
  }

  private mergeHeaders(base: Headers, extra?: HeadersInit): Headers {
    const out = new Headers(base);
    if (extra) {
      new Headers(extra).forEach((v, k) => out.set(k, v));
    }
    return out;
  }

  private async request<T>(method: string, endpoint: string, body?: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    let res: Response | null = null;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        mode: "cors",
        credentials: "include",
        headers: this.mergeHeaders(this.baseHeaders(), headers),
        body: JSON.stringify(body) || undefined,
      });

      let data: T | undefined;
      try {
        data = await res.json();
      } catch (e) {
        data = undefined;
      }

      this.setConnectionStatus(true);

      const response: ApiResponse<T> = {
        data,
        status: res.status,
        headers: res.headers,
        success: res.ok,
        connectionError: false,
      };

      return response;
    } catch (error) {
      const connectionFailed = this.isConnectionError(error);

      if (connectionFailed) {
        this.setConnectionStatus(false);

        Sentry.captureException(error, {
          tags: { error_type: "connection_error" },
          extra: { endpoint, method },
        });
      }

      const response: ApiResponse<T> = {
        status: res ? res.status : connectionFailed ? 0 : 500,
        error: error instanceof Error ? error.message : String(error),
        headers: res ? res.headers : new Headers(),
        success: false,
        data: undefined,
        connectionError: connectionFailed,
      };

      return response;
    }
  }

  async get<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, headers);
  }

  async post<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, body, headers);
  }

  async patch<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, body, headers);
  }

  getWithSchema<TReturn, TArgs extends object, TParams = undefined>(
    returnSchema: z.ZodSchema<TReturn>,
    urlBuilder: (args: TArgs) => string,
    paramSchema?: z.ZodSchema<TParams>,
  ): TParams extends undefined
    ? (args: TArgs) => Promise<ApiResponse<TReturn>>
    : (args: TArgs, params?: TParams) => Promise<ApiResponse<TReturn>> {
    const fn = async (args: TArgs, params?: TParams) => {
      // Build URL
      const baseUrl = urlBuilder(args);

      // Validate and parse params with Zod if provided
      let queryString = "";
      if (paramSchema && params) {
        const validatedParams = paramSchema.parse(params);
        queryString = `?${new URLSearchParams(validatedParams as Record<string, string>).toString()}`;
      }

      const fullUrl = `${baseUrl}${queryString}`;
      const response = await this.get<unknown>(fullUrl);

      if (!response.success || !response.data) {
        return response as ApiResponse<TReturn>;
      }

      const parsed = returnSchema.safeParse(response.data);

      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return {
          ...response,
          success: false,
          error: t("errors.invalid_response_format", {
            defaultValue: "Invalid response format",
          }),
          data: undefined,
        };
      }

      return {
        ...response,
        data: parsed.data,
      };
    };
    // biome-ignore lint/suspicious/noExplicitAny: fn can literally be any function
    return fn as any;
  }
}
