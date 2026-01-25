import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { getRpcUrl, GRANT_PROGRAM_ID } from './config';
import { Platform } from 'react-native';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'anchorClient.ts:5',message:'importing IDL JSON',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
// #endregion

import idl from '../idl/grant_program.json';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'anchorClient.ts:9',message:'IDL JSON imported',data:{hasIdl:!!idl,hasAddress:!!idl?.address},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
// #endregion

/**
 * Solana接続を取得
 */
export const getConnection = (): Connection => {
  const rpcUrl = getRpcUrl();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'anchorClient.ts:17',message:'getConnection called',data:{rpcUrl,platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  return new Connection(rpcUrl, 'confirmed');
};

/**
 * Anchor Providerを取得（readonly wallet）
 * 署名しないので、ダミーキーペアで問題ない
 */
export const getProvider = (): AnchorProvider => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'anchorClient.ts:26',message:'getProvider called - before Keypair.generate',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const connection = getConnection();
  try {
    // ダミーキーペア（署名しないので問題ない）
    const keypair = Keypair.generate();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'anchorClient.ts:32',message:'Keypair.generate success',data:{hasKeypair:!!keypair,publicKey:keypair.publicKey.toBase58().substring(0,8)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const dummyWallet = new Wallet(keypair);
    return new AnchorProvider(connection, dummyWallet, {
      commitment: 'confirmed',
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'anchorClient.ts:40',message:'Keypair.generate error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw error;
  }
};

/**
 * Grant Programインスタンスを取得
 * 注意: Program コンストラクタは (idl, provider) の形式
 * programId は IDL に含まれているため、引数として渡す必要はない
 */
export const getProgram = (): Program => {
  const provider = getProvider();
  // Program コンストラクタ: (idl, provider)
  // IDL に programId が含まれているため、別途指定する必要はない
  return new Program(idl as any, provider) as Program;
};

// IDL の型定義をエクスポート（必要に応じて）
export type GrantProgram = Program;
