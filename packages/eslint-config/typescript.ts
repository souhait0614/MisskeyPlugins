import taiymeConfig from '@taiyme/eslint-config';
import tsEslintParser from '@typescript-eslint/parser';
import gitignore from 'eslint-config-flat-gitignore';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

const scriptFiles = ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'];

export default defineConfig(
  gitignore(),
  {
    files: scriptFiles,
    extends: [
      taiymeConfig.configs.typescript,
      taiymeConfig.configs.stylistic,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parser: tsEslintParser,
      parserOptions: {
        projectService: true,
      },
    },
  },
);
