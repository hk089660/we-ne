/**
 * 残高一覧用のアイテム型
 * expiresAt は "YYYY/MM/DD" または ISO 8601 文字列で受け付ける
 */

export type BalanceStatus = "active" | "expiring" | "frozen";

export type BalanceSource = "credit" | "spl";

export type BalanceItem = {
  id: string;
  name: string;
  issuer: string;
  amountText: string; // already formatted for UI (e.g. "1,250" / "12.35" / "…")
  unit: string;       // "円" / "pt" / "枚" / "USDC" / "SPL"
  expiresAt?: string; // "YYYY/MM/DD" or ISO string
  status?: BalanceStatus;
  todayUsable?: boolean;
  source?: BalanceSource;
};
