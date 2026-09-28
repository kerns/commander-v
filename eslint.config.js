module.exports = [{
  ignores: ['node_modules/**', '.vscode-test/**', '.dev/**', 'builds/**', 'src/My Project/**'],
}, {
  files: ['**/*.js'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'commonjs',
    globals: { console: 'readonly', Buffer: 'readonly', process: 'readonly', __dirname: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' },
  },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-async-promise-executor': 'error',
    'no-dupe-keys': 'error',
    'no-unsafe-finally': 'error',
    'eqeqeq': 'error',
  },
}];
