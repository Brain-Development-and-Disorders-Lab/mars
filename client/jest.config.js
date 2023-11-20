

module.exports = {
    preset: 'ts-jest',
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest"
    },
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        // Add other path mappings as needed
      },
      setupFilesAfterEnv: ['./setupTests.js'], // Update the path as needed

  };
  