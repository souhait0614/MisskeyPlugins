import { defineConfig } from 'eslint/config';

import typescriptConfig from './typescript.ts';

export default defineConfig(
  {
    extends: [typescriptConfig],
    files: ['**/*.ts'],
  },
);
