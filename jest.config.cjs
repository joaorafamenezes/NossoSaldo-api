module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/src/integration/'],
  cacheDirectory: '<rootDir>/.jest-cache',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/repositories/',
    '/src/routers/',
    '/src/docs/',
    '/src/app.ts',
    '/src/lib/mailer.ts',
    '/src/lib/logger.ts',
    '/src/secure/',
    '/src/server.ts',
    '/src/scripts/',
  ],
  coverageThreshold: {
    global: {
      // Baseline raised after covering the IA configuration and consultation flows.
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
