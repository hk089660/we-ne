# Android APK 作成・実機インストール手順（DEV DEBUG 確定版）

現在の変更を反映した APK を作成し、実機 Android に adb で「完全に入れ直し」て実行確認する手順。

## 前提

- `applicationId` は **jp.wene.app**（app.config.ts / AndroidManifest）
- 現在のスクリプトは **Hermes 有効**（`hermesEnabled=true`）でビルド安定性を優先。JSC / 非 Hermes にしたい場合は `android/gradle.properties` とスクリプトを変更すること。

---

## 実行手順

### 1) Android 実機が adb で認識されていることを確認

```bash
adb devices
```

### 2) wene-mobile に移動

```bash
cd wene-mobile
```

### 3) Android ビルドの完全クリーン

prebuild の上書きを含めて完全に作り直す。**現在のスクリプトは Hermes 有効を保証**する。

```bash
npm run android:clean-rebuild
```

内部で実行される想定:

- `expo prebuild --platform android --clean`
- `hermesEnabled=true` を保証
- `./gradlew clean`

### 4) APK をビルド

```bash
npm run build:apk
```

### 5) 既存アプリを端末から完全削除（adb）

**applicationId は jp.wene.app を使用する。**

```bash
adb uninstall jp.wene.app
```

### 6) 新しい APK を adb でインストール

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

クリーンインストール（既存削除後に新規インストール）する場合は `-r` を外す:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 7) インストール完了後、端末でアプリを起動

- DEV ビルドであることを確認
- 受け取り画面へ進める

---

## 一括実行（クリーンインストール）

クリーン＋ビルド＋アンインストール＋インストールを一括で行う場合:

```bash
cd wene-mobile
npm run android:clean-rebuild
npm run build:apk
adb uninstall jp.wene.app
adb install android/app/build/outputs/apk/release/app-release.apk
```

または deploy スクリプト（Hermes 有効のまま prebuild → build → クリーンインストール）:

```bash
cd wene-mobile
npm run deploy:adb:clean
```

※ `deploy:adb:clean` は prebuild → build:apk → uninstall jp.wene.app → install を実行する。

---

## 完了条件

- APK が正常にインストールされる
- アプリがクラッシュせず起動する
- 「受け取る」ボタンまで進める

---

## DEV 向けメモ: Android 実機での claim フロー

- **claim フローはクラッシュせず動作する**（成功 or 再試行のどちらかに必ず到達）
- **@coral-xyz/anchor の Wallet は使用しない**: RN では isBrowser 判定により Wallet が undefined になり "Cannot read property 'prototype' of undefined" が発生するため、自前の `KeypairWallet`（`src/solana/keypairWallet.ts`）を採用
- **ログ取得**: claim 実行時のログは `./scripts/capture-claim-flow.sh` で取得し、`/tmp/wene_claim_flow.log` を確認する
- **403 / StructError**: RPC のレート制限や形式違いの場合。`.env` に `EXPO_PUBLIC_SOLANA_RPC_URL` で別 RPC を指定（例: OnFinality, Helius）
- **devnet テスト送金**: Phantom ウォレットに devnet SOL を送る場合: `npm run devnet:faucet -- <Phantomのアドレス>`
