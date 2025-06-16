import { Auth, type UnidyAuthConfig } from "./auth";

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

// const res = new UnidyAuth<{ firstname: string }>().init("https://api.unidy.io", {
//   clientId: "123",
//   scope: "openid email",
//   responseType: "id_token",
//   prompt: "none",
//   redirectUrl: "https://example.com",
//   onAuth: (token: string) => {
//     console.log(token);
//   },
// });

// const foo = res.parse();
