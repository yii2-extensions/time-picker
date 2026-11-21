module.exports = {
  mutate: ["src/assets/js/bootstrap-timepicker.js"],
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  vitest: { configFile: "vitest.config.mjs", related: false },
  coverageAnalysis: "perTest",
  concurrency: 4,
  reporters: ["clear-text", "progress", "json"],
  jsonReporter: { fileName: "runtime/mutation-js.json" },
  tempDirName: "runtime/.stryker-tmp",
  ignorePatterns: ["/.agents", "/.claude", "/internal", "/runtime", "/vendor"],
  thresholds: { high: 100, low: 100, break: 100 },
};
