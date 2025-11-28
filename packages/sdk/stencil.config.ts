import type { Config } from "@stencil/core";
import tailwind, { tailwindHMR } from "stencil-tailwind-plugin";

export const config: Config = {
  namespace: "sdk",
  tsconfig: "tsconfig.json",
  srcDir: "src",

  outputTargets: [
    { type: "dist", esmLoaderPath: "../loader" },
    { type: "dist-custom-elements" },
    { type: "docs-readme" },
    {
      type: "www",
      serviceWorker: null,
      copy: [
        { src: "auth/index.html", dest: "auth/index.html" },
        { src: "newsletter/index.html", dest: "newsletter/index.html" },
        { src: "ticketable/index.html", dest: "ticketable/index.html" },
      ],
    },
  ],
  plugins: [tailwind(), tailwindHMR()],
  testing: { browserHeadless: "shell" },
  devServer: { reloadStrategy: "pageReload", openBrowser: false },
};
