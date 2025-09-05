import type { Config } from "@stencil/core";
import tailwind from "stencil-tailwind-plugin";

export const config: Config = {
  namespace: "auth",
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    {
      type: "dist-custom-elements",
      customElementsExportBehavior: "auto-define-custom-elements",
      externalRuntime: false,
    },
    {
      type: "docs-readme",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
    },
  ],
  plugins: [tailwind()],
  testing: {
    browserHeadless: "shell",
  },
};
