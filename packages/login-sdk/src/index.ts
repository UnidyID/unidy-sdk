/**
 * Unidy Login SDK
 * 
 * A lightweight SDK for handling authentication via iframe in web applications.
 * 
 * @module @unidy.io/login-sdk
 */

import Auth from './auth';
import type { UnidyLoginSDK, UnidyLoginConfig } from './auth';
import './styles.css';

// Export the Auth constructor as the default export
export default {
  Auth
};

// Also export Auth as a named export
export { Auth };
export type { UnidyLoginSDK, UnidyLoginConfig };