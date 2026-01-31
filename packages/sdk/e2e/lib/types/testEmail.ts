import type { BaseModel } from "./index";

export interface TestEmail extends BaseModel {
  from: string;
  to: string[];
  mail_id: string;
  subject: string;
  body: string;
}
