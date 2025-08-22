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
        <div className="grid">
          <div>
            {/* Switch View */}
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

            {active === "Activity" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Recent Activity (opened ≥ EPIC)</div>
                  <button className="btn" onClick={refreshTicker}>Refresh</button>
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

            {active === "Profile" && (
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">Your Profile</div>
                  <div className="row">
                    <input className="input" placeholder="0x… wallet" value={wallet} onChange={e=>setWallet(e.target.value)} />
                    <button className="btn" onClick={() => loadProfile(wallet)}>Load</button>
                  </div>
                </div>
                <div className="cards">
                  <Placeholder text="PnL (realized/unrealized), most valuable card, holdings… (uses /owner/:address)" />
                </div>
              </section>
            )}

            {active === "Bubble" && (
              <section className="panel">
                <div className="panel-head"><div className="panel-title">Bubble Map</div></div>
                <div className="cards">
                  <Placeholder text="Wallet flow maps + chat. (Phase 2 – requires a small service)" />
                </div>
              </section>
            )}

            {active === "Chat" && (
              <section className="panel">
                <div className="panel-head"><div className="panel-title">Chat</div></div>
                <div className="cards">
                  <Placeholder text="Wallet-to-wallet / creator rooms. (Phase 2)" />
                </div>
              </section>
            )}

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
          </div>

          {/* Right column – Verified + Quick buys */}
          <aside className="panel">
            <div className="panel-head">
              <div className="panel-title">Verified by VibeMarket </div>
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

async function refreshTicker() {
  try {
    const recent = await wieldFetch(`vibe/boosterbox/recent?limit=100&includeMetadata=true&status=opened&rarityGreaterThan=2&chainId=${CHAIN_ID}`);
    const items = (recent?.data || recent || []).map(x => ({
      id: x.id ?? `${x.contractAddress}-${x.tokenId ?? Math.random()}`,
      txt: `${short(x?.owner)} pulled ${rarityName(x?.rarity)} in ${x?.collectionName || short(x?.contractAddress)},
    }));
    setTicker(items);
  } catch(e) { console.error(e); }
}

async function loadProfile(addr) {
  if (!addr) return;
  try {
    // plats – byt till riktig endpoint när den är live
    // ex: /vibe/owner/:address
    alert("Profile endpoint to wire: /vibe/owner/:address (PNL, holdings)");
  } catch (e) {
    console.error(e);
  }
}

async function connectWallet() {
  if (!window?.ethereum) return alert("No wallet found.");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (accounts?.length) setWallet(accounts[0]);
}
/* ========== UTILS ========== */
function short(a) {
  if (!a) return "—";
  const s = String(a);
  if (s.startsWith("0x") && s.length > 10) return `${s.slice(0,6)}…${s.slice(-4)}`;
  if (s.includes("@")) return s;
  return s;
}

function rarityName(r) {
  if (r >= 4) return "LEGENDARY";
  if (r === 3) return "EPIC";
  if (r === 2) return "RARE";
  return "COMMON";
}

function keyFor(p) {
  return p?.id || `${p?.contractAddress || "x"}-${p?.tokenId || Math.random()}`;
}
