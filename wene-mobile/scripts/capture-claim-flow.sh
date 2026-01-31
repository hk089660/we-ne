#!/usr/bin/env bash
# Claim フロー実行時の adb logcat 取得
#
# 使い方:
#   1. 実機を USB 接続し、アプリを起動
#   2. このスクリプトを実行: cd wene-mobile && ./scripts/capture-claim-flow.sh
#   3. 表示されたら「受け取る」ボタンを押して claim を実行
#   4. 90 秒後に自動停止（または Ctrl+C）
#   5. /tmp/wene_claim_flow.log を確認
#
# 確認ポイント:
#   - [DEV_ENV] cluster=devnet, source=devnetConfig
#   - [DEV_GRANT] vaultBalance > 0
#   - [CLAIM] checkpoint 5: buildClaimTx done
#   - simulate passed / signature

set -e
cd "$(dirname "$0")/.."

ADB="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}/platform-tools/adb"
LOG="/tmp/wene_claim_flow.log"

if ! "$ADB" devices | grep -qE 'device$'; then
  echo "エラー: ADB でデバイスが認識されていません。"
  exit 1
fi

echo "=== logcat をクリア ==="
"$ADB" logcat -c

echo "=== logcat を取得中（90秒間） ==="
echo ">>> 今すぐアプリで「受け取る」を押して claim を実行してください <<<"
echo ""

"$ADB" logcat -v time 2>&1 | tee "$LOG" &
PID=$!
sleep 90
kill $PID 2>/dev/null || true
wait $PID 2>/dev/null || true

echo ""
echo "=== 保存先: $LOG ==="
echo ""
echo "--- Claim フロー関連（grep 結果） ---"
grep -E 'DEV_ENV|DEV_GRANT|CLAIM|checkpoint|signature|simulate|prototype|Cannot read property|ReactNativeJS' "$LOG" 2>/dev/null | tail -120 || echo "(該当なし)"
echo ""
echo "スタックトレース取得用:"
echo "  grep -E 'at |Error|Exception' $LOG | head -60"
