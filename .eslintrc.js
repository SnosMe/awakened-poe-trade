module.exports = {
  root: true,
  env: {
    node: true
  },
  plugins: [
    '@typescript-eslint',
    'only-warn'
  ],
  extends: [
    'plugin:vue/base',
    'standard-with-typescript'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    // 'spaced-comment': ['error', 'always', { markers: ['#region'], exceptions: ['#endregion'] }],
    'quote-props': ['error', 'consistent-as-needed'],
    // '@typescript-eslint/no-use-before-define': 'off',
    // 'vue/no-mutating-props': 'off',
    // '@typescript-eslint/member-delimiter-style': 'off',
    // '@typescript-eslint/camelcase': 'off',
    // '@typescript-eslint/no-inferrable-types': 'off',
    // 'vue/no-deprecated-v-on-native-modifier': 'off',
    // 'vue/no-deprecated-filter': 'off',
    // 'vue/no-deprecated-slot-attribute': 'off',
    // 'no-unused-vars': 'off',
    // '@typescript-eslint/no-non-null-assertion': 'off'
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.vue'],
    project: './tsconfig.json'
  }
}
