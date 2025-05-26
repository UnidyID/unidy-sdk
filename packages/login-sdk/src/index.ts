import { Auth } from "./auth";
import type { UnidyAuthConfig, UnidyAuthOptions, UnidyAuthInstance } from "./types";

export const UnidyAuth = {
  init: (baseUrl: string, config: UnidyAuthConfig, options?: UnidyAuthOptions): UnidyAuthInstance => {
    return new Auth(baseUrl, config, options);
  },
};
