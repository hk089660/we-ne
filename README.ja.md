# We-ne (instant-grant-core)

審査向けのプロトタイプ / 評価キットです。Solana上で、非保管型の配布と学校向け参加券フローを、再現可能な検証手順つきで提供します。

## 概要（One-liner）

We-ne は、支援配布を監査しやすくし、運用しやすくすることを狙った非保管型プロトタイプです。

- claim署名はウォレット側で実行（アプリは秘密鍵を保管しない）
- オンチェーン `ClaimReceipt` PDA で二重claimを防止（同一期間）
- トランザクション / receipt をExplorerで第三者検証できる

## 解決したい課題

- 配布オペレーションの遅さ・不透明さ
- 少額支援での高い運用コスト
- 第三者監査のしづらさ
- 重複claimなどの濫用リスク
- 不要な個人情報収集によるプライバシー圧力

## 現在のPoCステータス

- Devnet E2E claimフローを実装（`/r/demo-campaign?code=demo-invite`）
- 学校PoCフローを実装（`/admin` + `/u/*`）
- 管理者印刷ルート: `/admin/print/<eventId>` で `/u/scan?eventId=...` のQRを生成
- 利用者フロー: `/u/scan` -> `/u/confirm` -> `/u/success`
- 再claim時の挙動: `alreadyJoined` を返し、UI上は運用完了として扱う
- Success画面は tx / receipt が渡された場合に Explorer リンクを表示

## デモ / 再現手順（1ページ）

1. 管理者イベント一覧を開く: `/admin`
2. （任意）イベント詳細を開く: `/admin/events/<eventId>`
3. 印刷ページを開く: `/admin/print/<eventId>`
4. QR遷移先が `/u/scan?eventId=<eventId>` であることを確認
5. 利用者側でそのURLを開く（スマホカメラ / QRリーダー推奨）
6. 確認ページへ進む: `/u/confirm?eventId=<eventId>`
7. 参加処理後に成功ページへ到達: `/u/success?eventId=<eventId>`
8. tx/receipt がある場合、Explorerで確認:
   - Tx: `https://explorer.solana.com/tx/<signature>?cluster=devnet`
   - Receipt: `https://explorer.solana.com/address/<receiptPubkey>?cluster=devnet`

再claim時の補足:

- School API経路: 同一subjectは `alreadyJoined`（重複カウント増加なし）
- オンチェーン経路: `ClaimReceipt` PDA により同一期間の重複支払いを防止

## クイックスタート（ローカル）

```bash
cd wene-mobile
npm i
EXPO_PUBLIC_API_MODE=http EXPO_PUBLIC_API_BASE_URL="http://localhost:8787" npm run dev:full
```

- `dev:full` でローカルAPI（`:8787`）とWeb UIを同時起動
- 表示されたWeb URLを開き、上のデモ手順を実施

任意のローカル検証:

```bash
cd wene-mobile
npm run test:server

cd ../api-worker
npm test
```

## クイックスタート（Cloudflare Pages）

モノレポ構成のため、Pagesのビルドルートは `wene-mobile` です。

重要要件:

- `export:web` は `scripts/gen-redirects.js` を実行
- export時に `EXPO_PUBLIC_API_BASE_URL`（または `EXPO_PUBLIC_SCHOOL_API_BASE_URL`）が必須
- 未設定だと redirects が不正になり、`/api/*` / `/v1/*` が Pages 直撃（405 / HTML）しやすい

Workerデプロイ:

```bash
cd api-worker
npm i
npm run deploy
```

Pages build + deploy + verify:

```bash
cd wene-mobile
EXPO_PUBLIC_API_BASE_URL="https://<your-worker>.workers.dev" npm run export:web
npm run deploy:pages
npm run verify:pages
```

## 検証コマンド

`verify:pages` では次を確認します。

- `/admin` のbundle SHA256 がローカル `dist` と一致
- `GET /v1/school/events` が `200` かつ `application/json`
- `POST /api/users/register` が **`405` ではない**

手動のランタイム確認:

```bash
BASE="https://<your-pages-domain>"

curl -sS -D - "$BASE/v1/school/events" -o /tmp/wene_events.json | sed -n '1p;/content-type/p'
head -c 160 /tmp/wene_events.json && echo

curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$BASE/api/users/register"
```

## トラブルシューティング / 既知の挙動

- `/v1/*` が HTML を返す場合、proxyルーティング未適用（成果物違い or redirects欠落）
- `/_redirects` を直接取得して404になること自体は Pages では起こりうる。上記ランタイム挙動で判定する
- ログイン/ユーザー状態はブラウザ・端末ストレージに残ることがある。共用端末検証はプライベートブラウズ推奨
- 現在のPoCではWebカメラ読取UIがモックのケースがあるため、`/u/scan?eventId=...` をスマホカメラ/QRリーダーで開く方式を推奨

## 詳細ドキュメント

- `wene-mobile/docs/CLOUDFLARE_PAGES.md`
- `wene-mobile/README_SCHOOL.md`
- `docs/DEVNET_SETUP.md`
- `docs/ARCHITECTURE.md`
- `api-worker/README.md`

## 審査向けコンテキスト

このリポジトリは本番mainnet向け製品ではなく、プロトタイプ/評価キットです。

- 目的: 審査者が再現し、独立して検証できること
- グラント文脈: 最小限。運用検証・技術検証を優先
- public-good 方針: オープンソース、監査可能性、非保管設計

## ライセンス

MIT（`/LICENSE`）
