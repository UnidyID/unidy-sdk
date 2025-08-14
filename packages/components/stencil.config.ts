import type { Config } from "@stencil/core";
import tailwind from "stencil-tailwind-plugin";
import { reactOutputTarget } from "@stencil/react-output-target";

export const config: Config = {
  namespace: "unidy-components",
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
      polyfills: true,
    },
    {
      type: "dist-custom-elements",
      customElementsExportBehavior: "auto-define-custom-elements",
      externalRuntime: false,
      dir: "dist/per-component",
    },
    {
      type: "docs-readme",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
    },
    reactOutputTarget({
      // Relative path to where the React components will be generated
      outDir: "../newsletter-sdk-react/lib/components/stencil-generated/",
      hydrateModule: "../../../../components/hydrate",
      clientModule: "../newsletter-sdk-react/lib/index",
    }),
    {
      type: "dist-hydrate-script",
      dir: "./hydrate",
    },
  ],
  plugins: [tailwind()],
};
