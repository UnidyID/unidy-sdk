import type { BaseModel } from "./index";

export interface MagicLink extends BaseModel {
  code: string;
  token: string;
  used_at: string;
  user_id: string;
}
