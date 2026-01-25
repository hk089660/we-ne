const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const sessionId = 'debug-session';
const runId = process.env.DEBUG_RUN_ID || 'pre-fix';
const workspaceRoot = path.resolve(__dirname, '..');
const debugCmd = process.env.DEBUG_CMD;

function appendLog(hypothesisId, message, data) {
  // #region agent log
  const payload = {
    sessionId,
    runId,
    hypothesisId,
    location: 'scripts/debug_cargo_check.js',
    message,
    data,
    timestamp: Date.now(),
  };
  try {
    const logDir = '/Users/kira.haruki/GitHub/we-ne/.cursor';
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'debug.log');
    fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`);
  } catch (_) {
    // ignore file write errors
  }
  try {
    if (typeof fetch === 'function') {
      fetch(
        'http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ).catch(() => {});
    } else {
      const body = JSON.stringify(payload);
      const req = http.request(
        'http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );
      req.on('error', () => {});
      req.write(body);
      req.end();
    }
  } catch (_) {
    // ignore http errors
  }
  // #endregion
}

function runCmd(hypothesisId, cmd) {
  appendLog(hypothesisId, 'command start', {
    cmd,
    cwd: process.cwd(),
    execCwd: workspaceRoot,
  });
  try {
    const output = execSync(cmd, { stdio: 'pipe', cwd: workspaceRoot });
    const stdout = output?.toString?.() ?? '';
    appendLog(hypothesisId, 'command success', {
      cmd,
      stdoutPreview: stdout.slice(0, 2000),
      stdoutBytes: stdout.length,
    });
  } catch (error) {
    appendLog(hypothesisId, 'command failed', {
      cmd,
      code: error?.status ?? null,
      message: error?.message ?? 'unknown error',
      stdout: error?.stdout?.toString?.() ?? null,
      stderr: error?.stderr?.toString?.() ?? null,
    });
  }
}

runCmd('H1', 'cargo check -p grant_program');
runCmd('H2', 'anchor build');
runCmd('H3', 'anchor --version');
runCmd('H4', 'cargo --version');
runCmd('H5', 'rustc --version');
if (debugCmd) {
  runCmd('H6', debugCmd);
}