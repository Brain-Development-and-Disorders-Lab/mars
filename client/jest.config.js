module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/test/components/**/*.test.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/test/playwright/"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@database/(.*)$": "<rootDir>/src/database/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@types/(.*)$": "../types/$1",
    "src/variables": "<rootDir>/src/variables",
  },
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
};
