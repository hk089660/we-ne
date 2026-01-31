#!/usr/bin/env bash
# アイコン差し替え → prebuild → APKビルド → ADB経由で実機にインストール
#
# 前提: 実機をUSB接続し、USBデバッグを有効にすること
#
# 使い方:
#   cd wene-mobile && ./scripts/deploy-via-adb.sh           # 上書きインストール
#   cd wene-mobile && ./scripts/deploy-via-adb.sh --clean   # クリーンインストール（既存アプリ削除後にインストール）

set -e
cd "$(dirname "$0")/.."

CLEAN_INSTALL=
[[ "${1:-}" == "--clean" ]] && CLEAN_INSTALL=1

echo "=== 1. アイコン生成 ==="
npm run generate-icons

echo ""
echo "=== 2. Prebuild（アイコンをAndroidリソースに反映） ==="
npm run build:prebuild

# Hermes 有効化を保証（prebuild が上書きする場合がある）
if grep -q '^hermesEnabled=false' android/gradle.properties 2>/dev/null; then
  sed -i.bak 's/^hermesEnabled=false/hermesEnabled=true/' android/gradle.properties && rm -f android/gradle.properties.bak
  echo "  hermesEnabled=true を反映しました"
fi

echo ""
echo "=== 3. APKビルド ==="
npm run build:apk

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$APK_PATH" ]]; then
  echo "エラー: APKが見つかりません: $APK_PATH"
  exit 1
fi

# ADB のパス解決（PATH になければ Android SDK の platform-tools を使用）
ADB_CMD="adb"
if ! command -v adb &>/dev/null; then
  ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
  if [[ -x "${ANDROID_HOME}/platform-tools/adb" ]]; then
    ADB_CMD="${ANDROID_HOME}/platform-tools/adb"
    echo "ADB: $ADB_CMD"
  else
    echo "エラー: adb が見つかりません。PATH に追加するか ANDROID_HOME を設定してください。"
    exit 1
  fi
fi

echo ""
echo "=== 4. デバイス確認 ==="
if ! "$ADB_CMD" devices | grep -qE 'device$'; then
  echo "エラー: ADBで認識されているデバイスがありません。"
  echo "  - 実機をUSB接続し、USBデバッグを有効にしてください。"
  echo "  - エミュレータの場合は起動してください。"
  "$ADB_CMD" devices -l
  exit 1
fi
"$ADB_CMD" devices -l

if [[ -n "$CLEAN_INSTALL" ]]; then
  echo ""
  echo "=== 5a. 既存アプリをアンインストール（クリーン） ==="
  "$ADB_CMD" uninstall jp.wene.app 2>/dev/null || true
fi

INSTALL_DESC="（既存は上書き）"
[[ -n "$CLEAN_INSTALL" ]] && INSTALL_DESC="（新規）"
echo ""
echo "=== 5. ADB経由でインストール${INSTALL_DESC} ==="
if [[ -n "$CLEAN_INSTALL" ]]; then
  "$ADB_CMD" install "$APK_PATH"
else
  # -r: 上書き, -d: バージョンダウングレード時も許可（アイコン差し替え等で有用）
  "$ADB_CMD" install -r -d "$APK_PATH"
fi

echo ""
echo "=== 完了 ==="
echo "アイコン付きアプリを実機にインストールしました。"
echo "ランチャーから「wene-mobile」を起動してください。"
