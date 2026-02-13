/**
 * @fileoverview Entry point for registration module.
 *
 * This is the entry point for the registration component library. Use this file to export utilities,
 * constants or data structures that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */

export { registrationState, registrationStore, onChange as onRegistrationChange } from "./store/registration-store";
export * from "./registration";

export type { RegistrationState } from "./store/registration-store";
