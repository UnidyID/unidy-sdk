import type { Config } from "@stencil/core";
import { visualizer } from "rollup-plugin-visualizer";
import tailwind, { tailwindHMR } from "stencil-tailwind-plugin";

export const config: Config = {
  namespace: "sdk",
  tsconfig: "tsconfig.json",
  srcDir: "src",

  globalScript: "src/globalScript.ts",
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
      copy: [
        { src: "sdk.css", dest: "sdk.css" },
        { src: "locales", dest: "locales" },
      ],
    },
    { type: "dist-custom-elements" },
    { type: "docs-readme" },
    {
      type: "www",
      serviceWorker: null,
      copy: [
        { src: "sdk.css", dest: "sdk.css" },
        { src: "demo-build.css", dest: "demo.css" },
        { src: "auth/index.html", dest: "auth/index.html" },
        { src: "auth/registration.html", dest: "auth/registration.html" },
        { src: "newsletter/index.html", dest: "newsletter/index.html" },
        { src: "ticketable/index.html", dest: "ticketable/index.html" },
        { src: "auth/single-step.html", dest: "auth/single-step.html" },
        { src: "auth/registration.html", dest: "auth/registration.html" },
        { src: "oauth/index.html", dest: "oauth/index.html" },
        { src: "profile/index.html", dest: "profile/index.html" },
        { src: "profile/partial.html", dest: "profile/partial.html" },
      ],
    },
  ],

  rollupPlugins: {
    after: [process.env.ANALYZE === "true" ? visualizer() : null],
  },

  plugins: [tailwind({ injectTailwindConfiguration: (_filename) => '@import "tailwindcss" prefix(u);' }), tailwindHMR()],
  testing: { browserHeadless: "shell" },
  devServer: { reloadStrategy: "pageReload", openBrowser: false },
};
