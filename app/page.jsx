"use client";
import { useEffect, useMemo, useState } from "react";
import { wieldFetch, CHAIN_ID, fmt } from "@/lib/wield";

const TNYL_DROP = process.env.NEXT_PUBLIC_TNYL_DROP || "";
const TNYL_TOKEN = process.env.NEXT_PUBLIC_TNYL_TOKEN || "";

const TABS = ["Trading","For Trade","Activity","Profile","Bubble","Chat","Settings"];

export default function Page() {
  const [active, setActive] = useState("Trading");
  const [packs, setPacks] = useState([]);
  const [verified, setVerified] = useState([]);
  const [ticker, setTicker] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("dark");
  const [wallet, setWallet] = useState("");

  // Theme switch
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial fetcher – Trading + Ticker
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Nya/aktiva packs
        const pk = await wieldFetch(`vibe/boosterbox/recent?limit=24&includeMetadata=true&chainId=${CHAIN_ID}`);
        setPacks(pk?.data || pk || []);

        // “Verified” – pack-level (filtrera på flag i metadata när den finns)
        const v = (pk?.data || pk || []).filter(p => (p?.metadata?.verified === true));
        setVerified(v.slice(0, 12));

        // Ticker (visar bara EPIC/LEGENDARY pulls)
        const recent = await wieldFetch(`vibe/boosterbox/recent?limit=100&includeMetadata=true&status=opened&rarityGreaterThan=2&chainId=${CHAIN_ID}`);
        const items = (recent?.data || recent || []).map(x => ({
          id: x.id ?? `${x.contractAddress}-${x.tokenId ?? Math.random()}`,
          txt: `${short(x?.owner)} pulled ${rarityName(x?.rarity)} in ${x?.collectionName || short(x?.contractAddress)}`,
        }));
        setTicker(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packs;
    return packs.filter(p =>
      (p.collectionName || "").toLowerCase().includes(q) ||
      (p.creator?.handle || "").toLowerCase().includes(q)
    );
  }, [packs, query]);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="row">
          <div className="logo">
            <div className="logo-badge">🂡</div>
            <div>VibeMarket <span style={{opacity:.7}}>Tracker</span></div>
            <div className="pill">VibePoints</div>
          </div>
          <div className="row">
            <div className="wallet-chip">{wallet ? short(wallet) : "Not Connected"}</div>
            <button className="btn" onClick={connectWallet}>Connect</button>
            <button className="btn ghost" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>
        <div className="tabbar">
          {TABS.map(t => (
            <button key={t} className={`tab ${active === t ? "active":""}`} onClick={() => setActive(t)}>
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Ticker */}
      <div className="wrapper">
        <div className="ticker-wrap panel">
          <div className="ticker">
            {(ticker.length ? ticker : [{id:"x",txt:"Waiting for epic/legendary pulls…"}]).map(i => (
              <div key={i.id} className="chip"> {i.txt}</div>
            ))}
            {/* Duplicate for seamless loop */}
            {ticker.map(i => (
              <div key={i.id + "-dup"} className="chip"> {i.txt}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="wrapper">
        <div className
