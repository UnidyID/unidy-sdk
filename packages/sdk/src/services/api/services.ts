import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api/base-service";
import { type Service, ServicesListResponseSchema } from "./schemas";

export type { Service } from "./schemas";

export type ListServicesResult = CommonErrors | ["missing_id_token", null] | [null, Service[]];

export type DisconnectServiceResult =
  | CommonErrors
  | ["missing_id_token", null]
  | ["not_found", { error_identifier: string }]
  | [null, null];

export class ServicesService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "ServicesService", deps);
  }

  /** List all OAuth services the authenticated user is connected to. */
  async list(): Promise<ListServicesResult> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken });

    const response = await this.client.get<Service[]>("/api/sdk/v1/service_connections", headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        return ["connection_failed", null] as const;
      }
      return [null, ServicesListResponseSchema.parse(response.data)] as [null, Service[]];
    });
  }

  /** Disconnect the authenticated user from an OAuth service by client ID. */
  async disconnect(clientId: string): Promise<DisconnectServiceResult> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken });

    const response = await this.client.delete(`/api/sdk/v1/service_connections/${encodeURIComponent(clientId)}`, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 404) {
          return ["not_found", { error_identifier: "service_not_found" }] as const;
        }
        return ["connection_failed", null] as const;
      }
      return [null, null] as [null, null];
    });
  }
}
