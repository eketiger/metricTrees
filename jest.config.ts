import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/lib', '<rootDir>/app'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.ts',
  },
  collectCoverageFrom: [
    'lib/compute.ts',
    'lib/chunker.ts',
    'lib/plans.ts',
  ],
  // TODO: restore 100% thresholds once integrations (Stripe, Anthropic, Pinecone, Prisma)
  // have dedicated mocks wired up. Current scaffold enforces coverage only on pure
  // business-logic libs.
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/infra/'],
};

export default config;
