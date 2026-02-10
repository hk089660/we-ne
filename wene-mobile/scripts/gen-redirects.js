/**
 * Generate Cloudflare Pages _redirects so /api/* and /v1/* proxy to Workers.
 * Required env:
 *   EXPO_PUBLIC_SCHOOL_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL
 */
const fs = require("fs");
const path = require("path");

const base =
  process.env.EXPO_PUBLIC_SCHOOL_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "";

const distDir = path.join(process.cwd(), "dist");
const redirectsPath = path.join(distDir, "_redirects");

function fail(msg) {
  console.error(`[gen-redirects] ERROR: ${msg}`);
  process.exit(1);
}

if (!base) {
  fail(
    `API base URL is required. Set EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_SCHOOL_API_BASE_URL.
Example: https://we-ne-school-api.<subdomain>.workers.dev
Without this, claim POST requests hit Pages and return 405 Method Not Allowed.`
  );
}

if (!fs.existsSync(distDir)) {
  fail(`dist directory not found. Run "npx expo export -p web" first.`);
}

const lines =
  [
    `/api/*  ${base}/api/:splat  200`,
    `/v1/*   ${base}/v1/:splat   200`,
    `/*      /index.html         200`,
  ].join("\n") + "\n";

fs.writeFileSync(redirectsPath, lines, "utf8");
console.log(`[gen-redirects] wrote ${redirectsPath}\n${lines}`);
