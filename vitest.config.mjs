import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/js/dom.test.mjs"],
    coverage: {
      provider: "v8",
      include: ["src/assets/js/bootstrap-timepicker.js"],
      reporter: ["text"],
      reportsDirectory: "runtime/coverage-js",
      thresholds: { branches: 100, functions: 100, lines: 100 },
    },
  },
});
