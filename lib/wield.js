// lib/wield.js

// Publikt chainId (Base = 8453)
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453);

// Anropa alltid via din server-proxy: /api/wield/<path>
export async function wieldFetch(path, init = {}) {
  const clean = String(path || "").replace(/^\/?/, ""); // ta bort ev. ledande /
  const res = await fetch(`/api/wield/${clean}`, {
    ...init,
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await safeText(res);
    throw new Error(`Wield ${res.status} ${t || ""}`.trim());
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  // fallback om API svarar text
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

// Liten formatter (om du behöver)
export function fmt(n, d = 2) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
}

// intern hjälpare
async function safeText(r) {
  try { return await r.text(); } catch { return ""; }
}
