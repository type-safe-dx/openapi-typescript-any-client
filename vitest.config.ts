import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: { reporter: "lcov" },
    globalSetup: "./test/global-setup.ts",
    globals: true,
  },
});
