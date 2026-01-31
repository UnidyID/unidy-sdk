import type { BaseModel } from "./index";

export interface User extends BaseModel {
  email: string;
  unidy_id: string;
  role: "user" | "admin" | "superadmin";

  // profile
  first_name: string | null;
  last_name: string | null;
  salutation: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  company_name: string | null;

  // address
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;

  // devise
  current_sign_in_at: string | null;
  current_sign_in_ip: string | null;
  encrypted_password: string;
  failed_attempts: number;
  invitation_accepted_at: string | null;
  invitation_created_at: string | null;
  invitation_limit: number | null;
  invitation_sent_at: string | null;
  invitation_token: string | null;
  invitations_count: number;
  invited_by_type: string | null;
  last_sign_in_at: string | null;
  last_sign_in_ip: string | null;
  locked_at: string | null;
  confirmation_sent_at: string | null;
  confirmation_token: string | null;
  confirmed_at: string | null;
  accept_invitation_return_url: string | null;
  custom_attribute_data: Record<string, unknown> | null;
  has_password: boolean | null;
  manually_confirmed_by_admin_at: string | null;
  preferred_language: string | null;
  reset_password_sent_at: string | null;
  reset_password_token: string | null;
  return_to_after_confirmation: string | null;
  sign_in_count: number;
  unconfirmed_email: string | null;
  unlock_token: string | null;
  invited_by_id: bigint | null;
}
