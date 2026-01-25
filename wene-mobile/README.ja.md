# We-ne Mobile

[English README](./README.md)

React Native（Expo + TypeScript）アプリ - 受給者向けUI

## セットアップ

```bash
# 依存関係のインストール
npm install

# アプリの起動
npm start
```

## ディレクトリ構成

```
wene-mobile/
├── app/
│   ├── _layout.tsx          # ルートレイアウト（Stack、header非表示）
│   ├── index.tsx            # 受給者ホーム画面
│   ├── phantom/
│   │   └── [action].tsx     # Phantom ウォレットリダイレクトハンドラー
│   └── r/
│       └── [campaignId].tsx # 受給画面
├── assets/
│   ├── icon.png             # アプリアイコン（1024x1024）
│   ├── adaptive-icon.png    # Android アダプティブアイコン
│   ├── splash.png           # スプラッシュ画面画像
│   └── icon-source.png      # アイコン生成用のソース画像
├── scripts/
│   ├── generate-icons.js    # アイコン生成スクリプト
│   └── deploy-via-adb.sh    # ADB デプロイスクリプト
├── app.config.ts            # Expo設定（deeplink含む）
├── package.json
└── tsconfig.json
```

## Deeplink

### Custom Scheme
- Scheme: `wene`
- 形式: `wene://r/<campaignId>?code=...`
- 例: `wene://r/demo-campaign?code=demo-invite`

### Universal Links / App Links (HTTPS)
- URL: `https://wene.app/r/<campaignId>?code=...`
- 例: `https://wene.app/r/demo-campaign?code=demo-invite`
- iOS: Universal Links（associatedDomains設定済み）
- Android: App Links（intentFilters設定済み）

## Universal Links / App Links の設定

### iOS: Apple App Site Association (AASA)

**必要な理由:**
iOSでUniversal Linksを動作させるには、ドメイン（wene.app）のルートにAASAファイルを配置する必要があります。iOSがこのファイルを検証して、アプリがそのドメインのリンクを処理できることを確認します。

**配置場所:**
- `https://wene.app/.well-known/apple-app-site-association`
- HTTPSでアクセス可能である必要があります
- Content-Type: `application/json` で配信する必要があります

