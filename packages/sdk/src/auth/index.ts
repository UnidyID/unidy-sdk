/**
 * @fileoverview entry point for your component library
 *
 * This is the entry point for your component library. Use this file to export utilities,
 * constants or data structure that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */

export type { LoginOptions } from "./api/auth";
export type { AuthError, TokenPayload } from "./auth";
export * from "./auth";
export * from "./error-definitions";
export type { AuthState, AuthStep } from "./store/auth-store";
export { authState, authStore, missingFieldNames, onChange as onAuthChange } from "./store/auth-store";
