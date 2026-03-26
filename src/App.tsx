import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zaownrmdmdkrnbozvhdv.supabase.co";
const SUPABASE_KEY = "sb_publishable_d08ZCYAATfRSMHIe_nKbQw_c3SmokTW";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const APP_PASSWORD = "Research2026!";
const SESSION_KEY = "ok_tracker_auth";
const MILESTONES = [6, 12, 24];

function getDueDate(surgeryDate, months) {
  const d = new Date(surgeryDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDaysUntil(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 86400000);
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function enrich(p) {
  const fus = MILESTONES.map(m => {
    const dueDate = getDueDate(p.surgery_date, m);
    const days = getDaysUntil(dueDate);
    const fu = p.follow_ups?.[m] || { completed: false, completedAt: null };
    return { months: m, dueDate, days, ...fu };
  });
  const isOverdue = fus.some(f => !f.completed && f.days < 0);
  const isUrgent = fus.some(f => !f.completed && f.days >= 0 && f.days <= 14);
  const allDone = fus.every(f => f.completed) && p.baseline?.completed;
  return { ...p, fus, isOverdue, isUrgent, allDone };
}

const chip = (bg, color) => ({ background: bg, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.3 });
const checkBtn = (done) => ({ width: 28, height: 28, borderRadius: 7, border: done ? "none" : "2px solid #cbd5e1", background: done ? "#22c55e" : "#fff", color: done ? "#fff" : "#cbd5e1", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, cursor: "pointer", flexShrink: 0 });
const btn = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (pw === APP_PASSWORD) { onLogin(); }
    else { setError("Incorrect password."); setPw(""); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Operation Kitchen Research</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Follow-Up Tracker</h1>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#94a3b8" }}>Enter the shared password to continue</p>
        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Password" autoFocus
          style={{ width: "100%", padding: "12px 14px", border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 15, background: "#f8fafc", color: "#0f172a", boxSizing: "border-box", marginBottom: 10, fontFamily: "inherit" }} />
        {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={handleSubmit} style={{ width: "100%", padding: "12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
        <div style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>Default password: <strong>okresearch2024</strong></div>
      </div>
    </div>
  );
}

// ── REPORT ────────────────────────────────────────────────────────────────────
function Report({ patients, onClose }) {
  const now = new Date();
  const all = patients.map(enrich);
  const baselinePendingList = all.filter(p => !p.baseline?.completed);
  const overdueList = [];
  all.forEach(p => p.fus.forEach(f => { if (!f.completed && f.days < 0) overdueList.push({ ...f, pid: p.patient_id }); }));
  const upcomingList = [];
  all.forEach(p => p.fus.forEach(f => { if (!f.completed && f.days >= 0 && f.days <= 30) upcomingList.push({ ...f, pid: p.patient_id }); }));
  upcomingList.sort((a, b) => a.days - b.days);
  const completedThisMonth = [];
  all.forEach(p => p.fus.forEach(f => {
    if (f.completed && f.completedAt) {
      const d = new Date(f.completedAt);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) completedThisMonth.push({ ...f, pid: p.patient_id });
    }
  }));
  const stats = { total: all.length, baselinePending: baselinePendingList.length, contactedThisMonth: completedThisMonth.length, overdue: overdueList.length, dueSoon: upcomingList.length, allDone: all.filter(p => p.allDone).length };

  const handleCopy = () => {
    const lines = [`MONTHLY REPORT — ${fmtMonth(now).toUpperCase()}`, `Generated: ${fmtDate(now)}`, "", `Total enrolled:        ${stats.total}`, `Baseline pending:      ${stats.baselinePending}`, `Contacted this month:  ${stats.contactedThisMonth}`, `Overdue:               ${stats.overdue}`, `Due in 30 days:        ${stats.dueSoon}`, `Fully complete:        ${stats.allDone}`, ""];
    if (baselinePendingList.length) { lines.push("BASELINE PENDING"); baselinePendingList.forEach(p => lines.push(`  ${p.patient_id} | Surgery: ${fmtDate(p.surgery_date)}`)); lines.push(""); }
    if (overdueList.length) { lines.push("OVERDUE"); overdueList.forEach(f => lines.push(`  ${f.pid} | ${f.months}-month | ${Math.abs(f.days)} days overdue`)); lines.push(""); }
    if (upcomingList.length) { lines.push("UPCOMING (30 days)"); upcomingList.forEach(f => lines.push(`  ${f.pid} | ${f.months}-month | Due ${fmtDate(f.dueDate)} | In ${f.days} days`)); lines.push(""); }
    if (completedThisMonth.length) { lines.push("COMPLETED THIS MONTH"); completedThisMonth.forEach(f => lines.push(`  ${f.pid} | ${f.months}-month | ${fmtDate(f.completedAt)}`)); lines.push(""); }
    lines.push("ALL PATIENTS");
    all.forEach(p => { const bl = p.baseline?.completed ? "Baseline ✓" : "Baseline PENDING"; const fu = p.fus.map(f => `${f.months}mo:${f.completed ? "✓" : f.days < 0 ? "OVR" : "pending"}`).join(" "); lines.push(`  ${p.patient_id} | ${fmtDate(p.surgery_date)} | ${bl} | ${fu}`); });
    navigator.clipboard.writeText(lines.join("\n")).then(() => alert("Copied!")).catch(() => alert("Copy failed — screenshot instead."));
  };

  const secHead = (txt) => <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: 5, marginTop: 20, marginBottom: 10 }}>{txt}</div>;

  const Table = ({ head, headColor, headBg, rows, cols }) => (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, background: headBg, padding: "6px 8px" }}>
        {head.map((h, i) => <div key={i} style={{ padding: "4px 6px", fontSize: 11, fontWeight: 700, color: headColor }}>{h}</div>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: cols, background: i % 2 === 0 ? "#fff" : "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
          {row.map((cell, j) => <div key={j} style={{ padding: "7px 8px", fontSize: 12, fontFamily: j === 0 ? "monospace" : "inherit", fontWeight: j === 0 ? 600 : 400 }}>{cell}</div>)}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif", color: "#1e293b" }}>
      <div style={{ background: "#0f172a", color: "#fff", padding: "20px 16px", borderBottom: "3px solid #22c55e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>🔬 Operation Kitchen Research</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>Monthly Report</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{fmtMonth(now)} · {fmtDate(now)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 4 }}>
          {[["Enrolled", stats.total, "#0f172a"], ["Baseline\nPending", stats.baselinePending, stats.baselinePending > 0 ? "#7c3aed" : "#22c55e"], ["Contacted\nThis Month", stats.contactedThisMonth, "#0284c7"], ["Overdue", stats.overdue, stats.overdue > 0 ? "#dc2626" : "#22c55e"], ["Due in\n30 Days", stats.dueSoon, stats.dueSoon > 0 ? "#d97706" : "#22c55e"], ["All\nComplete", stats.allDone, "#22c55e"]].map(([label, val, color]) => (
            <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", marginTop: 4, whiteSpace: "pre-line", lineHeight: 1.3 }}>{label}</div>
            </div>
          ))}
        </div>
        {baselinePendingList.length > 0 && <>{secHead("📋 Baseline Pending")}<Table head={["Patient ID", "Surgery Date"]} headColor="#5b21b6" headBg="#f5f3ff" cols="1fr 1fr" rows={baselinePendingList.map(p => [p.patient_id, fmtDate(p.surgery_date)])} /></>}
        {overdueList.length > 0 && <>{secHead("🚨 Overdue")}<Table head={["Patient", "Milestone", "Overdue By"]} headColor="#991b1b" headBg="#fef2f2" cols="1fr 1fr 1fr" rows={overdueList.map(f => [f.pid, `${f.months}-month`, `${Math.abs(f.days)} days`])} /></>}
        {upcomingList.length > 0 && <>{secHead("📅 Due in 30 Days")}<Table head={["Patient", "Milestone", "Days Until"]} headColor="#92400e" headBg="#fffbeb" cols="1fr 1fr 1fr" rows={upcomingList.map(f => [f.pid, `${f.months}-month`, `${f.days} days`])} /></>}
        {completedThisMonth.length > 0 && <>{secHead("✓ Completed This Month")}<Table head={["Patient", "Milestone", "Contacted"]} headColor="#065f46" headBg="#f0fdf4" cols="1fr 1fr 1fr" rows={completedThisMonth.map(f => [f.pid, `${f.months}-month`, fmtDate(f.completedAt)])} /></>}
        {secHead("All Patients")}
        {all.map(p => (
          <div key={p.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ background: "#f8fafc", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{p.patient_id}</span><span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>Sx: {fmtDate(p.surgery_date)}</span></div>
              <span style={{ background: p.baseline?.completed ? "#d1fae5" : "#ede9fe", color: p.baseline?.completed ? "#065f46" : "#5b21b6", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{p.baseline?.completed ? "Baseline ✓" : "Baseline Pending"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #e2e8f0" }}>
              {p.fus.map(f => (
                <div key={f.months} style={{ padding: "8px 10px", borderRight: "1px solid #f1f5f9", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 3 }}>{f.months}mo</div>
                  {f.completed ? <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>✓ Done</div> : f.days < 0 ? <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>Overdue</div> : <div style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(f.dueDate)}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={handleCopy} style={btn("#f1f5f9", "#0f172a")}>📋 Copy Report</button>
          <button onClick={() => window.print()} style={btn("#0f172a", "#fff")}>🖨 Print / PDF</button>
          <button onClick={onClose} style={btn("#e2e8f0", "#64748b")}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formId, setFormId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!authed) { setLoading(false); return; }
    fetchPatients();
    const channel = supabase.channel("patients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => fetchPatients())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [authed]);

  async function fetchPatients() {
    setLoading(true);
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (!error && data) setPatients(data);
    setLoading(false);
  }

  const handleLogin = () => { sessionStorage.setItem(SESSION_KEY, "true"); setAuthed(true); };
  const handleLogout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); setPatients([]); };

  const addPatient = async () => {
    const id = formId.trim();
    if (!id || !formDate) { setError("Patient ID and Surgery Date are required."); return; }
    if (patients.find(p => p.patient_id === id)) { setError("Patient ID already exists."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("patients").insert({ patient_id: id, surgery_date: formDate, baseline: { completed: false, completedAt: null }, follow_ups: { 6: { completed: false, completedAt: null }, 12: { completed: false, completedAt: null }, 24: { completed: false, completedAt: null } } });
    if (err) { setError("Error: " + err.message); } else { setFormId(""); setFormDate(""); setError(""); await fetchPatients(); }
    setSaving(false);
  };

  const toggleBaseline = async (p) => {
    const done = !p.baseline?.completed;
    await supabase.from("patients").update({ baseline: { completed: done, completedAt: done ? new Date().toISOString() : null } }).eq("id", p.id);
    await fetchPatients();
  };

  const toggleFollowUp = async (p, months) => {
    const fu = p.follow_ups?.[months] || {};
    const done = !fu.completed;
    await supabase.from("patients").update({ follow_ups: { ...p.follow_ups, [months]: { completed: done, completedAt: done ? new Date().toISOString() : null } } }).eq("id", p.id);
    await fetchPatients();
  };

  const removePatient = async (p) => {
    if (!window.confirm(`Remove patient ${p.patient_id}?`)) return;
    await supabase.from("patients").delete().eq("id", p.id);
    await fetchPatients();
  };

  if (!authed) return <Login onLogin={handleLogin} />;
  if (showReport) return <Report patients={patients} onClose={() => setShowReport(false)} />;

  const all = patients.map(enrich);
  const overdueCount = all.filter(p => p.isOverdue).length;
  const urgentCount = all.filter(p => p.isUrgent || p.isOverdue).length;
  const baselinePendingCount = all.filter(p => !p.baseline?.completed).length;
  const filtered = all.filter(p => {
    if (filter === "overdue") return p.isOverdue;
    if (filter === "urgent") return p.isUrgent || p.isOverdue;
    if (filter === "baseline") return !p.baseline?.completed;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, sans-serif", color: "#1e293b" }}>
      <style>{`* { box-sizing: border-box; } button { font-family: inherit; } input { font-family: inherit; }`}</style>

      <div style={{ background: "#0f172a", color: "#fff", padding: "20px 16px", borderBottom: "3px solid #22c55e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>🔬 Operation Kitchen Research</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Follow-Up Tracker</h1>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>{patients.length} patient{patients.length !== 1 ? "s" : ""} enrolled · synced ☁️</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            {patients.length > 0 && <button onClick={() => setShowReport(true)} style={btn("#22c55e", "#fff")}>📊 Report</button>}
            <button onClick={handleLogout} style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Sign Out</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {baselinePendingCount > 0 && (
          <div style={{ background: "#f5f3ff", border: "1.5px solid #c4b5fd", borderRadius: 10, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontSize: 13, color: "#5b21b6" }}><strong>{baselinePendingCount} patient{baselinePendingCount > 1 ? "s" : ""}</strong> missing baseline survey</span>
          </div>
        )}
        {urgentCount > 0 && (
          <div style={{ background: overdueCount > 0 ? "#fef2f2" : "#fffbeb", border: `1.5px solid ${overdueCount > 0 ? "#fca5a5" : "#fcd34d"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>{overdueCount > 0 ? "🚨" : "⚠️"}</span>
            <span style={{ fontSize: 13, color: overdueCount > 0 ? "#991b1b" : "#92400e" }}><strong>{overdueCount > 0 ? `${overdueCount} patient${overdueCount > 1 ? "s" : ""} overdue` : `${urgentCount} due within 14 days`}</strong></span>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 12, padding: "16px", marginBottom: 12, border: "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>＋ Add Patient</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Patient ID</label>
            <input value={formId} onChange={e => setFormId(e.target.value)} placeholder="e.g. PT-0042" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 15, background: "#f8fafc", color: "#1e293b" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Surgery Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 15, background: "#f8fafc", color: "#1e293b" }} />
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button onClick={addPatient} disabled={saving} style={{ width: "100%", padding: "12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Add Patient"}
          </button>
        </div>

        {loading && <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Loading patients…</div>}

        {!loading && patients.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[["all", "All"], ["baseline", `Baseline (${baselinePendingCount})`], ["urgent", `Urgent (${urgentCount})`], ["overdue", `Overdue (${overdueCount})`]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter === val ? "none" : "1.5px solid #e2e8f0", background: filter === val ? "#0f172a" : "#fff", color: filter === val ? "#fff" : "#64748b" }}>{label}</button>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div>{patients.length === 0 ? "No patients yet. Add one above." : "No patients match this filter."}</div>
          </div>
        )}

        {filtered.map(p => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: "16px", marginBottom: 12, border: p.isOverdue ? "1.5px solid #fca5a5" : p.isUrgent ? "1.5px solid #fcd34d" : "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 16 }}>{p.patient_id}</span>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Surgery: {fmtDate(p.surgery_date)}</div>
              </div>
              <button onClick={() => removePatient(p)} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: p.baseline?.completed ? "#f0fdf4" : "#f5f3ff", border: `1px solid ${p.baseline?.completed ? "#bbf7d0" : "#c4b5fd"}`, borderRadius: 9, padding: "10px 12px", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.baseline?.completed ? "#065f46" : "#5b21b6" }}>📋 Baseline Survey</div>
                <div style={{ fontSize: 11, color: p.baseline?.completed ? "#86efac" : "#a78bfa", marginTop: 2 }}>{p.baseline?.completed ? `Completed ${fmtDate(p.baseline.completedAt)}` : "Not yet collected"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={chip(p.baseline?.completed ? "#d1fae5" : "#ede9fe", p.baseline?.completed ? "#065f46" : "#5b21b6")}>{p.baseline?.completed ? "✓ Done" : "Pending"}</span>
                <button onClick={() => toggleBaseline(p)} style={checkBtn(p.baseline?.completed)}>{p.baseline?.completed ? "✓" : ""}</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {p.fus.map(fu => (
                <div key={fu.months} style={{ background: fu.completed ? "#f0fdf4" : fu.days < 0 ? "#fef2f2" : fu.days <= 14 ? "#fffbeb" : "#f8fafc", border: `1px solid ${fu.completed ? "#bbf7d0" : fu.days < 0 ? "#fecaca" : fu.days <= 14 ? "#fde68a" : "#e2e8f0"}`, borderRadius: 9, padding: "10px 10px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{fu.months}mo</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{fmtDate(fu.dueDate)}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={fu.completed ? chip("#d1fae5", "#065f46") : fu.days < 0 ? chip("#fee2e2", "#991b1b") : fu.days <= 14 ? chip("#fef3c7", "#92400e") : chip("#f1f5f9", "#64748b")}>
                      {fu.completed ? "✓" : fu.days < 0 ? `${Math.abs(fu.days)}d late` : `${fu.days}d`}
                    </span>
                    <button onClick={() => toggleFollowUp(p, fu.months)} style={checkBtn(fu.completed)}>{fu.completed ? "✓" : ""}</button>
                  </div>
                  {fu.completed && fu.completedAt && <div style={{ fontSize: 10, color: "#86efac", marginTop: 5 }}>{fmtDate(fu.completedAt)}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {patients.length > 0 && !loading && (
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "#cbd5e1" }}>
            {patients.length} patient{patients.length !== 1 ? "s" : ""} · {all.filter(p => p.allDone).length} fully complete
          </div>
        )}
      </div>
    </div>
  );
}
