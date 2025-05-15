import { Config } from '@stencil/core';
import tailwind from 'stencil-tailwind-plugin';

export const config: Config = {
  namespace: 'unidy-components',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      polyfills: true,
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      dir: 'dist/per-component',
    },
    {
      type: 'docs-readme',
    },
    // {
    //   type: 'www',
    //   serviceWorker: null, // disable service workers
    // },
  ],
  plugins: [tailwind()],
};
