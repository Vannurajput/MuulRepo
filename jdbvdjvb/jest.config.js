/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  collectCoverage: true,
  collectCoverageFrom: [
    // Original files (2)
    'src/main/credentialStore.js',
    'src/main/connectors/helpers/connectionOptions.js',

    // Critical files (5)
    'src/main/messageHandler.js',
    'src/main/LocalConfigService.js',
    'src/main/connectors/ConnectorFactory.js',
    'src/main/connectors/LocalConfigConnector.js',
    'src/main/credentialRegistry.js',

    // Important storage files (4)
    'src/main/bookmarkStore.js',
    'src/main/historyStore.js',
    'src/main/githubStore.js',
    'src/main/themeStore.js',

    // Utility file (1)
    'src/main/inputFormatter.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text-summary'],
  moduleNameMapper: {
    '^electron$': '<rootDir>/test/__mocks__/electron.js',
    '^keytar$': '<rootDir>/test/__mocks__/keytar.js',
    '^../logger$': '<rootDir>/test/__mocks__/logger.js',
    '^../../logger$': '<rootDir>/test/__mocks__/logger.js'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  coverageThreshold: {
    global: {
      statements: 3,
      branches: 2,
      functions: 2,
      lines: 3
    }
  }
};
