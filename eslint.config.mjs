import { defineConfig } from 'eslint/config'
import buka from '@buka/eslint-config'

export default defineConfig([
  { ignores: ['dist', 'eslint.config.mjs'] },
  {
    extends: [buka.typescript.recommended],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
])
