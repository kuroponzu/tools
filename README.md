# tools

ソフトウェア開発で便利な小さなツール群。Cloudflare Workers + Hono + TypeScriptで構築し、Workers Assetsで静的ファイルを配信する。

## ツール一覧

- 作業タイマー (`/timer/`): 分数を指定してアラームを鳴らすタイマー

## 開発

```txt
npm install
npm run dev
```

## デプロイ

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
