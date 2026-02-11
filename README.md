# We-ne (instant-grant-core)

Prototype / evaluation kit for reviewers: non-custodial distribution and school participation tickets on Solana, with reproducible verification steps.

## One-liner

We-ne is a non-custodial prototype that aims to make support distribution auditable and easier to operate.

- Claim signing is wallet-side (app does not custody private keys)
- Double-claim is blocked by on-chain `ClaimReceipt` PDA (per period)
- Verification is independent: transaction / receipt can be checked on Solana Explorer

## What Problem This Addresses

- Slow and opaque distribution workflows
- High overhead for small grants or participation incentives
- Weak third-party auditability
- Abuse risk (duplicate claim attempts)
- Privacy pressure from unnecessary personal data collection

## Current PoC Status

- Devnet E2E claim flow exists in repo (`/r/demo-campaign?code=demo-invite`)
- School PoC flow exists (`/admin` + `/u/*` routes)
- Admin print route: `/admin/print/<eventId>` generates QR URL for `/u/scan?eventId=...`
- User flow: `/u/scan` -> `/u/confirm` -> `/u/success`
- Re-claim behavior: duplicate attempts return `alreadyJoined` and are treated as operational completion in UI
- Success screen supports tx / receipt display and Explorer links when those values are present

## Demo / Reproduction (1-page)

1. Open Admin events page: `/admin`
2. (Optional) Open event detail: `/admin/events/<eventId>`
3. Open print page: `/admin/print/<eventId>`
4. Confirm QR target URL is `/u/scan?eventId=<eventId>`
5. User opens that URL (scan via phone camera / QR reader)
6. Move to confirm page: `/u/confirm?eventId=<eventId>`
7. Submit claim/join and reach success page: `/u/success?eventId=<eventId>`
8. If tx/receipt fields are present, open Explorer links:
   - Tx: `https://explorer.solana.com/tx/<signature>?cluster=devnet`
   - Receipt: `https://explorer.solana.com/address/<receiptPubkey>?cluster=devnet`

Re-claim note:

- School API path: same subject returns `alreadyJoined` (no duplicate count increase)
- On-chain path: `ClaimReceipt` PDA prevents duplicate payout for the same period

## Quickstart (Local)

```bash
cd wene-mobile
npm i
EXPO_PUBLIC_API_MODE=http EXPO_PUBLIC_API_BASE_URL="http://localhost:8787" npm run dev:full
```

- `dev:full` starts both local API (`:8787`) and web UI
- Open the shown web URL, then run the demo flow above

Optional local verification:

```bash
cd wene-mobile
npm run test:server

cd ../api-worker
npm test
```

## Quickstart (Cloudflare Pages)

Monorepo note: Pages build root is `wene-mobile`.

Important requirement:

- `export:web` runs `scripts/gen-redirects.js`
- `EXPO_PUBLIC_API_BASE_URL` (or `EXPO_PUBLIC_SCHOOL_API_BASE_URL`) must be set during export
- If missing, redirects are not generated correctly and `/api/*` / `/v1/*` may hit Pages directly (405 / HTML)

Worker deploy:

```bash
cd api-worker
npm i
npm run deploy
```

Pages build + deploy + verify:

```bash
cd wene-mobile
EXPO_PUBLIC_API_BASE_URL="https://<your-worker>.workers.dev" npm run export:web
npm run deploy:pages
npm run verify:pages
```

## Verification Commands

The `verify:pages` flow checks these points:

- `/admin` bundle SHA256 matches local `dist` bundle
- `GET /v1/school/events` returns `200` and `application/json`
- `POST /api/users/register` is **not** `405`

Manual runtime checks:

```bash
BASE="https://<your-pages-domain>"

curl -sS -D - "$BASE/v1/school/events" -o /tmp/wene_events.json | sed -n '1p;/content-type/p'
head -c 160 /tmp/wene_events.json && echo

curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$BASE/api/users/register"
```

## Troubleshooting / Known Behaviors

- If `/v1/*` returns HTML, proxy routing is not applied (wrong artifact or redirects missing)
- Fetching `/_redirects` directly and seeing 404 can be normal on Pages; trust runtime behavior checks above
- Login/user state can persist in browser/device storage between runs; use private browsing for shared-device tests
- Web camera scan UI may be mocked in current PoC; scanning via phone camera / QR reader to open `/u/scan?eventId=...` is recommended

## Detailed Docs

- `wene-mobile/docs/CLOUDFLARE_PAGES.md`
- `wene-mobile/README_SCHOOL.md`
- `docs/DEVNET_SETUP.md`
- `docs/ARCHITECTURE.md`
- `api-worker/README.md`

## Prototype Context (for Reviewers)

This repository is a prototype/evaluation kit, not a production mainnet product.

- Purpose: reviewer reproducibility and independent verification
- Grant context: minimal; focus is operational and technical validation
- Public-good stance: open-source, auditable behavior, non-custodial design

## License

MIT (`/LICENSE`)
