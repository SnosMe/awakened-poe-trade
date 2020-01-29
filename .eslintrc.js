module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'spaced-comment': ['error', 'always', { markers: ['#region'], exceptions: ['#endregion'] }]
  },
  parserOptions: {
    parser: '@typescript-eslint/parser'
  }
}