**必要な値:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.jp.wene.app",
        "paths": ["/r/*"]
      }
    ]
  }
}
```
- `TEAM_ID`: Apple DeveloperアカウントのTeam ID（10文字の英数字）
- `paths`: アプリで処理するパスパターン（`/r/*`で/r/で始まるすべてのパスを処理）

### Android: Digital Asset Links (assetlinks.json)

**必要な理由:**
AndroidでApp Linksを動作させるには、ドメイン（wene.app）のルートにassetlinks.jsonファイルを配置する必要があります。Androidがこのファイルを検証して、アプリがそのドメインのリンクを処理できることを確認します。

**配置場所:**
- `https://wene.app/.well-known/assetlinks.json`
- HTTPSでアクセス可能である必要があります
- Content-Type: `application/json` で配信する必要があります

**必要な値:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "jp.wene.app",
    "sha256_cert_fingerprints": [
      "SHA256_FINGERPRINT"
    ]
  }
}]
```
- `package_name`: app.config.tsで設定した`jp.wene.app`
- `sha256_cert_fingerprints`: アプリの署名証明書のSHA256フィンガープリント（リリースビルド用とデバッグビルド用の両方を設定可能）

**フィンガープリントの取得方法:**
```bash
# リリースキーストアの場合
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias

# デバッグキーストアの場合
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**注意事項:**
- AASAとassetlinks.jsonは、HTTPSで配信され、正しいContent-Typeヘッダーが必要です
- ファイルはリダイレクトなしで直接アクセス可能である必要があります
- iOSはAASAファイルをキャッシュするため、変更後は反映に時間がかかる場合があります
- AndroidはApp Linksの検証を実行時に行うため、初回起動時にインターネット接続が必要です

## 画面仕様

### ホーム画面（app/index.tsx）
- 白背景
- タイトル「We-ne」
- 説明文「支援クレジットを受け取る」
- デモリンクボタン

### 受給画面（app/r/[campaignId].tsx）
- URLパラメータから `campaignId` と `code` を取得
- カード形式で情報を表示
- 「受け取る」ボタン

## デザインルール

- 白黒＋グレーのみ
- 影は使わない
- 角丸はやや大きめ（16px）
- 1画面1アクション

## アプリアイコン

### カスタムアイコンの設定

1. アイコン画像を `assets/icon-source.png` として保存（1024x1024推奨）
2. アイコン生成スクリプトを実行:
```bash
npm run generate-icons
```

生成されるファイル:
- `icon.png` - メインアプリアイコン
- `adaptive-icon.png` - Android アダプティブアイコン
- `favicon.png` - Web ファビコン
- `splash.png` - スプラッシュ画面画像

### ADB経由でデバイスにデプロイ

```bash
npm run deploy:adb
```

このスクリプトは以下を実行:
1. `icon-source.png` からアイコンを生成
2. prebuild実行（アイコンをAndroidリソースに反映）
3. APKをビルド
4. ADB経由で接続デバイスにインストール

## APK の書き出し

### 前提条件

- **Java 17**: Gradle 8 は Java 25 非対応のため、Java 17 を使用してください。
  - macOS (Homebrew): `brew install openjdk@17`
- **Android SDK**: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0` が必要です。
  - macOS (Homebrew): `brew install --cask android-commandlinetools` ののち、`sdkmanager` で上記をインストール。
- 未導入時は `ANDROID_HOME` と `JAVA_HOME` をそれぞれ設定してください。

### 手順

```bash
# 1. 初回のみ: ネイティブ Android プロジェクトを生成
npm run build:prebuild

# 2. APK をビルド（Java 17 と Android SDK を使用）
npm run build:apk
```

出力先: `android/app/build/outputs/apk/release/app-release.apk`

Homebrew で Java 17 と Android コマンドラインツールを入れている場合は、そのまま `npm run build:apk` でビルドできます。別のパスを使う場合は、ビルド前に `JAVA_HOME` と `ANDROID_HOME` を設定してください。

### ターミナルが落ちる／ビルドを再試行したい場合

**新しいターミナル**を開き、以下を実行してください。

```bash
cd wene-mobile
./scripts/build-apk.sh
# または
npm run build:apk
```

### APK インストール時の注意点

**更新が反映されない場合:**

1. **既存のアプリをアンインストール**
   - 設定 > アプリ > wene-mobile（または jp.wene.app）> アンインストール
   - または `adb uninstall jp.wene.app`（USB接続時）

2. **新しいAPKをインストール**
   - ファイルマネージャーでAPKを開く
   - または `adb install android/app/build/outputs/apk/release/app-release.apk`

**理由:**
- `versionCode` が同じ場合、Androidは更新と認識しません
- 異なる署名（例：Expo Go経由でインストール）の場合、上書きインストールできません
- `app.config.ts` で `versionCode` を自動更新するように設定済みですが、既存のアプリが古い `versionCode` の場合はアンインストールが必要です

## iOS ローカルビルド（Simulator）

### 前提条件

- **Xcodeアプリ**がインストールされている必要があります（App Storeからインストール、約12GB）
- Command Line Toolsだけでは不十分です
- インストール後: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` を実行

**確認方法:**
```bash
xcode-select -p
# 正しい場合: /Applications/Xcode.app/Contents/Developer
# 間違っている場合: /Library/Developer/CommandLineTools（Xcodeアプリが必要）
```

### ローカルビルド手順

```bash
cd wene-mobile
./scripts/build-ios.sh
# または
npm run build:ios
```

- 初回は `expo prebuild --platform ios --clean` 相当の処理が走ります（`ios/` がない場合）。
- その後 `expo run:ios` で Simulator にビルド・起動します。

**ターミナルが落ちる／再試行したい場合:** 新しいターミナルを開き、上記コマンドを再実行してください。

### Xcodeがインストールされていない場合

**EAS Build（クラウドビルド）を使用:**
```bash
# 1. EAS CLIのインストールとログイン
npm install -g eas-cli
eas login

# 2. EASプロジェクトの初期化（初回のみ）
eas init

# 3. iOS Simulator用ビルド
eas build --platform ios --profile development
```

詳細は `DEBUG_REPORT.md` の「iOS Simulator対応」セクションを参照してください。

## トラブルシューティング

### Expo GoでAndroid上に更新が反映されない場合

以下の手順を順番に試してください：

#### 方法1: キャッシュをクリア（推奨）
```bash
npm run start:clear
# または
npm run android:clear
```

#### 方法2: 完全リセット（方法1で解決しない場合）
```bash
npm run start:reset
# または
npm run android:reset
```

#### 方法3: すべてのキャッシュを削除（方法2で解決しない場合）
```bash
npm run clean
```

その後、Androidデバイスで：
1. **Expo Goアプリを完全に閉じる**
   - 最近使用したアプリ一覧からExpo Goをスワイプして閉じる
   - または、設定 > アプリ > Expo Go > 強制停止

2. **Expo Goアプリを再起動**
   - アプリを開き直し、QRコードをスキャンして再接続

3. **手動でリロード**
   - Expo Goアプリ内で、デバイスをシェイクするか、メニューから「Reload」を選択

#### 方法4: ネットワーク接続を確認
- Androidデバイスと開発マシンが同じWi-Fiネットワークに接続されていることを確認
- ファイアウォールやVPNが開発サーバーへの接続をブロックしていないか確認
- USBデバッグ経由で接続する場合：`adb reverse tcp:8081 tcp:8081` を実行

#### 方法5: 開発サーバーのログを確認
- 開発サーバーのターミナルでエラーメッセージがないか確認
- AndroidデバイスでExpo Goアプリのログを確認（設定 > デバッグ > ログを表示）

#### 補足情報
- `app.config.ts`は開発時に自動的にバージョンが更新されるため、手動で変更する必要はありません
- それでも更新されない場合は、Expo Goアプリ自体を再インストールしてみてください
