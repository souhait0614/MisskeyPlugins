import typescriptConfig from '@repo/eslint-config/typescript.ts';
import { defineConfig, globalIgnores } from 'eslint/config';

// Each workspace is linted by its own config through `turbo run lint`.
export default defineConfig(
  globalIgnores(['apps/', 'packages/']),
  {
    files: ['*.ts'],
    extends: [typescriptConfig],
  },
);
