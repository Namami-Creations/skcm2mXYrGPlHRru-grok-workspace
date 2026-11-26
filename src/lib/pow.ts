const TOKEN_KEY = "oracle_black_voter_token_v2";

export function getOrInitToken(): string {
  if (typeof window === "undefined") return "ssr-default-token";
  const existing = window.localStorage.getItem(TOKEN_KEY);
  if (existing && /^[a-zA-Z0-9_-]{12,64}$/.test(existing)) return existing;
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  const token =
    "ob_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  window.localStorage.setItem(TOKEN_KEY, token);
  return token;
}

async function solvePrefixedPow(prefix: string): Promise<{ nonce: number; hashPrefix: string }> {
  const encoder = new TextEncoder();
  let nonce = 0;
  while (nonce < 50000) {
    const data = encoder.encode(`${prefix}:${nonce}`);
    const buf = await window.crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(buf);
    if (bytes[0] === 0) {
      const hex = Array.from(bytes.slice(0, 6))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return { nonce, hashPrefix: hex };
    }
    nonce += 1;
  }
  return { nonce: 0, hashPrefix: "timeout" };
}

export async function solveBallotPow(
  marketId: string,
  outcomeId: string,
  token: string,
): Promise<{ nonce: number; hashPrefix: string }> {
  return solvePrefixedPow(`${marketId}:${outcomeId}:${token}`);
}

export async function solveWallPow(
  token: string,
): Promise<{ nonce: number; hashPrefix: string }> {
  return solvePrefixedPow(`wall:${token}`);
}
