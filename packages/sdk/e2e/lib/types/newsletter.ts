import type { BaseModel } from "./index";

export interface Newsletter extends BaseModel {
  title: string;
  internal_name: string;
  default: boolean;
  position: number;
  doi_through_unidy: boolean;
  opt_in_type: "doi" | "soi" | "soi_when_logged_in";
}

export interface NewsletterPreference extends BaseModel {
  name: string;
  plugin_identifier: string;
  default: boolean;
}
