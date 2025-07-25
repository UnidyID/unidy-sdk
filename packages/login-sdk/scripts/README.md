# Build Scripts

## post-build.js

This script runs automatically after the Stencil build process to ensure that the `unidy-login` web component is properly registered when the SDK is imported.

### What it does

1. **Adds component registration to ESM build** (`dist/esm/index.js`):
   - Imports `defineCustomElements` from the loader
   - Automatically calls it when the SDK is imported

2. **Adds component registration to CJS build** (`dist/cjs/index.cjs.js`):
   - Requires `defineCustomElements` from the loader
   - Automatically calls it when the SDK is imported

### Why this is needed

The Stencil build generates the component definitions and loaders separately from the main SDK code. Without this script, users would need to manually import and call `defineCustomElements` to register the `unidy-login` web component before using the Auth SDK.

With this script, the component registration happens automatically when users import the SDK, providing a better developer experience.

### Usage

The script runs automatically as part of the build process:

```bash
bun run build
# -> runs: stencil build && node scripts/post-build.js
```