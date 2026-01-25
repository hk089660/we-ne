import type { Transaction } from '@solana/web3.js';

type Resolve = (tx: Transaction) => void;
type Reject = (err: Error) => void;

let pending: { resolve: Resolve; reject: Reject } | null = null;

export function setPendingSignTx(resolve: Resolve, reject: Reject): void {
  pending = { resolve, reject };
}

export function resolvePendingSignTx(tx: Transaction): void {
  if (pending) {
    pending.resolve(tx);
    pending = null;
  }
}

export function rejectPendingSignTx(err: Error): void {
  if (pending) {
    pending.reject(err);
    pending = null;
  }
}

export function hasPendingSignTx(): boolean {
  return pending !== null;
}
