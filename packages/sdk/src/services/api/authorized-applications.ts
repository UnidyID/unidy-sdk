import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { type MeListQuery, type MeResult, MeService } from "../../api/me-service";
import type { Page } from "../../api/shared";
import { type AuthorizedApplication, AuthorizedApplicationSchema } from "./schemas";

export type { AuthorizedApplication } from "./schemas";

const PATH = "/authorized_applications";

/** The OAuth applications the signed-in user has authorized (`/api/v2/me/authorized_applications`). */
export class AuthorizedApplicationsService extends MeService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "AuthorizedApplicationsService", deps);
  }

  /** A page of the applications the signed-in user authorized; only the host brand's when the tenant limits services to it. */
  async list(query?: MeListQuery): Promise<MeResult<Page<AuthorizedApplication>>> {
    return this.fetchPage(PATH, AuthorizedApplicationSchema, query);
  }

  /** One authorized application by its OAuth client id. */
  async get(clientId: string): Promise<MeResult<AuthorizedApplication>> {
    return this.fetchRecord(this.memberPath(clientId), AuthorizedApplicationSchema);
  }

  /** Revokes the signed-in user's authorization of an application, returning the application as it was. */
  async revoke(clientId: string): Promise<MeResult<AuthorizedApplication>> {
    return this.write("DELETE", this.memberPath(clientId), AuthorizedApplicationSchema);
  }

  private memberPath(clientId: string): string {
    return `${PATH}/${encodeURIComponent(clientId)}`;
  }
}
