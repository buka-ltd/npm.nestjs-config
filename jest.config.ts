import { readFileSync } from 'node:fs'
import type { JestConfigWithTsJest } from 'ts-jest'
import { pathsToModuleNameMapper } from 'ts-jest'

const { compilerOptions } = JSON.parse(readFileSync('./tsconfig.json', 'utf8')) as {
  compilerOptions: { paths: Record<string, string[]> }
}

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testMatch: [
    '<rootDir>/__tests__/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['./src/**'],
  coverageReporters: ['text', 'cobertura'],
  coveragePathIgnorePatterns: [
    '.*__snapshots__/.*',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  resolver: '<rootDir>/__tests__/utils/jest-resolver.ts',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        outDir: './dist',
        declaration: false,
        experimentalDecorators: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        strict: true,
        noImplicitAny: false,
        skipLibCheck: true,
        target: 'esnext',
        baseUrl: './',
        ignoreDeprecations: '6.0',
        paths: compilerOptions.paths,
      },
    }],
  },
}

export default jestConfig
