const nextJest = require("next/jest.js");

const createJestConfig = nextJest({
  // Path to the Next.js app, so next/jest can load next.config.mjs and .env files.
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

// next/jest returns an async function that merges Next.js-specific config
// (SWC transforms, CSS/image mocks, etc.) with the config above.
module.exports = createJestConfig(config);