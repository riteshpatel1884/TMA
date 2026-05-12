"use client";

import { useState, useEffect, useMemo, useRef } from "react";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

// ── helpers ───────────────────────────────────────────────────────────────────
function ago(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function progressColor(pct) {
  if (pct >= 75) return "#16a34a";
  if (pct >= 40) return "#d97706";
  return "#6366f1";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function avatar(email) {
  return email?.[0]?.toUpperCase() || "?";
}

const AVATAR_COLORS = [
  ["#dbeafe","#1d4ed8"], ["#dcfce7","#15803d"], ["#fce7f3","#be185d"],
  ["#fef3c7","#b45309"], ["#ede9fe","#7c3aed"], ["#ffedd5","#c2410c"],
];
function avatarColor(email) {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AdminMailer() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState("");

  // sidebar tab
  const [sideTab, setSideTab]         = useState("compose");
  const [sentLog, setSentLog]         = useState([]);
  const [viewSent, setViewSent]       = useState(null);

  // filters
  const [search, setSearch]           = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [minTrackers, setMinTrackers] = useState(0);
  const [minProgress, setMinProgress] = useState(0);
  const [filterOpen, setFilterOpen]   = useState(false);

  // recipients
  const [selected, setSelected]       = useState(new Set());
  const [customEmails, setCustomEmails] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");

  // compose
  const [fromName, setFromName]       = useState("LeaderLab");
  const [subject, setSubject]         = useState("");
  const [body, setBody]               = useState("");
  const [preview, setPreview]         = useState(false);

  // send
  const [sending, setSending]         = useState(false);
  const [result, setResult]           = useState(null);
  const [showResult, setShowResult]   = useState(false);

  // ── fetch users ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/users", {
          headers: { "x-admin-secret": ADMIN_SECRET },
        });
        if (!res.ok) throw new Error("Unauthorized or server error");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (e) {
        setFetchError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────
  const allCompanies = useMemo(() => {
    const s = new Set();
    users.forEach(u => u.companies?.forEach(c => s.add(c)));
    return [...s].sort();
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (q && !u.email.toLowerCase().includes(q)) return false;
      if (u.trackerCount < minTrackers) return false;
      if (u.progressPct < minProgress) return false;
      if (companyFilter && !u.companies?.includes(companyFilter)) return false;
      return true;
    });
  }, [users, search, minTrackers, minProgress, companyFilter]);

  const allRecipients = useMemo(
    () => [...new Set([...selected, ...customEmails])],
    [selected, customEmails]
  );

  // ── selection ─────────────────────────────────────────────────────────────
  const toggleUser = (email) =>
    setSelected(prev => {
      const n = new Set(prev);
      n.has(email) ? n.delete(email) : n.add(email);
      return n;
    });

  const selectAll = () => setSelected(new Set(filtered.map(u => u.email)));
  const clearAll  = () => { setSelected(new Set()); setCustomEmails([]); };

  // ── custom email ──────────────────────────────────────────────────────────
  const addCustomEmail = () => {
    const parts = customInput.trim().split(/[\s,;]+/).filter(Boolean);
    const invalid = parts.filter(p => !isValidEmail(p));
    if (invalid.length) { setCustomError(`Invalid: ${invalid.join(", ")}`); return; }
    const fresh = parts.filter(e => !selected.has(e.toLowerCase()) && !customEmails.includes(e.toLowerCase()));
    const dupes  = parts.filter(e =>  selected.has(e.toLowerCase()) ||  customEmails.includes(e.toLowerCase()));
    setCustomEmails(prev => [...prev, ...fresh.map(e => e.toLowerCase())]);
    setCustomInput("");
    setCustomError(dupes.length ? `Already added: ${dupes.join(", ")}` : "");
  };

  const removeRecipient = (email) => {
    if (selected.has(email)) toggleUser(email);
    else setCustomEmails(prev => prev.filter(e => e !== email));
  };

  // ── send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!allRecipients.length || !subject.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    setShowResult(false);
    try {
      const res = await fetch("/api/admin/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ emails: allRecipients, subject, body, fromName }),
      });
      const data = await res.json();
      setResult(data);
      setShowResult(true);
      if (data.ok) {
        setSentLog(prev => [{
          id: Date.now(), subject, body, fromName,
          recipients: allRecipients,
          sentCount: data.sentCount, failedCount: data.failedCount,
          failed: data.results?.failed || [],
          sentAt: new Date().toISOString(),
        }, ...prev]);
        setSubject(""); setBody(""); setSelected(new Set()); setCustomEmails([]);
      }
    } catch (e) {
      setResult({ ok: false, error: e.message });
      setShowResult(true);
    } finally {
      setSending(false);
    }
  };

  // ── preview html ──────────────────────────────────────────────────────────
  const previewHtml = useMemo(() => {
    const formatted = (body || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
    return `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;padding:20px 14px;border-radius:8px;">
<div style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">${fromName||"LeaderLab"}</div>
<div style="height:2px;background:linear-gradient(90deg,#6366f1,#a5b4fc);border-radius:2px;margin-bottom:14px;"></div>
<div style="background:#fff;border-radius:10px;padding:22px 26px;">
<h1 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#111827;">${subject||"(no subject)"}</h1>
<div style="font-size:14px;color:#374151;line-height:1.8;">${formatted||"<em style='color:#9ca3af'>No body yet…</em>"}</div>
<div style="margin-top:16px;padding-top:12px;border-top:1px solid #f3f4f6;">
<a style="display:inline-block;background:#4f46e5;color:#fff;padding:9px 20px;border-radius:7px;font-size:13px;font-weight:700;text-decoration:none;">Go to LeaderLab →</a>
</div></div>
<p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:12px;">${fromName||"LeaderLab"} · leaderlab.in · You're receiving this as a LeaderLab user.</p>
</div>`;
  }, [body, subject, fromName]);

  const canSend = allRecipients.length > 0 && subject.trim() && body.trim();

  // ── loading / error ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.fullCenter}>
      <div style={S.spinner} />
      <p style={{ color:"#6b7280", marginTop:12, fontSize:14 }}>Loading users…</p>
    </div>
  );
  if (fetchError) return (
    <div style={S.fullCenter}>
      <div style={{ background:"#fee2e2", color:"#991b1b", padding:"14px 22px", borderRadius:12, fontSize:14, fontWeight:600 }}>⚠ {fetchError}</div>
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.shell}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
        textarea:focus,input:focus,select:focus{outline:2px solid #6366f1!important;outline-offset:-1px}
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside style={S.sidebar}>
        <div style={S.logoWrap}>
          <span style={S.logoEmoji}>✉️</span>
          <div>
            <div style={S.logoTitle}>Mail Center</div>
            <div style={S.logoSub}>LeaderLab Admin</div>
          </div>
        </div>

        <nav style={{ padding:"8px" }}>
          {[
            { id:"compose", emoji:"✏️", label:"Compose" },
            { id:"sent",    emoji:"📤", label:"Sent" },
          ].map(t => (
            <button key={t.id} style={{ ...S.navBtn, ...(sideTab===t.id?S.navBtnActive:{}) }}
              onClick={() => { setSideTab(t.id); setViewSent(null); }}>
              <span style={{ fontSize:16 }}>{t.emoji}</span>
              <span>{t.label}</span>
              {t.id==="sent" && sentLog.length>0 && (
                <span style={S.navBadge}>{sentLog.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ height:1, background:"#e8eaed", margin:"12px 0" }} />

        <div style={{ padding:"0 16px" }}>
          <p style={S.statSection}>Overview</p>
          {[
            ["Registered", users.length],
            ["Showing",    filtered.length],
            ["Selected",   allRecipients.length],
            ["Sent total", sentLog.reduce((a,s)=>a+s.sentCount,0)],
          ].map(([label, val]) => (
            <div key={label} style={S.statRow}>
              <span style={S.statLabel}>{label}</span>
              <span style={{ ...S.statVal, ...(label==="Selected"?{color:"#6366f1",fontWeight:700}:{}) }}>{val}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main style={S.main}>

        {/* ─── SENT TAB ─── */}
        {sideTab === "sent" && (
          <div style={{ flex:1, overflowY:"auto" }}>
            <div style={S.tabHeader}>
              <h2 style={S.tabTitle}>📤 Sent</h2>
            </div>
            {viewSent ? (
              <div style={{ padding:"16px 20px" }}>
                <button style={S.backBtn} onClick={()=>setViewSent(null)}>← Back</button>
                <div style={S.detailCard}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={S.greenBadge}>{viewSent.sentCount} sent</span>
                      {viewSent.failedCount>0 && <span style={S.redBadge}>{viewSent.failedCount} failed</span>}
                    </div>
                    <span style={{ fontSize:12, color:"#9ca3af" }}>{new Date(viewSent.sentAt).toLocaleString()}</span>
                  </div>
                  <h3 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800, color:"#111827" }}>{viewSent.subject}</h3>
                  <p style={{ margin:"0 0 14px", fontSize:12, color:"#6b7280" }}>From: {viewSent.fromName}</p>
                  <div style={S.bodyPre}>{viewSent.body}</div>
                  <div style={{ marginTop:16 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Recipients ({viewSent.recipients.length})</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {viewSent.recipients.map(e => {
                        const failed = viewSent.failed.find(f=>f.email===e);
                        return (
                          <span key={e} style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:10,
                            background: failed?"#fee2e2":"#dcfce7", color: failed?"#991b1b":"#166534" }}>{e}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : sentLog.length===0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:60 }}>
                <span style={{ fontSize:48 }}>📭</span>
                <p style={{ color:"#9ca3af", marginTop:10, fontSize:14 }}>No emails sent yet.</p>
              </div>
            ) : (
              <div>
                {sentLog.map(s => (
                  <div key={s.id} style={S.sentRow} onClick={()=>setViewSent(s)}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>📧</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                        <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{s.subject}</span>
                        <span style={S.greenBadge}>{s.sentCount} sent</span>
                        {s.failedCount>0 && <span style={S.redBadge}>{s.failedCount} failed</span>}
                      </div>
                      <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>{s.recipients.length} recipients · {new Date(s.sentAt).toLocaleString()}</p>
                    </div>
                    <span style={{ color:"#9ca3af" }}>›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── COMPOSE TAB ─── */}
        {sideTab === "compose" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr", flex:1, overflow:"hidden" }}>

            {/* ── LEFT: users ── */}
            <div style={{ display:"flex", flexDirection:"column", borderRight:"1px solid #e8eaed", background:"#fff", overflow:"hidden" }}>

              {/* search */}
              <div style={{ padding:"12px 12px 8px", borderBottom:"1px solid #f3f4f6" }}>
                <div style={{ display:"flex", gap:6 }}>
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:7, background:"#f1f3f4", borderRadius:24, padding:"7px 13px" }}>
                    <span style={{ fontSize:13, color:"#9ca3af" }}>🔍</span>
                    <input style={{ flex:1, border:"none", background:"transparent", fontSize:13, color:"#111827", outline:"none" }}
                      placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)} />
                  </div>
                  <button title="Filters"
                    style={{ ...S.iconBtn, background:filterOpen?"#ede9fe":"transparent", color:filterOpen?"#7c3aed":"#6b7280" }}
                    onClick={()=>setFilterOpen(o=>!o)}>⚙️</button>
                </div>

                {filterOpen && (
                  <div style={{ marginTop:10, animation:"slideIn 0.15s ease" }}>
                    <select style={S.filterSelect} value={companyFilter} onChange={e=>setCompanyFilter(e.target.value)}>
                      <option value="">All companies</option>
                      {allCompanies.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <div style={{ marginBottom:6 }}>
                      <span style={S.filterLabel}>Min trackers: <b>{minTrackers}</b></span>
                      <input type="range" min={0} max={20} value={minTrackers} onChange={e=>setMinTrackers(+e.target.value)} style={{ width:"100%" }} />
                    </div>
                    <div style={{ marginBottom:6 }}>
                      <span style={S.filterLabel}>Min progress: <b>{minProgress}%</b></span>
                      <input type="range" min={0} max={100} value={minProgress} onChange={e=>setMinProgress(+e.target.value)} style={{ width:"100%" }} />
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ ...S.smBtn, flex:1 }} onClick={selectAll}>Select all ({filtered.length})</button>
                      <button style={{ ...S.smBtn, flex:1 }} onClick={clearAll}>Clear all</button>
                    </div>
                  </div>
                )}
              </div>

              {/* bulk bar */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 14px", background:"#fafafa", borderBottom:"1px solid #f3f4f6" }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:"#374151" }}>
                  <input type="checkbox" style={{ accentColor:"#6366f1" }}
                    checked={filtered.length>0 && filtered.every(u=>selected.has(u.email))}
                    onChange={e=>e.target.checked ? selectAll() : setSelected(new Set())} />
                  {filtered.length} users
                </label>
                <span style={{ fontSize:11, color:"#9ca3af" }}>{selected.size} checked</span>
              </div>

              {/* user list */}
              <div style={{ flex:1, overflowY:"auto" }}>
                {filtered.length===0 && (
                  <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:13 }}>No users match filters.</div>
                )}
                {filtered.map(u => {
                  const [bg,fg] = avatarColor(u.email);
                  const checked = selected.has(u.email);
                  return (
                    <div key={u.email} onClick={()=>toggleUser(u.email)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                        borderBottom:"1px solid #f9fafb", cursor:"pointer",
                        background: checked?"#f5f3ff":"#fff",
                        borderLeft: checked?"3px solid #6366f1":"3px solid transparent",
                        transition:"background 0.1s" }}>
                      <div style={{ width:34,height:34,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>
                        {avatar(u.email)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</p>
                          <span style={{ fontSize:10, color:"#9ca3af", flexShrink:0, marginLeft:6 }}>{ago(u.lastActive)}</span>
                        </div>
                        <p style={{ margin:"1px 0 4px", fontSize:11, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {u.trackerCount} tracker{u.trackerCount!==1?"s":""} · {u.companies?.slice(0,2).join(", ")}{u.companies?.length>2?` +${u.companies.length-2}`:""}
                        </p>
                        <div style={{ height:3, background:"#f3f4f6", borderRadius:3 }}>
                          <div style={{ height:"100%", borderRadius:3, width:`${u.progressPct}%`, background:progressColor(u.progressPct), transition:"width 0.3s" }} />
                        </div>
                      </div>
                      <div style={{ width:18,height:18,borderRadius:"50%",border:`2px solid ${checked?"#6366f1":"#d1d5db"}`,background:checked?"#6366f1":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s" }}>
                        {checked && <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: compose ── */}
            <div style={{ display:"flex", flexDirection:"column", background:"#f6f8fc", padding:14, gap:10, overflow:"hidden" }}>

              {/* toast */}
              {showResult && result && (
                <div style={{ padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  background: result.ok?"#dcfce7":"#fee2e2", color: result.ok?"#166534":"#991b1b",
                  animation:"slideIn 0.2s ease" }}>
                  <span>{result.ok ? `✓ Sent to ${result.sentCount} recipient${result.sentCount!==1?"s":""}` : `✗ ${result.error}`}
                    {result.ok && result.failedCount>0 ? ` · ${result.failedCount} failed` : ""}</span>
                  <button style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"inherit", lineHeight:1 }}
                    onClick={()=>setShowResult(false)}>×</button>
                </div>
              )}

              {/* compose card */}
              <div style={{ flex:1, background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>

                {/* card header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 18px", borderBottom:"1px solid #f3f4f6", background:"#fafafa" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:15 }}>✏️</span>
                    <span style={{ fontSize:14, fontWeight:700, color:"#111827" }}>New Message</span>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button style={{ ...S.smBtn, background:preview?"#ede9fe":"#f9fafb", color:preview?"#7c3aed":"#374151" }}
                      onClick={()=>setPreview(p=>!p)}>
                      {preview?"✏ Edit":"👁 Preview"}
                    </button>
                    <button style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:20, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer", opacity:(!canSend||sending)?0.45:1 }}
                      onClick={handleSend} disabled={!canSend||sending}>
                      {sending ? "Sending…" : `Send ${allRecipients.length>0?`(${allRecipients.length})`:""}`}
                    </button>
                  </div>
                </div>

                {/* card body */}
                <div style={{ flex:1, overflowY:"auto", padding:"0 18px 18px" }}>
                  {!preview ? (
                    <>
                      {/* From */}
                      <div style={S.fieldRow}>
                        <span style={S.fieldLabel}>From</span>
                        <input style={S.fieldInput} value={fromName} onChange={e=>setFromName(e.target.value)} placeholder="LeaderLab" />
                      </div>

                      {/* To: pills */}
                      <div style={{ ...S.fieldRow, alignItems:"flex-start" }}>
                        <span style={{ ...S.fieldLabel, paddingTop:4 }}>To</span>
                        <div style={{ flex:1, display:"flex", flexWrap:"wrap", gap:5, minHeight:28 }}>
                          {allRecipients.length===0 && (
                            <span style={{ fontSize:12, color:"#9ca3af", paddingTop:2 }}>Select users left, or add custom email below…</span>
                          )}
                          {allRecipients.map(e => {
                            const isCustom = customEmails.includes(e);
                            return (
                              <span key={e} style={{
                                display:"inline-flex", alignItems:"center", gap:4,
                                padding:"3px 8px", borderRadius:12, fontSize:11, fontWeight:600,
                                background: isCustom?"#fef3c7":"#ede9fe",
                                color: isCustom?"#92400e":"#5b21b6",
                                maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                              }}>
                                <span style={{ width:6,height:6,borderRadius:"50%",background:isCustom?"#d97706":"#7c3aed",flexShrink:0 }} />
                                {e}
                                <span style={{ cursor:"pointer", opacity:0.6, fontSize:13, marginLeft:2 }} onClick={()=>removeRecipient(e)}>×</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom email add */}
                      <div style={{ padding:"8px 0 6px", borderBottom:"1px solid #f3f4f6" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap", width:52 }}>+ Custom</span>
                          <input
                            style={{ flex:1, border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 10px", fontSize:12, color:"#374151", background:"#fafafa" }}
                            placeholder="any@email.com  —  comma separated for bulk"
                            value={customInput}
                            onChange={e=>{ setCustomInput(e.target.value); setCustomError(""); }}
                            onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){ e.preventDefault(); addCustomEmail(); }}}
                          />
                          <button onClick={addCustomEmail}
                            style={{ border:"1px solid #6366f1", background:"#eef2ff", color:"#4338ca", borderRadius:8, padding:"6px 13px", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                            Add
                          </button>
                        </div>
                        {customError && <p style={{ fontSize:11, color:"#dc2626", margin:"4px 0 0" }}>{customError}</p>}
                      </div>

                      {/* Subject */}
                      <div style={S.fieldRow}>
                        <span style={S.fieldLabel}>Subject</span>
                        <input style={S.fieldInput} placeholder="Your subject line…" value={subject} onChange={e=>setSubject(e.target.value)} />
                      </div>

                      {/* Body */}
                      <div style={{ marginTop:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <span style={{ fontSize:11, color:"#9ca3af" }}>Tip: use **text** for bold</span>
                          <span style={{ fontSize:11, color:body.length>3000?"#ef4444":"#9ca3af" }}>{body.length} chars</span>
                        </div>
                        <textarea
                          style={{ width:"100%", minHeight:200, border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#111827", lineHeight:1.75, fontFamily:"inherit", resize:"vertical", background:"#fafafa" }}
                          placeholder={"Hi there,\n\nWe wanted to share something exciting with you…\n\n**Key highlight** — something important.\n\nThanks for being part of LeaderLab!"}
                          value={body}
                          onChange={e=>setBody(e.target.value)}
                        />
                      </div>

                      {/* legend */}
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:10, display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ width:7,height:7,borderRadius:"50%",background:"#7c3aed",display:"inline-block" }} /> Registered user
                        <span style={{ width:7,height:7,borderRadius:"50%",background:"#d97706",display:"inline-block",marginLeft:12 }} /> Custom email
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ paddingTop:14, border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", marginTop:14 }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      <div style={{ marginTop:14, padding:"12px 14px", background:"#f9fafb", borderRadius:8, border:"1px solid #e5e7eb" }}>
                        <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:"#374151" }}>
                          Will send to {allRecipients.length} recipient{allRecipients.length!==1?"s":""}
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {allRecipients.slice(0,24).map(e=>(
                            <span key={e} style={{ fontSize:11, color:"#6366f1", background:"#eef2ff", padding:"2px 8px", borderRadius:10 }}>{e}</span>
                          ))}
                          {allRecipients.length>24 && <span style={{ fontSize:11, color:"#9ca3af" }}>+{allRecipients.length-24} more</span>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// ── shared styles ─────────────────────────────────────────────────────────────
const S = {
  shell: { display:"flex", height:"100vh", fontFamily:"'Google Sans','Segoe UI',Arial,sans-serif", background:"#f6f8fc", overflow:"hidden" },
  sidebar: { width:220, background:"#fff", borderRight:"1px solid #e8eaed", display:"flex", flexDirection:"column", flexShrink:0, padding:"16px 0" },
  logoWrap: { display:"flex", alignItems:"center", gap:10, padding:"0 16px 16px" },
  logoEmoji: { fontSize:22 },
  logoTitle: { fontSize:15, fontWeight:800, color:"#1e1b4b", lineHeight:1.2 },
  logoSub: { fontSize:10, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.8px" },
  navBtn: { width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderRadius:30, border:"none", background:"transparent", fontSize:13, fontWeight:500, color:"#374151", cursor:"pointer", textAlign:"left" },
  navBtnActive: { background:"#d2e3fc", color:"#1a56db", fontWeight:700 },
  navBadge: { marginLeft:"auto", background:"#6366f1", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700 },
  statSection: { fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 10px" },
  statRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  statLabel: { fontSize:12, color:"#9ca3af" },
  statVal: { fontSize:13, fontWeight:600, color:"#374151" },
  main: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  tabHeader: { padding:"18px 20px 12px", borderBottom:"1px solid #e8eaed" },
  tabTitle: { margin:0, fontSize:20, fontWeight:700, color:"#111827" },
  sentRow: { display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:"1px solid #f3f4f6", cursor:"pointer" },
  backBtn: { background:"none", border:"none", color:"#6366f1", fontWeight:700, fontSize:13, cursor:"pointer", padding:"0 0 14px", display:"block" },
  detailCard: { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"20px 22px" },
  bodyPre: { background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#374151", lineHeight:1.75, whiteSpace:"pre-wrap" },
  greenBadge: { fontSize:11, fontWeight:600, background:"#dcfce7", color:"#166534", padding:"2px 8px", borderRadius:10 },
  redBadge: { fontSize:11, fontWeight:600, background:"#fee2e2", color:"#991b1b", padding:"2px 8px", borderRadius:10 },
  iconBtn: { border:"none", borderRadius:8, padding:"7px 10px", fontSize:16, cursor:"pointer" },
  filterSelect: { width:"100%", padding:"7px 10px", fontSize:12, border:"1px solid #e5e7eb", borderRadius:8, marginBottom:8, background:"#fff", color:"#374151" },
  filterLabel: { fontSize:11, color:"#6b7280", display:"block", marginBottom:2 },
  fieldRow: { display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #f3f4f6" },
  fieldLabel: { fontSize:12, color:"#9ca3af", fontWeight:600, width:52, flexShrink:0 },
  fieldInput: { flex:1, border:"none", outline:"none", fontSize:14, color:"#111827", background:"transparent" },
  smBtn: { border:"1px solid #e5e7eb", background:"#f9fafb", borderRadius:8, padding:"5px 10px", fontSize:12, fontWeight:600, cursor:"pointer", color:"#374151" },
  fullCenter: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh" },
  spinner: { width:28, height:28, border:"3px solid #e5e7eb", borderTop:"3px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
};