# Project Guidelines

Misskey 向けプラグイン（`src/*.ais`）と、その配布サイト（`apps/web`）をまとめた pnpm + Turborepo のモノレポ。
セットアップ・コマンド・デプロイ手順は [README.md](README.md) と [apps/web/README.md](apps/web/README.md) に記載済み。ここでは重複させない。

## Architecture

- `src/*.ais` がプラグインの唯一のソース。サイト側にコピーを置かない。
- `.ais` を読むのは `apps/web/src/lib/plugins.ts` だけ。
  `import.meta.glob('../../../../src/*.ais', { query: '?raw', eager: true })` → LF 正規化 → SHA-512 (16 進小文字)
  → `@syuilo/aiscript` の `Parser` / `Interpreter.collectMetadata` でメタ情報を検証、という順で `Plugin[]` を組み立てる。
  新しいページを作るときも `.ais` を直接読まず、この `plugins` / `getApiPath()` を経由する。
- 配布 API は `apps/web/src/pages/api/plugins/[slug].json.ts`。`getStaticPaths()` + `GET` で
  `{ "type": "plugin", "data": <LF 正規化済みソース> }` をビルド時に静的生成する。
- `output: 'static'` + `@astrojs/cloudflare`。既定ですべて事前生成し、SSR が必要なルートだけ `export const prerender = false` を書く。
  動的ルートには必ず `getStaticPaths()` を書く。
- `/api/instances` だけは `apps/web/src/pages/api/instances.ts`（`prerender = false`）で、上流のサーバー一覧 API が CORS 非対応のためプロキシする。
  Worker の `main` / `assets` はアダプターが生成するので `wrangler.jsonc` に書かない。

## Build & Verify

```sh
pnpm install
pnpm lint        # ルート + 各ワークスペースの ESLint
pnpm typecheck   # astro check + tsc --noEmit
pnpm build       # apps/web/dist を生成
pnpm preview:workers  # 事前に pnpm build が必要
```

テストランナーは未導入。変更の検証は上記 3 コマンドで行う。

## Conventions

- **改行コードとハッシュ**: `.ais` は LF 固定（`.gitattributes`）。プラグインを変更すると SHA-512 が変わるので再ビルド・再デプロイが必須。
  `turbo.json` の `build.inputs` にある `../../src/*.ais` を削らない。
- **絶対 URL**: 配布 API の URL は相対パス不可。`astro.config.mjs` の `site` を起点に組み立てる（`SITE_URL` で上書き可）。`Astro.site ?? Astro.url` を使う。
- **依存バージョン**: `pnpm-workspace.yaml` の `catalog:` に置き、各 `package.json` では `"catalog:"` を参照する。`saveExact: true` なので `^` レンジは使わない。
- **import の拡張子**: ルートと `packages/*` は `module: NodeNext` + `allowImportingTsExtensions` のため、
  `@repo/eslint-config/typescript.ts` や `./typescript.ts` のように**拡張子付き**で import する。
  `apps/web` は bundler 解決なので拡張子なし（`../lib/plugins`）。
- **パッケージ exports**: `@repo/eslint-config` は `./typescript.ts` / `./astro.ts`、`@repo/tsconfig` は `./base.json` / `./frontend.json` のみ公開。
- **ESLint はワークスペース単位**: ルート `eslint.config.ts` は `apps/` と `packages/` を `globalIgnores` する。
  新しいワークスペースを追加するときは、その中に `eslint.config.ts` と `lint` / `lint:fix` / `typecheck` スクリプトを必ず用意する。
  `parserOptions.projectService: true` なので、lint 対象の TS はそのワークスペースの `tsconfig.json` の `include` に入れる。
- **整形**: Prettier は無く、ESLint（`@taiyme/eslint-config` の stylistic）が唯一の整形手段。手で整えず `pnpm lint:fix` を使う。
- **デプロイ**: スクリプト名は `deploy:workers`。`deploy` は `pnpm deploy`（pnpm のビルトイン）と衝突するため使わない。
- **UI**: 画面文言・コメント・エラーメッセージは日本語。スタイルは daisyUI のコンポーネントクラスとレイアウト用ユーティリティに限定し、`apps/web/src/styles/app.css` にコンポーネント CSS を追加しない。
- **Misskey 側の制約**: AiScript は 0.12.0 以上、配布 JSON は 256 KiB 以下。
