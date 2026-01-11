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
        { src: "newsletter/index.html", dest: "newsletter/index.html" },
        { src: "ticketable/index.html", dest: "ticketable/index.html" },
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
