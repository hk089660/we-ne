#!/usr/bin/env bash
set -uE -o pipefail

PREFIX='[verify-pages-build]'
log(){ echo "${PREFIX} $*"; }
fail(){ log "FAIL: $*"; exit 1; }

if [ $# -lt 1 ]; then
  log "Usage: $0 https://your-pages-domain.example.com"
  fail "BASE_URL is required"
fi

BASE="${1%/}"
log "BASE_URL=${BASE}"

LOCAL_DIR="dist/_expo/static/js/web"
if [ ! -d "$LOCAL_DIR" ]; then
  log "LOCAL_JS_DIR=${LOCAL_DIR}"
  fail "Local directory not found. Run 'npm run export:web' first."
fi

LOCAL_JS="$(ls -t "$LOCAL_DIR"/index-*.js 2>/dev/null | head -n1 || true)"
if [ -z "$LOCAL_JS" ]; then
  fail "Local file not found: ${LOCAL_DIR}/index-*.js (Expo web export may have failed)."
fi

LOCAL_SHA="$(shasum -a 256 "$LOCAL_JS" | awk '{print $1}')"
log "LOCAL_JS=${LOCAL_JS}"
log "LOCAL_SHA256=${LOCAL_SHA}"

TMP="$(mktemp)"
if ! curl -sSL -H 'Accept: text/html' "${BASE}/admin" -o "$TMP"; then
  rm -f "$TMP"
  fail "Could not fetch ${BASE}/admin (DNS or routing issue?)"
fi

REMOTE_PATH="$(grep -Eo '/_expo/static/js/web/index-[^"]+\.js' "$TMP" | head -n1 || true)"
rm -f "$TMP"

if [ -z "$REMOTE_PATH" ]; then
  fail "Could not find /_expo/static/js/web/index-*.js in /admin HTML (production may be serving a different build)."
fi

REMOTE_URL="${BASE}${REMOTE_PATH}"
REMOTE_SHA="$(curl -sSL "$REMOTE_URL" | shasum -a 256 | awk '{print $1}')"
if [ -z "$REMOTE_SHA" ]; then
  fail "Could not download remote JS bundle: ${REMOTE_URL}"
fi

log "REMOTE_JS=${REMOTE_URL}"
log "REMOTE_SHA256=${REMOTE_SHA}"

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "SHA256 mismatch between local and production JS bundle (production is serving a different artifact)."
fi
log "OK: JS build matches (local dist == production JS bundle)."

EVENTS_URL="${BASE}/v1/school/events"
HDR="$(curl -sSIL "$EVENTS_URL" 2>/dev/null || true)"
if [ -z "$HDR" ]; then
  fail "Could not reach ${EVENTS_URL}"
fi

STATUS="$(printf '%s\n' "$HDR" | head -n1 | tr -d '\r' | awk '{print $2}')"
CT="$(printf '%s\n' "$HDR" | grep -i '^content-type:' | head -n1 | sed -E 's/^content-type:\s*//I' | tr -d '\r')"
log "CHECK: GET /v1/school/events status=${STATUS} content-type=${CT}"

if [ "$STATUS" != "200" ]; then
  fail "Expected HTTP 200 from /v1/school/events but got ${STATUS}."
fi
if ! printf '%s\n' "$CT" | grep -qi 'application/json'; then
  fail "/v1/school/events does not return application/json (likely hitting Pages/HTML)."
fi
log "OK: /v1/school/events returns application/json (likely hitting Workers API)."

REG_URL="${BASE}/api/users/register"
REG_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$REG_URL" 2>/dev/null || echo "000")"
log "CHECK: POST /api/users/register status=${REG_STATUS}"

if [ "$REG_STATUS" = "000" ]; then
  fail "Could not reach /api/users/register (network or routing error)."
fi
if [ "$REG_STATUS" = "405" ]; then
  fail "POST /api/users/register returned 405 (likely hitting Cloudflare Pages directly)."
fi

log "OK: /api/users/register is not 405 (current status=${REG_STATUS})."
log "OK: proxy works."
exit 0
