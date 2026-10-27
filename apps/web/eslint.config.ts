import astroConfig from '@repo/eslint-config/astro.ts';
import { defineConfig } from 'eslint/config';

export default defineConfig({
  extends: [astroConfig],
});
