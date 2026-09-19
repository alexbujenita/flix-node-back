// clearMocks/restoreMocks are per-project options: declaring them only at the
// root of a projects config leaves them unapplied, so spies leak between tests.
const projectDefaults = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ["<rootDir>/test/setup.env.js"],
};

module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: ["/node_modules/", "/test/fixtures/"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: {
      statements: 100,
      lines: 100,
      functions: 100,
      branches: 95,
    },
  },
  projects: [
    {
      ...projectDefaults,
      displayName: "unit",
      testMatch: ["<rootDir>/test/unit/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/test/setup.unit.js"],
    },
    {
      ...projectDefaults,
      displayName: "integration",
      testMatch: ["<rootDir>/test/integration/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/test/setup.integration.js"],
    },
  ],
};
