import type { Config } from "@stencil/core";
import tailwind from "stencil-tailwind-plugin";

export const config: Config = {
  namespace: "unidy-login",
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "./loader",
      polyfills: true,
    },
    {
      type: "dist-custom-elements",
    },
    {
      type: "docs-readme",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
      copy: [
        { src: "shop.html", dest: "shop.html" },
        { src: "index.html", dest: "index.html" },
        // Only for development purposes: we are copying the newsletter component to the www directory so it can be used together with the login SDK.
        // Build the newsletter package to ensure the component is available or run build script in the root directory
        { src: "../../newsletter/dist/per-component/unidy-newsletter.js", dest: "unidy-newsletter.js" },
        { src: "../../newsletter/dist/per-component/index.js", dest: "index.js" },
      ],
    },
  ],
  plugins: [tailwind()],
};
