import { BaseService, type ApiClientInterface, type CommonErrors, type ServiceDependencies } from "../../../api/base-service";
import { CaptchaConfigSchema, type CaptchaConfig } from "./schemas";

export type GetCaptchaConfigResult = CommonErrors | ["not_found", null] | [null, CaptchaConfig];

export class CaptchaService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "CaptchaService", deps);
  }

  /**
   * Fetches the captcha configuration for the current SDK client
   * Endpoint: GET /api/sdk/v1/sdk_clients/:api_key/captcha_config
   */
  async getCaptchaConfig(): Promise<GetCaptchaConfigResult> {
    const response = await this.client.get<CaptchaConfig>(`/api/sdk/v1/sdk_clients/${this.client.api_key}/captcha_config`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        // 404 means no captcha config exists for this client
        if (response.status === 404) {
          return ["not_found", null];
        }
        return ["internal_error", null];
      }

      return [null, CaptchaConfigSchema.parse(response.data)];
    });
  }
}
