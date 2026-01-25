import type { BaseModel } from "./index";

export interface Brand extends BaseModel {
  available_languages: string[];
  default: boolean;
  default_to_device_language: boolean;
  host: string;
  language: string;
  mail_sender: string;
  multilanguage_enabled: boolean;
  name: string;
  timezone: string;
}

export interface UserBrand extends BaseModel {
  brand_id: number;
  user_id: number;
  language: string | null;
}
