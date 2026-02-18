import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../../api/base-service";
import { type CaptchaConfig, CaptchaConfigSchema } from "./schemas";

export type GetCaptchaConfigResult = CommonErrors | ["not_found", null] | [null, CaptchaConfig];

const STORAGE_KEY = "unidy_captcha_config";
const NOT_FOUND_SENTINEL = "not_found";

export class CaptchaService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "CaptchaService", deps);
  }

  private loadCachedConfig(): GetCaptchaConfigResult | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;

      if (raw === NOT_FOUND_SENTINEL) {
        return ["not_found", null];
      }

      const parsed = CaptchaConfigSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        return [null, parsed.data];
      }

      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private cacheConfig(result: GetCaptchaConfigResult): void {
    try {
      const [error, data] = result;
      if (error === null && data) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else if (error === "not_found") {
        sessionStorage.setItem(STORAGE_KEY, NOT_FOUND_SENTINEL);
      }
      // Do not cache transient errors (connection_failed, internal_error, schema_validation_error)
    } catch {
      // sessionStorage may be full or disabled
    }
  }

  /**
   * Fetches the captcha configuration for the current SDK client.
   * Results are cached in sessionStorage to avoid repeated requests within a session.
   * Endpoint: GET /api/sdk/v1/sdk_clients/:api_key/captcha_config
   */
  async getCaptchaConfig(): Promise<GetCaptchaConfigResult> {
    const cached = this.loadCachedConfig();
    if (cached !== null) {
      this.logger.debug("Using cached captcha config");
      return cached;
    }

    const response = await this.client.get<CaptchaConfig>(`/api/sdk/v1/sdk_clients/${this.client.api_key}/captcha_config`);

    const result: GetCaptchaConfigResult = this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 404) {
          return ["not_found", null];
        }
        return ["internal_error", null];
      }

      return [null, CaptchaConfigSchema.parse(response.data)];
    });

    this.cacheConfig(result);

    return result;
  }
}
