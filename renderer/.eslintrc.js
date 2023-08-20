module.exports = {
  root: true,
  env: {
    node: true
  },
  plugins: [
    '@typescript-eslint'
    // 'only-warn'
  ],
  extends: [
    'plugin:vue/base',
    'standard-with-typescript'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'quote-props': ['error', 'consistent-as-needed'],
    'no-labels': ['error', { allowLoop: true }],
    'multiline-ternary': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    'import/first': 'off',
    'import/no-duplicates': 'off',
    'func-call-spacing': 'off',
    // TODO: refactor IPC and enable
    '@typescript-eslint/consistent-type-assertions': 'off'
  },
  overrides: [{
    files: ['src/main/**/*'],
    env: {
      node: true
    }
  }, {
    files: ['*.ts'],
    parserOptions: {
      project: './tsconfig.json'
    }
  }],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.vue']
  }
}
