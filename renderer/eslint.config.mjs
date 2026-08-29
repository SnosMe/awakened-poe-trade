import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { standard } from '@vue/eslint-config-standard-with-typescript'

// https://github.com/vuejs/eslint-config-standard/pull/71
standard[standard.length - 1].files = ['**/*.ts', '**/*.vue']

export default defineConfigWithVueTs(
  { ignores: ['src/*.d.ts'] },
  pluginVue.configs['flat/base'],
  vueTsConfigs.strict,
  standard,
  {
    files: ['**/*.vue'],
    rules: {
      'import-x/first': 'off',
      'import-x/no-duplicates': 'off',
      'vue/dot-notation': 'off',
      'vue/quote-props': 'off'
    }
  },
  {
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      '@stylistic/quote-props': ['error', 'consistent-as-needed'],
      'no-labels': ['error', { allowLoop: true }],
      '@stylistic/multiline-ternary': 'off',
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
      'func-call-spacing': 'off',
      'object-shorthand': 'off',
      // TODO: refactor IPC and enable
      '@typescript-eslint/consistent-type-assertions': 'off'
    }
  }
)
