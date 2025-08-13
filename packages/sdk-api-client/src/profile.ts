import type { ApiClient, ApiResponse } from "./api_client";

declare global {
  interface Window {
    UNIDY?: { auth?: { id_token?: string } };
  }
}

export class ProfileService {
  constructor(private client: ApiClient) {}
  async fetchProfile(idToken?: string): Promise<ApiResponse<unknown>> {
    const token = idToken ?? window.UNIDY?.auth?.id_token;
    if (!token) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }
    try {
      return await this.client.post<unknown>("/api/sdk/v1/profile", { id_token: token });
    } catch (e) {
      return {
        status: e instanceof TypeError ? 0 : 500,
        success: false,
        headers: new Headers(),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
