import { Auth, type UnidyAuthConfig } from "./auth";

declare global {
  interface Window {
    UnidyAuthInstance?: Auth;
  }
}

export const UnidyAuth = {
  init: (baseUrl: string, config: UnidyAuthConfig) => {
    const existingInstance = window.UnidyAuthInstance;
    if (existingInstance) {
      return existingInstance;
    }

    const instance = new Auth(baseUrl, config);
    window.UnidyAuthInstance = instance;

    return instance;
  },
};
