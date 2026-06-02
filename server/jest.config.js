module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@connectors/(.*)$": "<rootDir>/src/connectors/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@resolvers/(.*)$": "<rootDir>/src/resolvers/$1",
    "^@seed/(.*)$": "<rootDir>/src/seed/$1",
    "^@variables": "<rootDir>/src/variables",
    "^@types/(.*)$": "../types/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!(nanoid|better-auth))"],
};
