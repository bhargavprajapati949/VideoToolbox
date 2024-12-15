module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  }, 
  testMatch: [
    "**/tests/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)"
  ],
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