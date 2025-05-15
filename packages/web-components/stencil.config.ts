import { Config } from '@stencil/core';
import { postcss } from '@stencil/postcss';
import autoprefixer from 'autoprefixer';
import tailwind from '@tailwindcss/postcss7-compat'; // Use the correct TailwindCSS PostCSS plugin

export const config: Config = {
  namespace: 'web-components',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
      dir: 'docs',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  plugins: [
    postcss({
      plugins: [
        tailwind(), // TailwindCSS plugin
        autoprefixer(), // Autoprefixer for cross-browser compatibility
      ],
    }),
  ],
};
