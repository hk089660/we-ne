#!/usr/bin/env node
/**
 * Web3 スモークテストを Node で実行（アプリ内と同じ A–E ステップ）
 * 実行: cd wene-mobile && node scripts/run-web3-smoke.js
 */
const {
  PublicKey,
  Keypair,
  Transaction,
  Connection,
  SystemProgram,
} = require('@solana/web3.js');

const STEP_LABELS = {
  A: "new PublicKey('11111...')",
  B: 'Keypair.generate()',
  C: 'Transaction + feePayer + recentBlockhash + serialize',
  D: "Connection('...').getLatestBlockhash()",
  E: 'SystemProgram.transfer + tx.add(ix) + serialize',
};

function runStepA() {
  new PublicKey('11111111111111111111111111111111');
}

function runStepB() {
  return Keypair.generate();
}

function runStepC() {
  const tx = new Transaction();
  const feePayer = new PublicKey('11111111111111111111111111111111');
  tx.feePayer = feePayer;
  tx.recentBlockhash = 'EtW9ABQYJV7dNk1wgWXzYaEPp5TcyQxsiJEDHQA2DXP';
  return tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

async function runStepD() {
  const conn = new Connection('https://api.devnet.solana.com');
  return conn.getLatestBlockhash();
}

function runStepE() {
  const tx = new Transaction();
  const from = new PublicKey('11111111111111111111111111111111');
  const to = new PublicKey('11111111111111111111111111111111');
  tx.feePayer = from;
  tx.recentBlockhash = 'EtW9ABQYJV7dNk1wgWXzYaEPp5TcyQxsiJEDHQA2DXP';
  const ix = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: 0,
  });
  tx.add(ix);
  return tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

async function main() {
  console.log('[WEB3_SMOKE] Node run: Steps A–E\n');

  for (const step of ['A', 'B', 'C', 'D', 'E']) {
    const label = STEP_LABELS[step];
    try {
      if (step === 'A') runStepA();
      else if (step === 'B') runStepB();
      else if (step === 'C') runStepC();
      else if (step === 'D') await runStepD();
      else if (step === 'E') runStepE();
      console.log(`[WEB3_SMOKE] Step ${step}: OK - ${label}`);
    } catch (e) {
      console.error(`[WEB3_SMOKE] step=${step} error obj`, e);
      console.error(`[WEB3_SMOKE] step=${step} error stack`, e?.stack);
      console.log(`[WEB3_SMOKE] Step ${step}: FAIL - ${(e?.message || String(e)).slice(0, 100)}`);
      process.exit(1);
    }
  }

  console.log('\n[WEB3_SMOKE] All steps OK (Node).');
}

main().catch((e) => {
  console.error('[WEB3_SMOKE] main error', e);
  process.exit(1);
});
