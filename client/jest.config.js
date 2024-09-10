module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@database/(.*)$": "<rootDir>/src/database/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@types/(.*)$": "../types/$1",
    "src/variables": "<rootDir>/src/variables",
    "src/util": "<rootDir>/src/util",
    // Add other path mappings as needed
  },
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["./setupTests.js"], // Update the path as needed
};
