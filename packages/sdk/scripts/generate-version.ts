/**
 * Generates a version.ts file from package.json
 * Run this before building to inject the version at build time
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const packageJson = await import("../package.json");
const version = packageJson.default.version;

const versionFileContent = `// Auto-generated file - do not edit manually
// Generated from package.json version
export const SDK_VERSION = "${version}";
`;

const outputPath = join(import.meta.dirname, "../src/version.ts");
writeFileSync(outputPath, versionFileContent);

console.log(`Generated version.ts with SDK_VERSION = "${version}"`);
