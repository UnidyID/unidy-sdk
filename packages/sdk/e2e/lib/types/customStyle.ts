import type { BaseModel } from "./index";

export interface CustomStyle extends BaseModel {
  background_color: string | null;
  foreground_color: string | null;
  json_attributes: any;
  scss: string | null;
  text_color: string | null;
  created_at: string;
  updated_at: string;
  brand_id: number;
}
