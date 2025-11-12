/**
 * @fileoverview entry point for your component library
 *
 * This is the entry point for your component library. Use this file to export utilities,
 * constants or data structure that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */


export * from './api';

export * from './newsletter-react';

const canRegister =
  typeof globalThis !== 'undefined' &&
  !!(globalThis as any).document &&
  !!(globalThis as any).customElements;

if (canRegister) {
  import('../loader/index.js')
    .then(({ defineCustomElements }) => defineCustomElements())
    .catch(() => {
    });
}

export async function registerAll(): Promise<void> {
  const { defineCustomElements } = await import('../loader/index.js');
  defineCustomElements();
}

