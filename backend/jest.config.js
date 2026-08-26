module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript', decorators: false },
        target: 'es2022'
      },
      module: { type: 'commonjs' }
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*.test.ts']
};