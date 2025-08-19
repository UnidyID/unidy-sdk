export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  status: number;
  headers: Headers;
  error?: Error | string;
}

export type RequestOptions = { headers?: Record<string, string> };

export class ApiClient {
  constructor(
    public baseUrl: string,
    public api_key: string,
  ) {
    this.api_key = api_key;
  }

  private buildHeaders(extra?: Record<string, string>): HeadersInit {
    const base: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.api_key}`,
    };
    return { ...base, ...(extra ?? {}) };
  }

  async post<T>(endpoint: string, body: object, options?: RequestOptions): Promise<ApiResponse<T>> {
    let res: Response | null = null;

    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: this.buildHeaders(options?.headers),
        body: JSON.stringify(body),
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
      };

      return response;
    }
  }

  async patch<T>(endpoint: string, body: object, options?: RequestOptions): Promise<ApiResponse<T>> {
    let res: Response | null = null;

    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        mode: "cors",
        headers: this.buildHeaders(options?.headers),
        body: JSON.stringify(body),
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
      };

      return response;
    }
  }
}
