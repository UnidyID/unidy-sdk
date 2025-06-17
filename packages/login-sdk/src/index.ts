import { Auth, type UnidyAuthConfig } from "./auth";
import "./components";

declare global {
  interface Window {
    UnidyAuthInstance?: Auth<Record<string, unknown>, string>;
  }
}

export class UnidyAuth<Payload extends Record<string, unknown>> {
  init<Scope extends string>(baseUrl: string, config: UnidyAuthConfig<Scope>): Auth<Payload, Scope> {
    const existingInstance = window.UnidyAuthInstance as Auth<Payload, Scope> | undefined;
    if (existingInstance) {
      return existingInstance;
    }

    const instance = new Auth<Payload, Scope>(baseUrl, config);
    window.UnidyAuthInstance = instance;

    return instance;
  }
}
