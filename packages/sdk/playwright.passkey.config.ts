import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Isolated route mocks: deliberately no auth.setup/database fixture or live tenant connection.
export default defineConfig({
  testDir: "./e2e/spec/auth",
  testMatch: "passkey-immediate.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: join(tmpdir(), "unidy-sdk-passkey-results"),
  use: { baseURL: "http://localhost:4179", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "bunx serve www -l 4179",
    url: "http://localhost:4179",
    reuseExistingServer: false,
  },
});
