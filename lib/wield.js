export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "8453";

/** Proxied fetch till Wield via vår serverless route */
export async function wieldFetch(path, init = {}) {
  // path ex: "vibe/boosterbox/recent?limit=20"
  const url = `/api/wield/${path}`;
  const res = await fetch(url, {
    // nästa fetch körs på server i SSR eller klient – funkar i båda
    cache: "no-store",
    ...init
  });
  if (!res.ok) throw new Error(`Wield error ${res.status}`);
  return res.json();
}

/** Hjälp för att formatera USD el ETH */
export const fmt = {
  usd: (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
  eth: (n) => `${Number(n || 0).toFixed(4)} ETH`
};
