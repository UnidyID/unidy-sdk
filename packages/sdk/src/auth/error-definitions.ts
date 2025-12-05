export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  account_not_found: "Account not found",

  invalid_password: "Invalid password",
  password_not_set: "Password not set",
  reset_password_already_sent: "Reset password email already sent",
  password_required: "Password is required",
  passwords_do_not_match: "Passwords do not match",

  magic_code_recently_created: "Magic code already sent. If you didn't receive one, please try again in a minute",
  magic_code_expired: "Magic code expired",
  magic_code_used: "Magic code used",
  magic_code_not_valid: "Magic code not valid",

  // Global (flash?) error messages --> TODO: fix flash message component (make it actually usable by the client)
  account_locked: "Account locked because of too many failed attempts. Try again later",
  sign_in_expired: "Sign in expired. Please go back and enter your email again",
  missing_refresh_token: "Please login again",
};

export const CONNECTION_FAILED_MESSAGE = "Unable to connect to the Unidy server";

export const AUTH_ERROR_CODES = {
  EMAIL: {
    NOT_FOUND: "account_not_found",
  },
  PASSWORD: {
    INVALID: "invalid_password",
    NOT_SET: "password_not_set",
    RESET_PASSWORD_ALREADY_SENT: "reset_password_already_sent",
  },
  MAGIC_CODE: {
    RECENTLY_CREATED: "magic_code_recently_created",
    EXPIRED: "magic_code_expired",
    USED: "magic_code_used",
    NOT_VALID: "magic_code_not_valid",
  },
  PASSWORD_RESET: {
    // TODO: figure out how to handle password requirements --> it should be same as in Unidy
    // just a placeholder for now
    PASSWORD_TOO_WEAK: "password_too_weak",
  },
  GENERAL: {
    ACCOUNT_LOCKED: "account_locked",
    SIGN_IN_EXPIRED: "sign_in_expired",
  },
} as const;
