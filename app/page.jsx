"use client";
import { useEffect, useMemo, useState } from "react";
import { wieldFetch, CHAIN_ID } from "../lib/wield";

// Web3Modal hook to open the modal (QR / choose wallet)
import { useWeb3Modal } from "@web3modal/react";
// Wagmi hooks to read account and disconnect
import { useAccount, useDisconnect } from "wagmi";

const TABS = ["Trading", "For Trade", "Activity", "Profile", "Bubble", "Chat", "Settings", "Bought"];

export default function Page() {
  const [active, setActive] = useState("Trading");
  const [loading, setLoading] = useState(false);

  // marketplace data
  const [packs, setPacks] = useState([]);
  const [verified, setVerified] = useState([]);
  const [ticker, setTicker] = useState([]);

  // filters
  const [query, setQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // theme
  const [theme, setTheme] = useState("dark");

  // wallet via wagmi/web3modal
  const { open } = useWeb3Modal();      // opens modal (browser/QR/phone)
  const { address, isConnected } = useAccount(); // current wallet
  const { disconnect } = useDisconnect();        // disconnect handler

  // Theme switch
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial fetcher – Packs + Verified + Activity
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // PACKS (marketplace)
        const packsRes = await wieldFetch(`vibe/boosterbox/recent?limit=120&includeMetadata=true&chainId=${CHAIN_ID}`);
        const packsList = packsRes?.data || packsRes || [];
        setPacks(packsList);

        const verifiedList = packsList.filter(p => p?.metadata?.verified === true);
        setVerified(verifiedList.slice(0, 18));

        // ACTIVITY (pulls) – openings first, fallback to opened boxes
        let actList = [];
        try {
          const openings = await wieldFetch(`vibe/openings/recent?limit=60&includeMetadata=true&chainId=${CHAIN_ID}`);
          actList = openings?.data || openings || [];
        } catch {
          const fb = await wieldFetch(`vibe/boosterbox/recent?limit=120&includeMetadata=true&status=opened&chainId=${CHAIN_ID}`);
          actList = fb?.data || fb || [];
        }
        const activityItems = actList.map(x => ({
          id: x.id ?? `${x.contractAddress}-${x.tokenId ?? Math.random()}`,
          owner: x.owner || x.to || "",
          collection: x.collectionName || x.series || "Pack",
          tokenId: x.tokenId ?? x.id ?? "—",
          rarity: rarityName(x.rarity),
          priceUsd: pickUsd(x),
          image: x.image || x.metadata?.image,
          ts: x.timestamp || x.time || Date.now()
        }));
        setTicker(activityItems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // MARKET filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (packs || []).filter(p => {
      const creator = (p?.creator || "").toLowerCase();
      const name = (p?.name || p?.collectionName || "").toLowerCase();
      const r = rarityName(p?.rarity || p?.metadata?.rarity || "");
      const isVer = p?.metadata?.verified === true;

      const passQuery = !q || creator.includes(q) || name.includes(q);
      const passVerified = !verifiedOnly || isVer;
      const passRarity = rarityFilter === "ALL" || r === rarityFilter;

      return passQuery && passVerified && passRarity;
    });
  }, [packs, query, verifiedOnly, rarityFilter]);

  // verified creators (simple)
  const verifiedCreators = useMemo(() => {
    const map = new Map();
    (packs || []).forEach(p => {
      if (p?.metadata?.verified) {
        const key = p.creator || p.creatorAddress || "unknown";
        const prev = map.get(key) || { creator: key, name: p.creator || key, count: 0 };
        prev.count += 1;
        map.set(key, prev);
      }
    });
    return [...map.values()].sort((a,b) => b.count - a.count).slice(0, 12);
  }, [packs]);

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
            {/* Wallet chip */}
            <div className="wallet-chip">
              {isConnected ? short(address) : "Not Connected"}
            </div>

            {/* Connect / Disconnect */}
            {isConnected ? (
              <button className="btn" onClick={() => disconnect()}>
                Disconnect
              </button>
            ) : (
              <button className="btn" onClick={() => open()}>
                Connect
              </button>
            )}

            {/* Theme toggle */}
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
          <div className="ticker ticker-rtl">
            {(ticker.length ? ticker : [{id:"x",owner:"someone",collection:"",tokenId:"",rarity:"",priceUsd:""}]).map(i => (
              <div key={i.id} className="chip">
                {`${short(i.owner)} pulled ${i.rarity || ""} in ${i.collection || "—"} #${i.tokenId || "—"}${i.priceUsd ? ` (${i.priceUsd})` : ""}`}
              </div>
            ))}
            {ticker.map(i => (
              <div key={i.id + "-dup"} className="chip">
                {`${short(i.owner)} pulled ${i.rarity || ""} in ${i.collection || "—"} #${i.tokenId || "—"}${i.priceUsd ? ` (${i.priceUsd})` : ""}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body (keep your sections; trimmed here to focus on wallet + lists) */}
      <div className="wrapper">
        <div className="grid">
          <div>
            {active === "Trading" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Marketplace (Vibe-synced)</div>
                  <div className="row">
                    <input className="input" placeholder="Search packs/creators…" value={query} onChange={e=>setQuery(e.target.value)} />
                    <select className="select" value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}>
                      <option value="ALL">All</option>
                      <option value="COMMON">Common</option>
                      <option value="RARE">Rare</option>
                      <option value="EPIC">Epic</option>
                      <option value="LEGENDARY">Legendary</option>
                    </select>
                    <label className="row" style={{gap:6}}>
                      <input type="checkbox" checked={verifiedOnly} onChange={e=>setVerifiedOnly(e.target.checked)} />
                      <span>Verified only</span>
                    </label>
                    <a className="btn ghost" href="https://vibechain.com/market" target="_blank" rel="noreferrer">Open VibeMarket</a>
                  </div>
                </div>
                {loading ? <div>Loading…</div> : <Grid packs={filtered} />}
              </section>
            )}

            {active === "Activity" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Recent Pulls</div>
                  <button className="btn" onClick={refreshActivity(setTicker)}>Refresh</button>
                </div>
                <div className="cards" style={{gridTemplateColumns:"1fr"}}>
                  {(ticker.length ? ticker : [{id:"y"}]).slice(0,50).map(i => (
                    <div key={i.id} className="card row" style={{padding:10}}>
                      {i.image ? (
                        <img className="thumb" alt="" src={i.image} style={{width:40,height:40,borderRadius:8}} />
                      ) : (
                        <div className="thumb" style={{width:40,height:40,borderRadius:8}} />
                      )}
                      <div className="grow">
                        <div className="title">{short(i.owner)} pulled</div>
                        <div className="sub">
                          <span className="linklike">{i.collection}</span> • #{i.tokenId}
                          {" "}{rarityIcons(i.rarity)}{i.priceUsd ? ` (${i.priceUsd})` : ""}
                        </div>
                      </div>
                      <div className="muted">{i.ts ? new Date(i.ts).toLocaleTimeString() : ""}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column – Verified + Creators */}
          <aside className="panel">
            <div className="panel-head">
              <div className="panel-title">Verified by VibeMarket</div>
              <a className="btn ghost" href="https://vibechain.com/market" target="_blank" rel="noreferrer">All</a>
            </div>
            <div className="cards">
              {(verified.length ? verified : packs.slice(0,8)).map(pack => (
                <PackSmall key={keyFor(pack)} pack={pack} />
              ))}
            </div>

            <div className="panel" style={{marginTop:12}}>
              <div className="panel-head">
                <div className="panel-title">Verified Creators</div>
              </div>
              <div className="cards" style={{gridTemplateColumns:"1fr"}}>
                {verifiedCreators.length ? verifiedCreators.map(c => (
                  <div key={c.creator} className="card row" style={{padding:"10px"}}>
                    <div className="grow">
                      <div className="title truncate">{c.name}</div>
                      <div className="muted">{c.creator}</div>
                    </div>
                    <div className="badge">{c.count}</div>
                  </div>
                )) : <div className="card">No verified creators found.</div>}
              </div>
            </div>
          </aside>
        </div>

        <div className="footer">
          Built for the Vibe community • Prototype • <a href="https://vibechain.com/market" target="_blank" rel="noreferrer">VibeMarket</a> • Created by <a href="https://x.com/spawnizz" target="_blank" rel="noreferrer">@spawnizz</a>
        </div>
      </div>
    </>
  );
}

/* ---------------- Helpers & small components ---------------- */

function refreshActivity(setTicker) {
  return async () => {
    try {
      let list = [];
      try {
        const openings = await wieldFetch(`vibe/openings/recent?limit=60&includeMetadata=true&chainId=${CHAIN_ID}`);
        list = openings?.data || openings || [];
      } catch {
        const fb = await wieldFetch(`vibe/boosterbox/recent?limit=120&includeMetadata=true&status=opened&chainId=${CHAIN_ID}`);
        list = fb?.data || fb || [];
      }
      const items = list.map(x => ({
        id: x.id ?? `${x.contractAddress}-${x.tokenId ?? Math.random()}`,
        owner: x.owner || x.to || "",
        collection: x.collectionName || x.series || "Pack",
        tokenId: x.tokenId ?? x.id ?? "—",
        rarity: rarityName(x.rarity),
        priceUsd: pickUsd(x),
        image: x.image || x.metadata?.image,
        ts: x.timestamp || x.time || Date.now()
      }));
      setTicker(items);
    } catch (e) {
      console.error(e);
    }
  };
}

function rarityName(r) {
  const n = String(r || "").toUpperCase();
  if (["4","LEGENDARY"].includes(n)) return "LEGENDARY";
  if (["3","EPIC"].includes(n)) return "EPIC";
  if (["2","RARE"].includes(n)) return "RARE";
  if (["1","COMMON"].includes(n)) return "COMMON";
  return (["COMMON","RARE","EPIC","LEGENDARY"].includes(n) ? n : "COMMON");
}
function rarityIcons(r) {
  const n = rarityName(r);
  if (n === "LEGENDARY") return " ★★★★";
  if (n === "EPIC")      return " ★★★";
  if (n === "RARE")      return " ★★";
  return " ★";
}
function pickUsd(x) {
  const val = x?.usdPrice ?? x?.priceUsd ?? x?.price_usd ?? x?.priceUSD ?? null;
  if (val == null) return "";
  const num = Number(val);
  if (Number.isNaN(num)) return "";
  return `$${num.toFixed(num >= 100 ? 0 : 2)}`;
}
function short(x = "") {
  if (!x || typeof x !== "string") return "";
  return x.length > 10 ? `${x.slice(0,6)}…${x.slice(-4)}` : x;
}
function keyFor(p) {
  return p?.id || `${p?.contractAddress || "x"}-${p?.tokenId || p?.name || Math.random()}`;
}

function Grid({ packs = [] }) {
  if (!packs.length) return <div className="card">No packs found.</div>;
  return (
    <div className="cards">
      {packs.map(p => <PackCard key={keyFor(p)} pack={p} />)}
    </div>
  );
}

function PackCard({ pack }) {
  const name = pack?.name || pack?.collectionName || "Pack";
  const creator = pack?.creator || "";
  const img = pack?.image || pack?.metadata?.image || "";
  const isVerified = pack?.metadata?.verified === true;
  const link = pack?.url || pack?.metadata?.url || "https://vibechain.com/market";
  const rarity = rarityName(pack?.rarity || pack?.metadata?.rarity || "");

  return (
    <a className="card pack" href={link} target="_blank" rel="noreferrer">
      {img ? <img className="thumb lg" alt="" src={img} /> : <div className="thumb lg" style={{background:"var(--bg-1)"}} />}
      <div className="meta">
        <div className="row-between">
          <div className="title" style={{display:"flex",alignItems:"center",gap:6}}>
            {name}
            {isVerified && (
              <img
                alt="verified"
                src="https://vibechain.com/api/proxy?url=https%3A%2F%2Fwieldcd.net%2Fcdn-cgi%2Fimage%2Ffit%3Dcontain%2Cf%3Dauto%2Cw%3D168%2Fhttps%253A%252F%252Fvibechain.com%252Fvibemarket%252Fassets%252Ficons%252Fseal1.png"
                style={{width:12,height:12}}
              />
            )}
          </div>
          <span className="badge">{rarity}</span>
        </div>
        <div className="sub">{short(creator)}</div>
      </div>
    </a>
  );
}

function PackSmall({ pack }) {
  const name = pack?.name || pack?.collectionName || "Pack";
  const img = pack?.image || pack?.metadata?.image || "";
  const link = pack?.url || pack?.metadata?.url || "https://vibechain.com/market";
  const isVerified = pack?.metadata?.verified === true;

  return (
    <a className="card row" href={link} target="_blank" rel="noreferrer">
      {img ? <img className="thumb" alt="" src={img} /> : <div className="thumb" style={{background:"var(--bg-1)"}} />}
      <div className="grow">
        <div className="title truncate" style={{display:"flex",alignItems:"center",gap:6}}>
          {name}
          {isVerified && (
            <img
              alt="verified"
              src="https://vibechain.com/api/proxy?url=https%3A%2F%2Fwieldcd.net%2Fcdn-cgi%2Fimage%2Ffit%3Dcontain%2Cf%3Dauto%2Cw%3D168%2Fhttps%253A%252F%252Fvibechain.com%252Fvibemarket%252Fassets%252Ficons%252Fseal1.png"
              style={{width:12,height:12}}
            />
          )}
        </div>
        <div className="muted">View</div>
      </div>
    </a>
  );
}

function QuickBuy() { return null; } // borttagen tills token används
function Placeholder({ text }) { return <div className="card">{text}</div>; }

/* -------- For Trade (lokal + auto-import från holdings) ---------- */
function ForTrade({ wallet }) {
  const [items, setItems] = useState(() => loadTradeList());
  const [form, setForm] = useState({ name:"", rarity:"COMMON", contract:"", tokenId:"", notes:"" });
  const [importing, setImporting] = useState(false);

  useEffect(() => { saveTradeList(items); }, [items]);

  const addItem = () => {
    if (!form.name && !form.contract) return;
    setItems(prev => [...prev, { ...form, id: `${form.contract}-${form.tokenId}-${Math.random()}` }]);
    setForm({ name:"", rarity:"COMMON", contract:"", tokenId:"", notes:"" });
  };

  const removeItem = (id) => setItems(prev => prev.filter(x => x.id !== id));

  const importFromWallet = async () => {
    if (!wallet) return alert("Connect wallet först.");
    setImporting(true);
    try {
      const res = await wieldFetch(`vibe/owner/${wallet}?chainId=${CHAIN_ID}`);
      const holdings = res?.holdings || res?.cards || [];
      const mapped = (holdings || []).map(h => ({
        id: `${h.contract || h.address}-${h.tokenId || h.id}-${Math.random()}`,
        name: h.name || h.series || "Item",
        rarity: rarityName(h.rarity),
        contract: h.contract || h.address || "",
        tokenId: h.tokenId || h.id || "",
        notes: ""
      }));
      setItems(prev => dedupeById([...prev, ...mapped]));
    } catch {
      alert("Kunde inte importera från /vibe/owner/:address (endpoint ej öppen). Lägg till manuellt så länge.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="panel-title">For Trade (wallet-to-wallet – v1 lokal lista)</div>
        <div className="row">
          <button className="btn ghost" onClick={importFromWallet} disabled={importing}>
            {importing ? "Importing…" : "Import from wallet"}
          </button>
        </div>
      </div>

      <div className="row" style={{marginBottom:10}}>
        <input className="input" placeholder="Name / Card" value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} />
        <select className="select" value={form.rarity} onChange={e=>setForm(s=>({...s,rarity:e.target.value}))}>
          <option>COMMON</option><option>RARE</option><option>EPIC</option><option>LEGENDARY</option>
        </select>
        <input className="input" placeholder="Contract (0x…)" value={form.contract} onChange={e=>setForm(s=>({...s,contract:e.target.value}))} />
        <input className="input" placeholder="Token ID" value={form.tokenId} onChange={e=>setForm(s=>({...s,tokenId:e.target.value}))} />
        <button className="btn" onClick={addItem}>Add</button>
      </div>

      <div className="cards" style={{gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))"}}>
        {!items.length ? <div className="card">Inga items i din trade-lista ännu.</div> :
          items.map(i => (
            <div key={i.id} className="card">
              <div className="meta">
                <div className="row-between">
                  <div className="title truncate">{i.name}</div>
                  <span className="badge">{i.rarity}</span>
                </div>
                <div className="sub">{short(i.contract)} • #{i.tokenId || "—"}</div>
                {i.notes ? <div className="sub">{i.notes}</div> : null}
                <div className="row">
                  <button className="btn ghost" onClick={()=>removeItem(i.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </section>
  );
}
function loadTradeList() { try { return JSON.parse(localStorage.getItem("forTrade") || "[]"); } catch { return []; } }
function saveTradeList(list) { try { localStorage.setItem("forTrade", JSON.stringify(list || [])); } catch {} }
function dedupeById(arr) { const seen = new Set(); const out=[]; for (const x of arr){ if(seen.has(x.id))continue; seen.add(x.id); out.push(x);} return out; }
