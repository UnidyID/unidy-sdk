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
      ],
    },
  ],
  plugins: [tailwind()],
};
