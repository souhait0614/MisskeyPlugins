// @ts-check
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// 配布 API の URL は絶対 URL である必要があるため、公開 URL を必ず確定させる。
// プレビューデプロイなどで上書きしたい場合は環境変数 SITE_URL を使う。
const site = process.env.SITE_URL ?? 'https://misskey-plugins.souhait.me';

export default defineConfig({
  site,
  output: 'static',
  // セッションは使わないので KV を払い出さない
  session: false,
  // `/api/instances` だけをオンデマンド描画する（他はすべて事前生成）。
  adapter: cloudflare({
    // 画像最適化は使わないので Images バインディングを要求しない
    imageService: 'passthrough',
    // 事前生成のページは `node:crypto` などを使うため、ビルドは Node で行う。
    prerenderEnvironment: 'node',
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        // モノレポ直下の src/*.ais を開発サーバーからも読めるようにする
        allow: ['../..'],
      },
    },
  },
});
