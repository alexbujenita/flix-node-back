module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/test/fixtures/'],
  collectCoverageFrom: ['src/**/*.js'],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.js'],
      setupFiles: ['<rootDir>/test/setup.env.js'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.unit.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.test.js'],
      setupFiles: ['<rootDir>/test/setup.env.js'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.integration.js'],
    },
  ],
};
