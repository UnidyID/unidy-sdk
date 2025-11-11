import type * as z from "zod";

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  status: number;
  headers: Headers;
  error?: Error | string;
}

export class ApiClient {
  constructor(
    public baseUrl: string,
    public api_key: string,
  ) {
    this.api_key = api_key;
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

      const response: ApiResponse<T> = {
        data,
        status: res.status,
        headers: res.headers,
        success: res.ok,
      };

      return response;
    } catch (error) {
      const response: ApiResponse<T> = {
        status: res ? res.status : error instanceof TypeError ? 0 : 500,
        error: error instanceof Error ? error.message : String(error),
        headers: res ? res.headers : new Headers(),
        success: false,
        data: undefined,
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
    paramSchema?: z.ZodSchema<TParams>
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
        console.log(parsed.error);
        return {
          ...response,
          success: false,
          error: "Invalid response format",
          data: undefined,
        };
      }

      return {
        ...response,
        data: parsed.data,
      };
    };
    return fn as any;
  }
}
