#!/usr/bin/env bash
# Android 完全クリーン再ビルド（Hermes 有効化を保証）
#
# 使い方:
#   cd wene-mobile && ./scripts/android-clean-rebuild.sh
# その後: npm run build:apk && npm run deploy:adb:clean
#
# より徹底したクリーンは: npm run android:ultra-clean

set -e
cd "$(dirname "$0")/.."

echo "=== 1. Prebuild（Android クリーン） ==="
npx expo prebuild --platform android --clean

echo ""
echo "=== 2. Hermes 有効化を保証 ==="
if grep -q '^hermesEnabled=false' android/gradle.properties 2>/dev/null; then
  sed -i.bak 's/^hermesEnabled=false/hermesEnabled=true/' android/gradle.properties && rm -f android/gradle.properties.bak
  echo "  hermesEnabled=true を反映しました"
else
  echo "  hermesEnabled=true は既に設定済み"
fi

echo ""
echo "=== 3. Gradle clean ==="
(
  cd android
  if [[ -f ./gradlew ]]; then
    ./gradlew clean
  else
    echo "  gradlew が見つかりません（prebuild 後は android に移動して実行）"
  fi
)

echo ""
echo "=== 完了 ==="
echo "次: npm run build:apk で APK をビルドし、npm run deploy:adb:clean でクリーンインストール"
