/**
 * This script patches the HTML files in www/ directory with environment-specific config values.
 * Run this before e2e tests in CI to configure the SDK for the CI environment.
 *
 * Environment variables:
 * - E2E_SDK_BASE_URL: The backend API URL (default: http://localhost:3000)
 * - E2E_SDK_API_KEY: The SDK API key (default: public-newsletter-api-key)
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SDK_BASE_URL = process.env.E2E_SDK_BASE_URL || "http://localhost:3000";
const SDK_API_KEY = process.env.E2E_SDK_API_KEY || "public-newsletter-api-key";

// @ts-expect-error
const WWW_DIR = join(import.meta.dirname, "../../www");

function patchHtmlFiles(dir: string) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      patchHtmlFiles(fullPath);
    } else if (entry.endsWith(".html")) {
      patchHtmlFile(fullPath);
    }
  }
}

function patchHtmlFile(filePath: string) {
  let content = readFileSync(filePath, "utf-8");
  const originalContent = content;

  // Replace base-url in u-config
  content = content.replace(/(<u-config[^>]*\s)base-url="[^"]*"/g, `$1base-url="${SDK_BASE_URL}"`);

  // Replace api-key in u-config
  content = content.replace(/(<u-config[^>]*\s)api-key="[^"]*"/g, `$1api-key="${SDK_API_KEY}"`);

  if (content !== originalContent) {
    writeFileSync(filePath, content);
    console.log(`Patched: ${filePath}`);
    console.log(`  base-url: ${SDK_BASE_URL}`);
    console.log(`  api-key: ${SDK_API_KEY}`);
  }
}

console.log("Configuring e2e HTML files...");
console.log(`SDK Base URL: ${SDK_BASE_URL}`);
console.log(`SDK API Key: ${SDK_API_KEY}`);
console.log("");

patchHtmlFiles(WWW_DIR);

console.log("\nDone!");
