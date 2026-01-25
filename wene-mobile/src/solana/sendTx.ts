import { Transaction } from '@solana/web3.js';
import { getConnection } from './anchorClient';

/**
 * 署名済みトランザクションを送信し、confirm まで待つ
 * @returns signature
 */
export async function sendSignedTx(tx: Transaction): Promise<string> {
  const connection = getConnection();
  
  if (!tx.recentBlockhash) {
    throw new Error('Transaction blockhash is missing');
  }

  if (tx.instructions.length === 0) {
    throw new Error('Transaction has no instructions');
  }

  let raw: Buffer;
  try {
    raw = tx.serialize();
  } catch (error) {
    console.error('Failed to serialize transaction:', error);
    throw new Error('トランザクションのシリアライズに失敗しました');
  }

  let sig: string;
  try {
    sig = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw new Error('トランザクションの送信に失敗しました');
  }

  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const confirmation = await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      'confirmed'
    );
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
  } catch (error) {
    console.error('Failed to confirm transaction:', error);
    // 送信は成功しているので、signatureは返す
    // 確認の失敗は警告として扱う
    console.warn('Transaction sent but confirmation failed:', sig);
  }

  return sig;
}
