import type { BaseModel } from "./index";

export interface OauthApplication extends BaseModel<number, { brand_ids: number[] }> {
  name: string;
  description: string;

  uid: string;
  application_type: string;
  secret: string;
  redirect_uri: string;
  connect_uri: string;
  scopes: string;
  confirmation_less: boolean;
  service_id: number;
}
