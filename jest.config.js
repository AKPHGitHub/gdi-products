export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleFileExtensions: ['ts','tsx','js','jsx'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverage: true,
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/api/fetchClient.ts',
    'src/mappers/**/*.ts',
    'src/hooks/**/*.ts',
    'src/config/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: { global: { statements: 100, branches: 100, functions: 100, lines: 100 } },
}
