#!/usr/bin/env bash
# JSC クラッシュ時の adb logcat 取得
#
# 使い方:
#   1. 実機を USB 接続し、アプリを「起動していない」状態にする
#   2. このスクリプトを実行: cd wene-mobile && ./scripts/capture-jsc-crash-log.sh
#   3. 表示されたら「アプリを起動してクラッシュさせる」
#   4. 60 秒後に自動停止、または Ctrl+C で停止
#   5. /tmp/wene_jsc_crash.log を確認
#
# 見るべきキーワード:
#   FATAL EXCEPTION / ReactNative / SoLoader / libjsc / JSCExecutor / JavaScriptCore
#   Could not load / UnsatisfiedLinkError / NoClassDefFoundError
#   prototype / Cannot read property / ReactNativeJS（JS エラー時）

set -e
cd "$(dirname "$0")/.."

ADB="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}/platform-tools/adb"
LOG="/tmp/wene_jsc_crash.log"

if ! "$ADB" devices | grep -qE 'device$'; then
  echo "エラー: ADB でデバイスが認識されていません。"
  exit 1
fi

echo "=== logcat をクリア ==="
"$ADB" logcat -c

echo "=== logcat を取得中（60秒間） ==="
echo ">>> 今すぐアプリを起動してクラッシュさせてください <<<"
echo ""

"$ADB" logcat -v time 2>&1 | tee "$LOG" &
PID=$!
echo ">>> 60秒間取得中。今すぐアプリを起動してクラッシュさせてください <<<"
sleep 60
kill $PID 2>/dev/null || true
wait $PID 2>/dev/null || true

echo ""
echo "=== 保存先: $LOG ==="
echo "重要キーワードで grep:"
echo "  grep -E 'FATAL|ReactNative|prototype|Cannot read property|ReactNativeJS|SoLoader|libjsc|JSCExecutor|JavaScriptCore|UnsatisfiedLinkError|NoClassDefFoundError|Could not load' $LOG"
echo ""
if [[ -f "$LOG" ]]; then
  echo "--- クラッシュ関連の行（先頭80件） ---"
  grep -E 'FATAL|ReactNative|prototype|Cannot read property|ReactNativeJS|SoLoader|libjsc|JSCExecutor|JavaScriptCore|UnsatisfiedLinkError|NoClassDefFoundError|Could not load' "$LOG" 2>/dev/null | head -80 || echo "(該当なし)"
fi
