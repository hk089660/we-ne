#!/usr/bin/env bash
# Android APK ローカルビルド
# ターミナルが落ちた場合: 新しいターミナルを開き、このスクリプトを実行してください。
#
# 使い方:
#   cd wene-mobile && ./scripts/build-apk.sh
# または:
#   cd wene-mobile && bash scripts/build-apk.sh

set -e
cd "$(dirname "$0")/.."

echo "=== Android APK ビルド ==="
echo "カレント: $(pwd)"
echo ""

npm run build:apk

echo ""
echo "=== 完了 ==="
echo "APK: android/app/build/outputs/apk/release/app-release.apk"
