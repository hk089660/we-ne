#!/usr/bin/env node
/**
 * Devnet テスト送金スクリプト
 *
 * Phantom ウォレットに devnet SOL を airdrop してトランザクション手数料を用意する。
 * アプリと同じ RPC（OnFinality devnet）を使用。
 *
 * 使い方:
 *   node scripts/devnet-faucet.js <PUBLIC_KEY>
 *   例: node scripts/devnet-faucet.js 4yYYMmQEzHsWY7PHNuWjF8hBzP3n5F2k...
 *
 * PUBLIC_KEY は Phantom の「受け取り」画面で接続したウォレットのアドレス。
 */
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const DEVNET_RPC = 'https://solana-devnet.api.onfinality.io/public';
const AIRDROP_AMOUNT = 2 * LAMPORTS_PER_SOL; // 2 SOL

async function main() {
  const pubkeyStr = process.argv[2];
  if (!pubkeyStr) {
    console.error('Usage: node scripts/devnet-faucet.js <PUBLIC_KEY>');
    console.error('');
    console.error('例: Phantom で接続後、アプリの「受け取り」画面で表示される');
    console.error('    ウォレットアドレスを指定してください。');
    process.exit(1);
  }

  let pubkey;
  try {
    pubkey = new PublicKey(pubkeyStr);
  } catch (e) {
    console.error('無効な Public Key:', pubkeyStr);
    process.exit(1);
  }

  const conn = new Connection(DEVNET_RPC);

  console.log('[devnet-faucet] RPC:', DEVNET_RPC);
  console.log('[devnet-faucet] 送金先:', pubkey.toBase58());

  // 現在残高を確認
  try {
    const before = await conn.getBalance(pubkey);
    console.log('[devnet-faucet] 現在残高:', before / LAMPORTS_PER_SOL, 'SOL');
  } catch (e) {
    console.warn('[devnet-faucet] 残高取得失敗:', e.message);
  }

  // Airdrop 実行
  try {
    console.log('[devnet-faucet] Airdrop 実行中...');
    const sig = await conn.requestAirdrop(pubkey, AIRDROP_AMOUNT);
    console.log('[devnet-faucet] 署名:', sig);

    console.log('[devnet-faucet] 確認待ち...');
    await conn.confirmTransaction(sig, 'confirmed');
    console.log('[devnet-faucet] 確認完了');
  } catch (e) {
    console.error('[devnet-faucet] Airdrop 失敗:', e.message);
    if (e.message?.includes('429') || e.message?.includes('rate')) {
      console.error('');
      console.error('レート制限に達しました。数分後に再試行するか、');
      console.error('https://faucet.solana.com から手動で取得してください。');
    }
    process.exit(1);
  }

  // 送金後の残高
  try {
    const after = await conn.getBalance(pubkey);
    console.log('[devnet-faucet] 送金後残高:', after / LAMPORTS_PER_SOL, 'SOL');
  } catch (e) {
    console.warn('[devnet-faucet] 残高取得失敗:', e.message);
  }

  console.log('');
  console.log('[devnet-faucet] 完了。Phantom アプリで claim を再試行してください。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
