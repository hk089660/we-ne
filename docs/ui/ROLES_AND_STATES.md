# Roles & States (v0)

この文書は、学校イベント参加券ユースケース向けの UI 仕様に対して **追記のみ** で整合性を取るための確定仕様です。
既存の仕様を書き換えず、実装の迷いをなくす目的で権限・状態・表示ルールを固定しています。

---

## 1) 権限定義（最終版）

- **viewer**: iPad 閲覧専用。閲覧のみ（編集・作成・CSV不可）。QR の「表示」は可。印刷操作は不可（ボタン非表示）。
- **operator**: 先生 PC 運営。イベント作成/編集、QR 表示、参加数閲覧、参加者一覧閲覧、参加者検索まで可。カテゴリ管理不可。CSV 不可。
- **admin**: 先生 PC 管理者。operator の全権限 + カテゴリ作成/編集/並び替え/削除可。CSV ダウンロード可（admin のみ）。

---

## 2) ロール別 UI 表示ルール

- **viewer**: 編集系ボタン（作成/編集/削除/並び替え/CSV/印刷）はすべて非表示。カテゴリタブ切替は可。
- **operator**: カテゴリ管理（`/admin/categories`）導線は非表示。CSV ボタン非表示。イベント作成は表示 OK。イベント編集/終了も表示 OK。
- **admin**: すべて表示。カテゴリ管理・CSV 表示。

---

## 3) 参加状態（Participation State）

- **started**: QR 読み取り成功 or `/u/confirm` 到達時点で started として記録（v0 はモック可）。
- **completed**: `/u/success` 到達で completed として確定。
- **例外**: expired（期限切れ）、invalid（無効 QR）

※ v0 では「未参加」を未完了に含めない（名簿/対象者リスト不要の設計）。

---

## 4) イベント状態（Event State）

- **draft** / **published** / **ended**
- viewer は **draft を表示しない**（published / ended のみ）

---

## 5) 参加数カウントの確定

- `/admin` のイベント一覧の左端小数字（CountBadge）
  - **リアルタイム参加数（completed 数）** を表示
- `/admin/events/:eventId` の詳細
  - **RT（現在までの completed）** と **total（累計 completed）** を両方表示
  - v0 では RT と total は同値でも良いが UI では分離表示

---

## 6) 印刷（`/admin/print/:eventId`）v0 仕様

- **CSS print（`@media print`）** を想定し、ブラウザ印刷で PDF 化
- 印刷レイアウトに必ず含める
  - イベント名 / 日時（開始-終了） / 主催
  - QR コード
  - 案内文（例：「参加用 QR（Safari 推奨）」）
- 権限: **admin のみ**「印刷する」ボタン表示

---

## 7) モード表示（事故防止）

- 管理者 UI のヘッダー右上に現在のロールを小さく表示
  - 例: `Viewer - Read only`, `Operator`, `Admin`

---

## 8) 型/定数（実装向け最小案）

```ts
export type Role = 'viewer' | 'operator' | 'admin';
export type EventState = 'draft' | 'published' | 'ended';
export type ParticipationState = 'started' | 'completed' | 'expired' | 'invalid';
```

---

## 9) 追記ポイント（既存 UI 仕様との整合）

- 参加券フローは `Scan → Confirm → Success` を維持
- 管理者は閲覧と運営を分離（viewer / operator / admin）
- CSV / カテゴリ管理 / 印刷は **admin のみ** 表示
