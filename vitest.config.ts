import { defineConfig } from "vitest/config";
import { name } from "./package.json";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: { reporter: "lcov" },
    globalSetup: "./test/global-setup.ts",
    alias: {
      [name]: "./src/index.ts",
    },
  },
});
