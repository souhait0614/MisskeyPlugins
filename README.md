# Misskey Plugins

Misskey 向けプラグインの配布サイトです。pnpm ワークスペース + Turborepo のモノレポです。

## 構成

```
.
├── apps/web/                # 配布サイト (Astro / Tailwind CSS / daisyUI)
├── packages/eslint-config/  # 共有 ESLint 設定
├── packages/tsconfig/       # 共有 tsconfig
└── src/*.ais                # プラグイン本体（サイトのビルド元）
```

## 必要環境

- Node.js 24 以上
- pnpm 12 以上

## 開発

```sh
pnpm install
pnpm dev             # apps/web の開発サーバー
```

## 検証

```sh
pnpm lint            # ルート + 各ワークスペースの ESLint
pnpm typecheck       # 型チェック
pnpm build           # 静的ビルド
```

## デプロイ

```sh
pnpm deploy:workers
```

## 仕組み

- `src/*.ais` をビルド時に読み込み、改行コードを LF に正規化して SHA-512 (16 進小文字) を計算します。
- `/api/plugins/<slug>.json` に `{ "type": "plugin", "data": "<ソースコード>" }` を静的出力します。
- 詳細ページのインストールボタンは
  `https://<host>/install-extensions?url=<絶対 URL の API>&hash=<SHA-512>`
  を生成します。

詳細は [apps/web/README.md](apps/web/README.md) を参照してください。
