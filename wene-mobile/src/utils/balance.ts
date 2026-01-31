import type { BalanceItem } from "../types/balance";

// Returns today as YYYY-MM-DD in local time
export function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Accepts "YYYY/MM/DD" or ISO; returns Date or null
export function parseDate(s?: string): Date | null {
  if (!s) return null;
  // "YYYY/MM/DD"
  const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    if (!Number.isNaN(dt.getTime())) return dt;
    return null;
  }
  // ISO or other Date-parsable strings
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Days from today (00:00 local) to date (00:00 local)
export function daysUntil(date: Date): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function computeTodayUsable(expiresAt?: string): boolean {
  const d = parseDate(expiresAt);
  if (!d) return true; // no expiry => usable today (UX priority)
  // usable if expiry is today or later
  return daysUntil(d) >= 0;
}

export function isExpiringSoon(expiresAt?: string): boolean {
  const d = parseDate(expiresAt);
  if (!d) return false;
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  if (ms < 0) return false; // already expired
  return ms <= 48 * 60 * 60 * 1000;
}

export function sortBalances(items: BalanceItem[]): BalanceItem[] {
  // stable sort via index tie-breaker
  const indexed = items.map((it, idx) => ({ it, idx }));
  indexed.sort((a, b) => {
    const da = parseDate(a.it.expiresAt);
    const db = parseDate(b.it.expiresAt);
    const aHas = !!da;
    const bHas = !!db;

    // 1) items with expiry come first
    if (aHas !== bHas) return aHas ? -1 : 1;

    // 2) closer expiry first
    if (aHas && bHas && da && db) {
      const ad = da.getTime();
      const bd = db.getTime();
      if (ad !== bd) return ad - bd;
    }

    // 3) todayUsable true first
    const au = !!a.it.todayUsable;
    const bu = !!b.it.todayUsable;
    if (au !== bu) return au ? -1 : 1;

    // 4) stable by name
    const an = a.it.name ?? "";
    const bn = b.it.name ?? "";
    const byName = an.localeCompare(bn, "ja");
    if (byName !== 0) return byName;

    // 5) final stable index
    return a.idx - b.idx;
  });

  return indexed.map((x) => x.it);
}
