import { Auth } from "./auth";

export const UnidyAuth = {
  init: (baseUrl: string, config: HTMLUnidyLoginElement) => {
    return new Auth(baseUrl, config);
  },
};
