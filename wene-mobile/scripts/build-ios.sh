#!/usr/bin/env bash
# iOS ローカルビルド（Simulator 向け）
# ターミナルが落ちた場合: 新しいターミナルを開き、このスクリプトを実行してください。
#
# 使い方:
#   cd wene-mobile && ./scripts/build-ios.sh
# または:
#   cd wene-mobile && bash scripts/build-ios.sh

set -e
cd "$(dirname "$0")/.."

echo "=== iOS ローカルビルド (Simulator) ==="
echo "カレント: $(pwd)"
echo ""

# 0. 事前チェック
XCODE_PATH=$(xcode-select -p 2>/dev/null || true)
if [[ "$XCODE_PATH" != *"Xcode.app"* ]]; then
  echo "エラー: Xcode アプリが選択されていません。"
  echo " 現状: $XCODE_PATH"
  echo ""
  echo "対処: Xcode を App Store からインストール後、以下を実行してください。"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  echo ""
  exit 1
fi

DEVICES=$(xcrun simctl list devices available 2>/dev/null | grep -c "iPhone\|iPad" || true)
if [[ "${DEVICES:-0}" -lt 1 ]]; then
  echo "エラー: 利用可能な iOS Simulator がありません。"
  echo ""
  echo "対処: Xcode を開く → Settings → Platforms → iOS のシミュレータランタイムをダウンロード"
  echo "      または: Xcode → Window → Devices and Simulators → Simulators でデバイスを追加"
  echo ""
  exit 1
fi

# ios/ がなければ prebuild
if [ ! -d "ios" ] || [ ! -f "ios/wenemobile.xcodeproj/project.pbxproj" ]; then
  echo "1/2 prebuild (ios) ..."
  npx expo prebuild --platform ios --clean
  echo ""
else
  echo "1/2 ios/ あり。prebuild スキップ"
  echo ""
fi

echo "2/2 expo run:ios (Simulator) ..."
npx expo run:ios

echo ""
echo "=== 完了 ==="
