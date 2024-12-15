module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  }, 
  testMatch: ["**/tests/**/*.test.js?(x)"],
  testTimeout: 30000, 
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: [
    "json",
    "lcov",
    "text",
    "clover"
  ],
  globals: {
    'jest/globals': true
  }
};