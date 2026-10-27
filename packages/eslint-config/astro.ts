import taiymeConfig from '@taiyme/eslint-config';
import tsEslintParser from '@typescript-eslint/parser';
import gitignore from 'eslint-config-flat-gitignore';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

const scriptFiles = ['**/*.{js,mjs,cjs,ts,mts,cts}'];

const sharedLanguageOptions = {
  globals: {
    ...globals.node,
    ...globals.browser,
  },
};

export default defineConfig(
  gitignore(),
  {
    files: scriptFiles,
    extends: [
      taiymeConfig.configs.typescript,
      taiymeConfig.configs.stylistic,
    ],
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsEslintParser,
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    // `.astro` は Astro のパーサーで解析し、frontmatter と `<script>` の中身は
    // TypeScript のパーサーに委ねる。パーサーは `astro.configs.recommended` が
    // 設定するため、ここでは上書きしない。
    files: ['**/*.astro'],
    extends: [astro.configs.recommended],
    languageOptions: {
      ...sharedLanguageOptions,
    },
  },
);
