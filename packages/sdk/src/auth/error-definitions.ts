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
    SIGN_IN_NOT_FOUND: "sign_in_not_found",
    SIGN_IN_ALREADY_PROCESSED: "sign_in_already_processed",
    SIGN_IN_EXPIRED: "sign_in_expired",
  },
} as const;
