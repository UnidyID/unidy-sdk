import type { BaseModel } from "./index";

export interface Plugin extends BaseModel {
  type: "Plugins::Campai" | "Plugins::InternalMatching";
  name: string;
  options: Record<string, any>;
}
