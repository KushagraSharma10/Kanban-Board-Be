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
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,ts}",   
    "!<rootDir>/src/**/*.d.ts",    
    "!<rootDir>/tests/**",          
    "!**/node_modules/**",          
  ],
  
  coverageDirectory: "coverage",
};

export default config;
