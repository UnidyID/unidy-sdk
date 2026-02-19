import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@unidy.io/sdk-react": path.resolve(__dirname, "../src"),
      ...(command === "serve" && {
        "@unidy.io/sdk/standalone": path.resolve(
          __dirname,
          "../../sdk/src/api/standalone.ts",
        ),
      }),
    },
  },
}));
