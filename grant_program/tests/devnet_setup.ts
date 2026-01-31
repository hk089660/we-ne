/**
 * Devnet セットアップスクリプト
 *
 * grant_program を devnet にデプロイ済みであること。
 * このスクリプトは: mint 作成 → create_grant → fund_grant を実行し、
 * アプリの devnetConfig に貼り付ける値を出力する。
 *
 * 実行:
 *   cd grant_program && ANCHOR_PROVIDER_URL=https://solana-devnet.api.onfinality.io/public ANCHOR_WALLET=~/.config/solana/id.json npx ts-node tests/devnet_setup.ts
 *
 * 前提: ~/.config/solana/id.json に devnet 用のキーペアがあり、SOL があること。
 *       solana airdrop 2 で devnet SOL を取得可能。
 */
import fs from 'fs';
import path from 'path';

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { GrantProgram } from '../target/types/grant_program';

const DEVNET_RPC = process.env.ANCHOR_PROVIDER_URL || 'https://solana-devnet.api.onfinality.io/public';
const WALLET_PATH = process.env.ANCHOR_WALLET || path.join(process.env.HOME!, '.config/solana/id.json');

function u64LE(n: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n, 0);
  return b;
}

async function main() {
  console.log('[devnet_setup] RPC:', DEVNET_RPC);
  console.log('[devnet_setup] Wallet:', WALLET_PATH);

  const walletKeypair = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(walletKeypair));

  const connection = new Connection(DEVNET_RPC);
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: 'confirmed' }
  );
  anchor.setProvider(provider);

  // Airdrop しておく（devnet）
  try {
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance < 0.5 * LAMPORTS_PER_SOL) {
      console.log('[devnet_setup] 残高不足、airdrop 実行...');
      const sig = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
    }
    console.log('[devnet_setup] 残高:', (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL, 'SOL');
  } catch (e) {
    console.warn('[devnet_setup] airdrop 失敗（続行）:', (e as Error).message);
  }

  const idlPath = path.resolve(__dirname, '../target/idl/grant_program.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  const program = new Program(idl as any, provider) as Program<GrantProgram>;

  const authority = wallet.publicKey;
  const grantId = BigInt(1);

  // 1. Create mint
  console.log('[devnet_setup] mint 作成中...');
  const mint = await createMint(
    connection,
    wallet,
    authority,
    null,
    6 // decimals
  );
  console.log('[devnet_setup] mint:', mint.toBase58());

  // 2. PDA
  const [grantPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('grant'),
      authority.toBuffer(),
      mint.toBuffer(),
      u64LE(grantId),
    ],
    program.programId
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), grantPda.toBuffer()],
    program.programId
  );

  // 3. create_grant（startTs は必ず過去。端末時計が未来だと GrantNotStarted になる）
  const periodSeconds = BigInt(2592000); // 30日
  const nowSec = Math.floor(Date.now() / 1000);
  const startTs = BigInt(Math.min(nowSec - 86400, 1738281600)); // 1日前 または 2025-01-30 のいずれか早い方
  const amountPerPeriod = BigInt(1000); // 1,000 tokens (6 decimals)
  const expiresAt = BigInt(0);

  console.log('[devnet_setup] create_grant 実行中...');
  await program.methods
    .createGrant(
      new anchor.BN(grantId.toString()),
      new anchor.BN(amountPerPeriod.toString()),
      new anchor.BN(periodSeconds.toString()),
      new anchor.BN(startTs.toString()),
      new anchor.BN(expiresAt.toString())
    )
    .accounts({
      grant: grantPda,
      mint,
      vault: vaultPda,
      authority,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    } as any)
    .rpc();
  console.log('[devnet_setup] create_grant 完了');

  // 4. Authority の ATA を作成し、mint する
  let fromAta;
  try {
    fromAta = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      authority
    );
  } catch (e) {
    console.error('[devnet_setup] getOrCreateAssociatedTokenAccount failed:', (e as Error).message);
    throw e;
  }
  const fundAmount = BigInt(100_000); // 100,000 tokens
  await mintTo(
    connection,
    wallet,
    mint,
    fromAta.address,
    authority,
    fundAmount
  );
  console.log('[devnet_setup] mintTo 完了:', fundAmount.toString());

  // 5. fund_grant（vault の反映を待ってから取得）
  await new Promise((r) => setTimeout(r, 2000));
  const vaultBeforeFund = await getAccount(connection, vaultPda).catch(() => null);
  const vaultBalanceBefore = vaultBeforeFund ? vaultBeforeFund.amount : BigInt(0);

  console.log('[devnet_setup] fund_grant 実行中...');
  await program.methods
    .fundGrant(new anchor.BN(fundAmount.toString()))
    .accounts({
      grant: grantPda,
      mint,
      vault: vaultPda,
      fromAta: fromAta.address,
      funder: authority,
      authority,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
  console.log('[devnet_setup] fund_grant 完了');

  await new Promise((r) => setTimeout(r, 2000));
  const vaultAccount = await getAccount(connection, vaultPda).catch((e) => {
    console.error('[devnet_setup] vault getAccount failed:', (e as Error).message);
    throw e;
  });
  const vaultBalanceAfter = vaultAccount.amount;
  const authoritySolBalance = await connection.getBalance(authority);

  const config = {
    authority: authority.toBase58(),
    mint: mint.toBase58(),
    grantId: grantId.toString(),
    vault: vaultPda.toBase58(),
    grantPda: grantPda.toBase58(),
    startTs: startTs.toString(),
    periodSeconds: periodSeconds.toString(),
  };

  // ---------- 検証ログ（失敗しないチェック、セットアップ完了時必ず出力） ----------
  console.log('\n========== 検証ログ ==========');
  console.log('programId:', program.programId.toBase58());
  console.log('authority:', config.authority);
  console.log('mint:', config.mint);
  console.log('grantId:', config.grantId);
  console.log('vault:', config.vault);
  console.log('vault token balance (before fund_grant):', vaultBalanceBefore.toString());
  console.log('vault token balance (after fund_grant):', vaultBalanceAfter.toString());
  if (vaultBalanceAfter === BigInt(0)) {
    console.warn('*** WARNING: vault balance が 0 です。fund_grant を確認してください ***');
  } else if (vaultBalanceAfter <= vaultBalanceBefore) {
    console.warn('*** WARNING: vault balance が fund_grant 後に増えていません ***');
  }
  const solBal = (authoritySolBalance / LAMPORTS_PER_SOL).toFixed(4);
  console.log('authority SOL balance:', solBal, 'SOL');
  if (authoritySolBalance < 0.01 * LAMPORTS_PER_SOL) {
    console.warn('*** WARNING: authority SOL 不足。手数料用に 0.01 SOL 以上を推奨 ***');
  }
  console.log('================================\n');

  // ---------- _RAW 形式（アプリ devnetConfig.ts にそのまま貼り付け） ----------
  console.log('========== _RAW（wene-mobile/src/solana/devnetConfig.ts に貼り付け） ==========');
  console.log(`
const _RAW = {
  authority: '${config.authority}',
  mint: '${config.mint}',
  grantId: '${config.grantId}',
  startTs: '${config.startTs}',
  periodSeconds: '${config.periodSeconds}',
};
`);
  console.log('========== 完了 ==========');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
