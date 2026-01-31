# Phantom デバッグ手順

signTransaction で Phantom からアプリに戻らない場合の原因確定用。

## Phantom アプリ側ログの取得

1. **Phantom アプリ**を開く
2. **設定（Settings）** → **開発者向け / Developer** 等のメニューを探す
3. **ログのエクスポート** または **デバッグログ** を有効化
4. ログをダウンロード／共有して確認

### 最優先で確認するログ

- `redirect is not encoded properly` — redirect_link のエンコード不備
- `invalid redirect_link` — redirect_link 形式エラー
- `failed to open` — アプリが URL を開けない
- その他 Phantom 側のエラーメッセージ

Phantom の公式ドキュメントやアプリ内ヘルプで、ログ取得手順の最新情報を確認してください。

## adb ログの取得と診断

```bash
# 受け取るボタン有効条件を追跡
adb logcat | grep RECEIVE_BTN

# Phantom deeplink 受信を追跡
adb logcat | grep DEEPLINK

# claim 処理のチェックポイント・エラー
adb logcat | grep CLAIM

# 例外スタック取得（"prototype of undefined" 等）
adb logcat ReactNativeJS:V *:S
# または
adb logcat | grep -E "CLAIM|error stack|ReactNativeJS"
```

例外発生時は `[CLAIM] buildClaimTx failed` / `signTransaction failed` / `sendSignedTx failed` のいずれかで落ちた箇所が分かる。`error stack` のファイル名・行番号から原因を特定する。

## アプリ側ログで確認すること

### redirect_link の encode 検証

- `[PHANTOM] sign redirect_link raw:` — 送信前の生文字列（例: `wene://phantom/sign`）
- `[PHANTOM] sign redirect_link encoded(1回):` — encodeURIComponent 1回適用後の値
- `[PHANTOM] sign URL全文(1行):` — Phantom に渡している最終 URL

二重エンコードの可能性: raw に `%` が含まれる場合は要注意。

### Deeplink 受信

- `[DEEPLINK] initial getInitialURL:` — 起動時に取得した URL
- `[DEEPLINK] event received, URL全文:` — Linking イベントで受信した URL
- `[DEEPLINK] initial (AppState active):` — フォアグラウンド復帰時に getInitialURL で取得した URL

### DEV 画面での確認

開発ビルドでは「受け取る」押下後、Claiming 中に **Phantom sign URL（コピー用）** が表示される。  
この URL をコピーして Phantom のドキュメントやエラーログと照合できる。

## redirect_link のルール（明文化）

- **connect**: `wene://phantom/connect`
- **sign**: `wene://phantom/sign`
- クエリ（`errorCode` 等）は Phantom が付与するため、アプリ側では付与しない
- `redirect_link` は `URLSearchParams.set()` により 1 回だけエンコードされる（二重エンコード禁止）
