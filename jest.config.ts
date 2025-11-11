import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setupTestEnv.ts"],
  testTimeout: 30000,
  
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  
};

export default config;
