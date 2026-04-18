/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          esModuleInterop: true,
          jsx: 'react-jsx',
          strict: false,
          baseUrl: '.',
          paths: { '@/*': ['./*'] },
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.ts',
  },
  collectCoverageFrom: ['lib/compute.ts', 'lib/chunker.ts', 'lib/plans.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/infra/'],
};
