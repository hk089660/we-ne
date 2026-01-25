# デバッグレポート

## 修正内容

### 1. 型エラーの修正
- ✅ `app/phantom/[action].tsx`: `setTimeout`の戻り値の型を`ReturnType<typeof setTimeout>`に修正

### 2. 未使用変数の削除
- ✅ `src/screens/ReceiveScreen.tsx`: 未使用の`dappEncryptionPublicKey`を削除
- ✅ `src/solana/grantProgram.ts`: 未使用のインポートを削除

### 3. エラーハンドリングの改善
- ✅ `app/phantom/[action].tsx`: 
  - イベントリスナーのクリーンアップ処理を追加
  - タイムアウト処理の改善
  - エラーメッセージの統一

### 4. メモリリークの防止
- ✅ `app/phantom/[action].tsx`: useEffectのクリーンアップ関数を追加

## 確認結果

### TypeScript型チェック
- ✅ エラーなし

### Expo Androidエクスポート
- ✅ 成功（警告あり、ビルドは正常）
  - `rpc-websockets`の警告: 依存パッケージの問題（動作には影響なし）
  - `@noble/hashes`の警告: 依存パッケージの問題（動作には影響なし）

## 完了したTODO（今回実装）

1. **campaignIdからGrant情報を取得するAPI** ✅
   - `src/api/getGrant.ts`: `getGrantByCampaignId(campaignId)` を実装
   - `src/data/grants.ts`: campaignId → Grant マップ（ローカル）
   - `src/types/grant.ts`: Grant 型定義
   - Receive・Wallet・Use 画面はこの API で取得したデータを表示

2. **Wallet画面の「使う」導線** ✅
   - ルート `/use/[campaignId]` を追加
   - Wallet「使う」押下で `/use/<campaignId>` に遷移
   - Use画面: Grant title、残高、期限（JST）、注意書き、「使用する（準備中）」disabled

## 残存するTODO

1. **Phantom signTransaction実装**
   - トランザクション署名機能
   - 実装場所: `src/screens/ReceiveScreen.tsx`

2. **Anchor Program IDL読み込み**
   - 実際のIDLファイルを読み込んでinstructionを構築
   - 実装場所: `src/solana/grantProgram.ts`

## 動作確認項目

### A段階（永続化 + Wallet画面）
- ✅ 受給状態の永続化（AsyncStorage）
- ✅ Wallet画面の表示
- ✅ 受給済み時のCTA改善

### B段階（Phantom Connect）
- ✅ Phantom Connect URL生成
- ✅ リダイレクト処理
- ✅ 暗号化データの復号
- ✅ 状態管理への反映

### C段階（on-chain claim/accept tx接続）
- ✅ トランザクション構築（スタブ）
- ✅ UI状態遷移への接続
- ⚠️ 実際の署名・送信は未実装（TODO）

## 注意事項

1. **開発用console.log**: 
   - `src/screens/ReceiveScreen.tsx:139`: トランザクション構築成功時のログ
   - `src/utils/phantom.ts:104`: 復号失敗時のエラーログ
   - 本番環境では削除または条件付き出力を推奨

2. **Phantomリダイレクト処理**:
   - タイムアウト: 30秒
   - イベントリスナーのクリーンアップ: 実装済み

3. **エラーハンドリング**:
   - すべての非同期処理にtry-catchを追加
   - ユーザーに分かりやすいエラーメッセージを表示

## iOS Simulator対応

### セットアップ

#### 方法1: EAS Build（推奨、クラウドビルド）

1. **EAS CLIのインストールとログイン**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **EASプロジェクトの初期化（初回のみ）**
   ```bash
   eas init
   ```

3. **iOS Simulator用ビルド**
   ```bash
   eas build --platform ios --profile development
   ```
   - `eas.json`の`development`プロファイルで`simulator: true`が設定されているため、自動的にSimulator用ビルドになります

4. **ビルド完了後、Simulatorにインストール**
   ```bash
   # EAS Buildのダッシュボードから.ipaファイルをダウンロード後
   xcrun simctl install booted <path-to-app.ipa>
   ```

#### 方法2: ローカルビルド（Xcode必要）

**前提条件:**
- **Xcodeアプリ**がインストールされている必要があります（App Storeからインストール）
- Command Line Toolsだけでは不十分です
- インストール後: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` を実行

**確認方法:**
```bash
xcode-select -p
# 正しい場合: /Applications/Xcode.app/Contents/Developer
# 間違っている場合: /Library/Developer/CommandLineTools
```

1. **スクリプトで一括実行（推奨・再試行しやすい）**
   ```bash
   cd wene-mobile
   ./scripts/build-ios.sh
   ```
   - `ios/` がなければ prebuild → `expo run:ios` を実行します

2. **または npm スクリプト**
   ```bash
   npm run build:prebuild:ios   # 初回のみ
   npm run build:ios            # Simulator でビルド・起動
   ```

3. **ターミナルが落ちた場合**
   - **新しいターミナル**を開き、上記 `./scripts/build-ios.sh` を再実行してください

4. **Xcodeがインストールされていない場合**
   - App StoreからXcodeをインストール（約12GB、時間がかかります）
   - または、**方法1（EAS Build）**を使用してください（クラウドビルド、Xcode不要）

5. **「No iOS devices available in Simulator.app」／利用可能な Simulator がない場合**
   - Xcode → Settings → Platforms で iOS シミュレータランタイムをダウンロード
   - または Xcode → Window → Devices and Simulators → Simulators でデバイスを追加
   - `./scripts/build-ios.sh` は事前チェックで上記を検出し、対処法を表示します

### Deeplinkのテスト

```bash
# wene:// deeplinkを開く
xcrun simctl openurl booted "wene://r/demo-campaign?code=demo-invite"
```

### Mock Wallet Adapter

iOS Simulator等、実機がない環境では`MockWalletAdapter`が自動的に使用されます。

- **場所**: `src/wallet/MockWalletAdapter.ts`
- **動作**: ダミーのキーペアを生成し、トランザクションに署名
- **環境変数**: `EXPO_PUBLIC_USE_MOCK_WALLET=true`で強制的にMockを使用可能

### app.config.ts の iOS設定

- `ios.bundleIdentifier`: `"jp.wene.app"`
- `scheme`: `"wene"`
- `associatedDomains`: `["applinks:wene.app"]` (Universal Links用)

## 次のステップ

1. 実際のGrant情報取得APIの実装
2. Phantom signTransactionの実装
3. IDLファイルの読み込みとinstruction構築
4. 本番環境用のログ出力の調整
5. iOS実機でのPhantom連携テスト
