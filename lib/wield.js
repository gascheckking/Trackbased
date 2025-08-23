// Publikt chainId (Base = 8453)
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453);

// Anropa alltid via din server-proxy: /api/wield/<path>
export async function wieldFetch(path, init = {}) {
  const clean = String(path || "").replace(/^\/?/, "");
  const res = await fetch(`/api/wield/${clean}`, {
    ...init,
    cache: "no-store",
  });
  if (!res.ok) {
    let t = "";
    try { t = await res.text(); } catch {}
    throw new Error(`Wield ${res.status} ${t}`.trim());
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

// Numeriskt USD-värde
export function usdNum(x) {
  const v = x?.usdPrice ?? x?.priceUsd ?? x?.price_usd ?? x?.priceUSD ?? x?.metadata?.usdPrice ?? null;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
