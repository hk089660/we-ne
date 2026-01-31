# JSC クラッシュ診断と次の打ち手

## 目的

Android で `jsEngine: 'jsc'` にすると起動直後にクラッシュする。  
原因を **adb logcat** で確定し、(A) JSC 設定/依存の不足 か (B) Expo/RN 側の JSC 既知問題 かを切り分ける。

---

## (1) クラッシュログの取得（最優先）

実機を USB 接続し、以下を実行する。

```bash
cd wene-mobile
npm run capture:jsc-crash
```

または手動:

```bash
adb logcat -c
adb logcat -v time > /tmp/wene_jsc_crash.log
```

**別ターミナルまたは実機で** アプリを起動してクラッシュさせる。  
その後 **Ctrl+C** で logcat を止め、`/tmp/wene_jsc_crash.log` を確認する。

### 見るべきキーワード

| キーワード | 意味 |
|-----------|------|
| `FATAL EXCEPTION` | クラッシュの例外 |
| `ReactNative` / `SoLoader` | RN 初期化 |
| `libjsc` / `JSCExecutor` / `JavaScriptCore` | JSC ランタイム |
| `Could not load` / `UnsatisfiedLinkError` | ネイティブ .so 読み込み失敗 → **(A) JSC ランタイム不足** の可能性 |
| `NoClassDefFoundError` | クラス未検出 → **(A) JSC 依存不足** の可能性 |
| `expo` / `ExpoModules` | Expo 初期化 → **(B) SDK/ビルド形態** の可能性 |

### 切り分けの目安

- **(A) JSC 設定/依存の不足**: `UnsatisfiedLinkError`, `NoClassDefFoundError`, `libjsc`, `JSCExecutor` など
- **(B) Expo/RN の JSC 既知問題**: 上記以外の RN/Expo スタック、または公式 Issue と一致するメッセージ

---

## (2) jsEngine が jsc になっているか確認

```bash
cd wene-mobile
npx expo config --type introspect | grep -i jsEngine
```

期待: `jsEngine: 'jsc'` または `expo.jsEngine: 'jsc'` が含まれる。

---

## (3) prebuild 上書き対策の確認

- **app.config.ts**: `jsEngine: 'jsc'` が設定されていること
- **android/gradle.properties**: `hermesEnabled=false` であること  
  - prebuild 後に `hermesEnabled=true` に戻る場合は、`deploy-via-adb.sh` / `android-clean-rebuild.sh` 内の「Hermes 無効化を保証」処理で再設定される

---

## (4) 次の打ち手（原因に応じて）

### JSC 修復（(A) の場合）

- jsc-android のバージョンと RN/Expo の対応を確認
- `android/app/build.gradle` の `jscFlavor` が Expo prebuild 推奨と一致しているか確認

### V8 への切替（OS 分岐なし・同一コードパス維持）

Expo の JS engine ガイドに従い、JSC の代わりに V8 を試す。

1. **インストール**
   ```bash
   npx expo install react-native-v8 v8-android-jit
   ```
2. **app.config.ts** で `jsEngine: 'v8'` に変更（Expo ドキュメントの記述に合わせる）
3. **prebuild 再実行**
   ```bash
   npx expo prebuild --platform android --clean
   ```
4. APK 再ビルド・インストール

※ V8 は Expo の開発ビルドが必要。Expo Go ではカスタム JS エンジンは使えない（SDK 52 以降）。

### Hermes 復帰（現在の設定・確定）

- **react-native-v8 は撤退済み**（Expo SDK 52 / RN 0.76 系で CMake ビルド失敗が起きやすく、PoC 安定運用と衝突するため）
- **app.config.ts**: `jsEngine` は未指定（Expo 標準 = Hermes）
- **android/gradle.properties**: `hermesEnabled=true`
- **scripts**: prebuild 後に `hermesEnabled=true` を保証（deploy-via-adb.sh / android-clean-rebuild.sh / android-ultra-clean.sh）
- web3.js / Phantom / Claim のロジックは変更せず、ビルド安定性を優先

### Hermes 継続 + 別解（(B) または JSC/V8 が難しい場合）

- `jsEngine: 'hermes'`（または未指定）に戻し、`hermesEnabled=true` に戻す
- web3.js の「prototype of undefined」は Hermes 起因として、polyfills の強化や該当依存の差し替えで対応する

---

## 完了条件

- `/tmp/wene_jsc_crash.log` からクラッシュ原因のクラス/行/ライブラリ名が特定できる
- (A) JSC ランタイム不足 か (B) SDK/ビルド形態の既知問題 かが確定する
- 次の打ち手（JSC 修復 or V8 切替 or Hermes 継続+別解）が決まる
