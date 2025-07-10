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

  async post<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
    let res: Response | null = null;

    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.api_key}`,
        },
        body: JSON.stringify(body),
      });

      let data: T | null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      const response: ApiResponse<T> = {
        data,
        status: res.status,
        headers: res.headers,
        success: res.ok,
      };

      return response;
    } catch (error) {
      const response: ApiResponse = {
        status: res ? res.status : error instanceof TypeError ? 0 : 500,
        error: error instanceof Error ? error.message : String(error),
        headers: res ? res.headers : new Headers(),
        success: false,
      };

      return response;
    }
  }
}
