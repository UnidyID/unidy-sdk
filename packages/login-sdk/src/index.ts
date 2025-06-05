import { Auth, type UnidyAuthConfig } from "./auth";

const AUTH_INSTANCE_KEY = "UnidyAuthInstance";

export const UnidyAuth = {
  init: (baseUrl: string, config: UnidyAuthConfig) => {
    const existingInstance = window[AUTH_INSTANCE_KEY];
    if (existingInstance) {
      return existingInstance;
    }

    const instance = new Auth(baseUrl, config);
    window[AUTH_INSTANCE_KEY] = instance;

    return instance;
  },
};
