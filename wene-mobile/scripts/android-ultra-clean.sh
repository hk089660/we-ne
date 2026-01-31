#!/usr/bin/env bash
# Android 生成物を超クリーンして再生成（Hermes 有効化を保証）
#
# 使い方:
#   cd wene-mobile && npm run android:ultra-clean
# その後: npm run build:apk && npm run deploy:adb:clean

set -e
cd "$(dirname "$0")/.."

echo "[1] remove generated dirs"
rm -rf android
rm -rf .expo .expo-shared
rm -rf node_modules/.cache

echo "[2] expo prebuild clean"
npx expo prebuild --platform android --clean

echo "[3] ensure hermesEnabled=true"
if [[ -f android/gradle.properties ]]; then
  if grep -q '^hermesEnabled=false' android/gradle.properties 2>/dev/null; then
    sed -i.bak 's/^hermesEnabled=false/hermesEnabled=true/' android/gradle.properties && rm -f android/gradle.properties.bak
    echo "  hermesEnabled=true を反映しました"
  else
    sed -i.bak 's/^hermesEnabled=.*/hermesEnabled=true/' android/gradle.properties 2>/dev/null && rm -f android/gradle.properties.bak || true
  fi
fi

echo "[4] gradle clean"
cd android
./gradlew clean
cd ..

echo "✅ ultra clean done"
echo "次: npm run build:apk で APK をビルドし、npm run deploy:adb:clean でクリーンインストール"
