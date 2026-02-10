// wene-mobile/src/lib/joinToken.ts
export const JOIN_TOKEN_STORAGE_KEY = "wene:joinToken:v1";

function genToken(): string {
  // ブラウザのみ想定（Pages）
  // crypto.randomUUID が無い環境もあるので fallback
  const g = (globalThis as any);
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  return `jt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateJoinTokenWeb(): string | null {
  // SSR/Node 対策
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(JOIN_TOKEN_STORAGE_KEY);
    if (existing && existing.trim().length > 0) return existing.trim();

    const token = genToken();
    window.localStorage.setItem(JOIN_TOKEN_STORAGE_KEY, token);
    return token;
  } catch {
    // localStorage が使えない場合は null（この場合 wallet_required に落ちる）
    return null;
  }
}
