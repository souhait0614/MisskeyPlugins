# web

Misskey プラグインの配布サイトです。
Astro + `@astrojs/cloudflare` でビルドし、Cloudflare Workers に配信します。

## 開発

モノレポのルートで実行してください。`astro dev` は workerd 上で動作します。

```sh
pnpm install
pnpm dev
```

## ビルド・確認

```sh
pnpm --filter web build
pnpm --filter web typecheck
pnpm --filter web preview   # ビルド後に workerd で確認
```

## デプロイ

```sh
pnpm deploy:workers
```

初回は `npx wrangler login` が必要です。
`wrangler.jsonc` の `routes` で `misskey-plugins.souhait.me` を Custom Domain として設定しています。
`souhait.me` ゾーンが同じ Cloudflare アカウントにある必要があります。

Worker の `main` や `assets` は `@astrojs/cloudflare` がビルド時に生成するため、
`wrangler.jsonc` には指定しません（`name` / `compatibility_date` / `routes` のみ）。

Cloudflare Workers Builds を使う場合は、ルートディレクトリをリポジトリ直下、
ビルドコマンドを `pnpm install && pnpm --filter web build`、
デプロイコマンドを `pnpm --filter web exec wrangler deploy` に設定してください。

## スタイル

- Tailwind CSS v4（`@tailwindcss/vite`）と daisyUI を使用しています。
- グローバルなスタイルは `src/styles/app.css` のみで、装飾は daisyUI のコンポーネント
  クラスとレイアウト用ユーティリティに限定しています。

## 仕組み

- モノレポ直下の `src/*.ais` をビルド時に読み込み、改行コードを LF に正規化して
  SHA-512 (16 進小文字) を計算します。
- `/api/plugins/<slug>.json` に `{ "type": "plugin", "data": "<ソースコード>" }`
  を静的出力します。
- 詳細ページのインストールボタンは
  `https://<host>/install-extensions?url=<絶対 URL の API>&hash=<SHA-512>`
  を生成します。
- ホスト入力の候補（`<datalist>`）は、次の 2 経路をマージして作成します。
  1. ビルド時に [Misskey サーバー一覧 API](https://servers.misskey.ink/docs/api/v1/instances) の
     `items[].host` から取得し、HTML に埋め込む（ユーザー数降順・重複排除・`is_alive: false` を除外）。
  2. ブラウザから同一オリジンの `/api/instances` を取得して差分を追加する。
     上流 API は `Origin` 付きリクエストに `Access-Control-Allow-Origin` を返さず CORS 非対応のため、
     `src/pages/api/instances.ts`（`prerender = false`）がプロキシする。結果は 1 時間 `localStorage` にキャッシュする。
- どの取得が失敗してもビルド・表示は継続し、取得できた候補だけで動作します。
- プラグインを更新した場合は、ハッシュが変わるため再ビルド・再デプロイが必要です。

## 注意

- `src/*.ais` の改行コードは LF 固定です（`.gitattributes` で指定）。
- 配布 JSON のサイズ上限は 256 KiB です（Misskey 側の取得実装）。
