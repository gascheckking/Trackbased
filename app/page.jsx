"use client";
import { useEffect, useMemo, useState } from "react";
import { wieldFetch, CHAIN_ID } from "../lib/wield";



const TNYL_DROP = process.env.NEXT_PUBLIC_TNYL_DROP || "";
const TNYL_TOKEN = process.env.NEXT_PUBLIC_TNYL_TOKEN || "";

const TABS = ["Trading", "For Trade", "Activity", "Profile", "Bubble", "Chat", "Settings", "Bought"];

export default function Page() {
  const [active, setActive] = useState("Trading");
  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState([]);
  const [verified, setVerified] = useState([]);
  const [ticker, setTicker] = useState([]);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("dark");
  const [wallet, setWallet] = useState("");
  const [boughtItems, setBoughtItems] = useState([]);

  // Theme switch
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial fetcher – Packs + Verified + Ticker (+Bought if wallet)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Packs (senaste boosterboxar)
        const packsRes = await wieldFetch(`vibe/boosterbox/recent?limit=100&includeMetadata=true&chainId=${CHAIN_ID}`);
        const packsList = packsRes?.data || packsRes || [];
        setPacks(packsList);

        // Verified-panel
        const verifiedList = packsList.filter(p => p?.metadata?.verified === true);
        setVerified(verifiedList.slice(0, 12));

        // Activity för ticker (opened, rarity > 2 => EPIC/LEGENDARY)
        const actRes = await wieldFetch(`vibe/boosterbox/recent?limit=100&includeMetadata=true&status=opened&rarityGreaterThan=2&chainId=${CHAIN_ID}`);
        const actList = actRes?.data || actRes || [];
        const activityItems = actList.map(x => ({
          id: x.id ?? `${x.contractAddress}-${x.tokenId ?? Math.random()}`,
          txt: `${short(x?.owner)} pulled ${rarityName(x?.rarity)} in ${x?.collectionName || short(x?.contractAddress)}`
        }));
        setTicker(activityItems);

        // Bought (feature-flag: prova om endpoint finns, annars tom lista)
        if (wallet) {
          try {
            const profileData = await wieldFetch(`vibe/owner/${wallet}?chainId=${CHAIN_ID}`);
            setBoughtItems(profileData?.boughtItems || []);
          } catch {
            setBoughtItems([]);
          }
        } else {
          setBoughtItems([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [wallet]);

  // Filtrering för Trading
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packs;
    return (packs || []).filter(p => {
      const creator = (p?.creator || "").toLowerCase();
      const name = (p?.name || p?.collectionName || "").toLowerCase();
      return creator.includes(q) || name.includes(q);
    });
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
            <button className="btn" onClick={connectWallet(setWallet)}>Connect</button>
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
            {/* Duplicate för seamless loop */}
            {ticker.map(i => (
              <div key={i.id + "-dup"} className="chip"> {i.txt}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="wrapper">
        <div className="grid">
          <div>
            {/* Trading */}
            {active === "Trading" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Pack Trading (Vibe-synced)</div>
                  <div className="row">
                    <input className="input" placeholder="Search packs/creators…" value={query} onChange={e=>setQuery(e.target.value)} />
                    <a className="btn ghost" href="https://vibechain.com/market" target="_blank" rel="noreferrer">VibeMarket</a>
                  </div>
                </div>
                {loading ? <div>Loading…</div> : <Grid packs={filtered} />}
              </section>
            )}

            {/* For Trade */}
            {active === "For Trade" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">For Trade (showcase)</div>
                  <div className="row">
                    <span className="input">Coming soon – wallet-to-wallet swap</span>
                  </div>
                </div>
                <div className="cards">
                  <Placeholder text="Community showcase: users list specific cards for trade/bids." />
                </div>
              </section>
            )}

            {/* Activity – 30 senaste EPIC/LEGENDARY */}
            {active === "Activity" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Recent Activity (opened ≥ EPIC)</div>
                  <button className="btn" onClick={refreshTicker(setTicker)}>Refresh</button>
                </div>
                <div className="cards">
                  {(ticker.length ? ticker : [{id:"y",txt:"No activity"}]).slice(0,30).map(i => (
                    <div key={i.id} className="card">
                      <div className="meta">
                        <div className="title">{i.txt}</div>
                        <div className="sub">pulled on Base • live</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Profile */}
            {active === "Profile" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Your Profile</div>
                  <div className="row">
                    <input className="input" placeholder="0x… wallet" value={wallet} onChange={e=>setWallet(e.target.value)} />
                    <button className="btn" onClick={loadProfile(wallet, setBoughtItems)}>Load</button>
                  </div>
                </div>
                <div className="cards">
                  <Placeholder text="PnL (realized/unrealized), most valuable card, holdings… (uses /owner/:address)" />
                </div>
              </section>
            )}

            {/* Bubble */}
            {active === "Bubble" && (
              <section className="panel">
                <div className="panel-head"><div className="panel-title">Bubble Map</div></div>
                <div className="cards">
                  <Placeholder text="Wallet flow maps + chat. (Phase 2 – requires a small service)" />
                </div>
              </section>
            )}

            {/* Chat */}
            {active === "Chat" && (
              <section className="panel">
                <div className="panel-head"><div className="panel-title">Chat</div></div>
                <div className="cards">
                  <Placeholder text="Wallet-to-wallet / creator rooms. (Phase 2)" />
                </div>
              </section>
            )}

            {/* Settings */}
            {active === "Settings" && (
              <section className="panel">
                <div className="panel-head"><div className="panel-title">Settings</div></div>
                <div className="row" style={{marginBottom:12}}>
                  <button className="btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
                    Toggle {theme === "dark" ? "Light" : "Dark"} Mode
                  </button>
                </div>
                <div className="cards">
                  <div className="card">
                    <div className="meta">
                      <div className="title">Chain</div>
                      <div className="sub">Using Base (chainId {CHAIN_ID})</div>
                    </div>
                  </div>
                  {!!TNYL_DROP && (
                    <div className="card">
                      <div className="meta">
                        <div className="title">Tiny Legends Drop</div>
                        <div className="sub">{TNYL_DROP}</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Bought (feature-flag) */}
            {active === "Bought" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Bought Items</div>
                </div>
                {!wallet ? (
                  <div className="card">Connect wallet först.</div>
                ) : !boughtItems.length ? (
                  <div className="card">Inga köp hittades (eller endpoint ej aktiv).</div>
                ) : (
                  <div className="cards">
                    {boughtItems.map(item => (
                      <div key={item.id || `${item.contract}-${item.tokenId}`} className="card">
                        <div className="meta">
                          <div className="title">{item.name || "Item"}</div>
                          <div className="sub">{item.description || `#${item.tokenId ?? "–"}`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right column – Verified + Quick buys */}
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
                <div className="panel-title">Quick Buy (token)</div>
              </div>
              <QuickBuy token={TNYL_TOKEN} />
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

/* ---------------- Helpers & småkomponenter ---------------- */

function connectWallet(setWallet) {
  return async () => {
    try {
      if (!window?.ethereum) return alert("No wallet found");
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accs?.[0] || "");
    } catch (e) {
      console.error(e);
    }
  };
}

function refreshTicker(setTicker) {
  return async () => {
    try {
      const res = await wieldFetch(`vibe/boosterbox/recent?limit=100&includeMetadata=true&status=opened&rarityGreaterThan=2&chainId=${CHAIN_ID}`);
      const list = res?.data || res || [];
      const items = list.map(x => ({
        id: x.id ?? `${x.contractAddress}-${x.tokenId ?? Math.random()}`,
        txt: `${short(x?.owner)} pulled ${rarityName(x?.rarity)} in ${x?.collectionName || short(x?.contractAddress)}`
      }));
      setTicker(items);
    } catch (e) {
      console.error(e);
    }
  };
}

async function loadProfile(addr, setBoughtItems) {
  if (!addr) return;
  try {
    // Byt till riktig endpoint när den är live:
    // /vibe/owner/:address -> { pnl, holdings, boughtItems, ... }
    const profileData = await wieldFetch(`vibe/owner/${addr}?chainId=${CHAIN_ID}`);
    setBoughtItems(profileData?.boughtItems || []);
    alert("Profile loaded.");
  } catch (e) {
    console.error(e);
    alert("Profile endpoint to wire: /vibe/owner/:address (PNL, holdings)");
  }
}

function rarityName(r) {
  const n = String(r || "").toUpperCase();
  if (["4","LEGENDARY"].includes(n)) return "LEGENDARY";
  if (["3","EPIC"].includes(n)) return "EPIC";
  if (["2","RARE"].includes(n)) return "RARE";
  return "COMMON";
}

function short(x = "") {
  if (!x || typeof x !== "string") return "";
  return x.length > 10 ? `${x.slice(0,6)}…${x.slice(-4)}` : x;
}

function keyFor(p) {
  return p?.id || `${p?.contractAddress || "x"}-${p?.tokenId || p?.name || Math.random()}`;
}

/* ---- UI småkomponenter ---- */

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
  const verified = pack?.metadata?.verified === true;
  const link = pack?.url || pack?.metadata?.url || "https://vibechain.com/market";

  return (
    <a className="card pack" href={link} target="_blank" rel="noreferrer">
      {img ? <img className="thumb lg" alt="" src={img} /> : <div className="thumb lg" style={{background:"var(--bg-1)"}} />}
      <div className="meta">
        <div className="title">{name} {verified && <span className="badge">VERIFIED</span>}</div>
        <div className="sub">{short(creator)}</div>
      </div>
    </a>
  );
}

function PackSmall({ pack }) {
  const name = pack?.name || pack?.collectionName || "Pack";
  const img = pack?.image || pack?.metadata?.image || "";
  const link = pack?.url || pack?.metadata?.url || "https://vibechain.com/market";
  return (
    <a className="card row" href={link} target="_blank" rel="noreferrer">
      {img ? <img className="thumb" alt="" src={img} /> : <div className="thumb" style={{background:"var(--bg-1)"}} />}
      <div className="grow">
        <div className="title truncate">{name}</div>
        <div className="muted">View</div>
      </div>
    </a>
  );
}

function QuickBuy({ token }) {
  const isSet = !!token;
  const href = isSet
    ? `https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${token}&chain=base`
    : "#";
  return (
    <div className="card">
      <div className="meta">
        <div className="title">Quick Buy</div>
        <div className="sub">{isSet ? short(token) : "Set NEXT_PUBLIC_TNYL_TOKEN"}</div>
      </div>
      <a className={`btn ${!isSet ? "disabled":""}`} href={href} target="_blank" rel="noreferrer">Open Uniswap</a>
    </div>
  );
}

function Placeholder({ text }) {
  return <div className="card">{text}</div>;
}
