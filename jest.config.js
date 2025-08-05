/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  coverageReporters: ['lcov'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^common/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],
};
