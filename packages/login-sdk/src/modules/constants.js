/**
 * Constants Module
 * 
 * Defines constants used throughout the SDK.
 */

/**
 * DOM element IDs used by the SDK.
 */
export const DOM_IDS = {
  WRAPPER_DIV: "unidyAuthFrameWrapper",
  IFRAME: "unidyAuthFrame"
};

/**
 * Default configuration values.
 */
export const DEFAULTS = {
  SCOPE: "openid",
  RESPONSE_TYPE: "id_token",
  AUTO_REFRESH: false,
  REFRESH_INTERVAL: 300, // 5 minutes in seconds
  SESSION_CHECK_INTERVAL: 60, // 1 minute in seconds
  TOKEN_REFRESH_TIMEOUT: 30000 // 30 seconds in milliseconds
};

/**
 * Logout endpoints to try when logging out.
 */
export const LOGOUT_ENDPOINTS = [
  '/logout',
  '/oauth/logout',
  '/oauth/signout',
  '/auth/logout',
  '/signout'
];