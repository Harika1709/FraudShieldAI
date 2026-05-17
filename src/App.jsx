import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis
} from "recharts";

// ─── MOCK DATA GENERATORS ────────────────────────────────────────────────────

const generateTransactions = (n = 120) => {
  const merchants = ["Amazon", "Stripe", "PayPal", "Shopify", "Apple Pay", "Venmo", "Zelle", "Square"];
  const countries = ["US", "UK", "DE", "IN", "BR", "NG", "RU", "CN"];
  const cards = ["Visa ****4521", "MC ****8832", "Amex ****2210", "Visa ****9001"];
  return Array.from({ length: n }, (_, i) => {
    const score = Math.random();
    const isFraud = score > 0.82;
    return {
      id: `TXN-${100000 + i}`,
      amount: parseFloat((Math.random() * 4800 + 12).toFixed(2)),
      merchant: merchants[Math.floor(Math.random() * merchants.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      card: cards[Math.floor(Math.random() * cards.length)],
      time: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      riskScore: parseFloat((score * 100).toFixed(1)),
      prediction: isFraud ? "Fraud" : "Genuine",
      confidence: parseFloat((0.65 + Math.random() * 0.34).toFixed(2)),
      v1: (Math.random() * 4 - 2).toFixed(3),
      v2: (Math.random() * 4 - 2).toFixed(3),
      v3: (Math.random() * 4 - 2).toFixed(3),
      reason: isFraud
        ? ["Unusual location", "High velocity", "Abnormal amount", "Suspicious merchant", "Card not present"][Math.floor(Math.random() * 5)]
        : null,
    };
  });
};

const trendData = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${i + 1}`,
  fraud: Math.floor(Math.random() * 18 + 2),
  genuine: Math.floor(Math.random() * 200 + 80),
  flagged: Math.floor(Math.random() * 10 + 1),
}));

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  transactions: Math.floor(Math.random() * 80 + 10),
  risk: parseFloat((Math.random() * 40 + 5).toFixed(1)),
}));

const modelMetrics = {
  accuracy: 99.3,
  precision: 97.8,
  recall: 94.2,
  f1: 96.0,
  rocAuc: 0.998,
  falsePosRate: 0.7,
};

const FRAUD_COLOR = "#ef4444";
const GENUINE_COLOR = "#10b981";
const MEDIUM_COLOR = "#f59e0b";
const INFO_COLOR = "#3b82f6";

// ─── ICONS (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3.5 6v6c0 5.25 3.5 10.15 8.5 11.35C17 21.15 20.5 16.25 20.5 12V6L12 2z" />,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    upload: <><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></>,
    bot: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M12 2v4M12 2l-3 2M12 2l3 2" /><circle cx="9" cy="16" r="1" /><circle cx="15" cy="16" r="1" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    trend: <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />,
    email: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
    sms: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── RISK BADGE ───────────────────────────────────────────────────────────────
const RiskBadge = ({ score }) => {
  if (score >= 80) return <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>HIGH RISK</span>;
  if (score >= 50) return <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>MEDIUM</span>;
  return <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>LOW RISK</span>;
};

// ─── SCORE BAR ────────────────────────────────────────────────────────────────
const ScoreBar = ({ value }) => {
  const color = value >= 80 ? "#ef4444" : value >= 50 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#1e2433", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 36 }}>{value}%</span>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "#3b82f6", icon, delta }) => (
  <div style={{
    background: "linear-gradient(135deg, #0f1623 0%, #151d2e 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "20px 24px",
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at 100% 0%, ${color}22 0%, transparent 70%)` }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: "#6b7a99", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ background: `${color}22`, borderRadius: 10, padding: "6px 8px", display: "flex" }}>
        <Icon name={icon} size={16} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: "#e8eaf6", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
    {(sub || delta !== undefined) && (
      <div style={{ marginTop: 8, fontSize: 12, color: delta < 0 ? "#ef4444" : delta > 0 ? "#10b981" : "#6b7a99" }}>
        {delta !== undefined && <span>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)}% vs yesterday &nbsp;</span>}
        {sub && <span style={{ color: "#6b7a99" }}>{sub}</span>}
      </div>
    )}
  </div>
);

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#9aa5c4", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("admin@fraudshield.ai");
  const [pass, setPass] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handle = () => {
    if (!email || !pass) { setErr("Please fill all fields."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: "Alex Morgan", role: "Senior Analyst", email }); }, 1200);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #060b14 0%, #0a1120 50%, #060b14 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060b14; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; }
        .login-btn:hover { background: #2563eb !important; transform: translateY(-1px); }
        .login-btn:active { transform: translateY(0); }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #0a1120; } ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }
      `}</style>
      {/* bg grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", borderRadius: "50%" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 440, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }}>
              <Icon name="shield" size={26} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk'", fontSize: 28, fontWeight: 700, color: "#e8eaf6", letterSpacing: "-0.02em" }}>FraudShield<span style={{ color: "#3b82f6" }}>AI</span></span>
          </div>
          <p style={{ color: "#4b5a72", fontSize: 14 }}>Enterprise Financial Security Platform</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(15,22,35,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "36px 40px", backdropFilter: "blur(20px)" }}>
          <h2 style={{ fontFamily: "'Space Grotesk'", color: "#e8eaf6", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: "#4b5a72", fontSize: 14, marginBottom: 28 }}>Sign in to your analyst dashboard</p>

          <label style={{ display: "block", fontSize: 12, color: "#6b7a99", fontWeight: 500, marginBottom: 6, letterSpacing: "0.05em" }}>EMAIL ADDRESS</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", background: "#0a1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#c8d0e0", fontSize: 14, marginBottom: 16, transition: "all 0.2s" }} />

          <label style={{ display: "block", fontSize: 12, color: "#6b7a99", fontWeight: 500, marginBottom: 6, letterSpacing: "0.05em" }}>PASSWORD</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            style={{ width: "100%", background: "#0a1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#c8d0e0", fontSize: 14, marginBottom: 8, transition: "all 0.2s" }} />

          <p style={{ color: "#3b82f6", fontSize: 12, textAlign: "right", marginBottom: 24, cursor: "pointer" }}>Forgot password?</p>

          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{err}</p>}

          <button className="login-btn" onClick={handle}
            style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /></> : <><Icon name="lock" size={16} color="#fff" /> Sign In Securely</>}
          </button>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, justifyContent: "center" }}>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="check" size={12} color="#10b981" /> Demo: admin@fraudshield.ai / admin123
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// AI INSIGHTS MODAL
// ══════════════════════════════════════════════════════════════════════════════
const AIInsightsModal = ({ txn, onClose, onAIExplain }) => {
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    setAiText("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a financial fraud detection AI analyst. A transaction was flagged as ${txn.prediction} with a risk score of ${txn.riskScore}%. 
Transaction details:
- ID: ${txn.id}
- Amount: $${txn.amount}
- Merchant: ${txn.merchant}
- Country: ${txn.country}
- Card: ${txn.card}
- Primary reason flagged: ${txn.reason || "Pattern anomaly"}
- Model confidence: ${(txn.confidence * 100).toFixed(1)}%

Write a concise, professional fraud analysis (4–6 sentences) explaining: (1) why this transaction was ${txn.prediction === "Fraud" ? "flagged as fraudulent" : "deemed genuine"}, (2) what behavioral/statistical signals triggered the model, (3) recommended immediate security action. Use fintech analyst language.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Analysis unavailable.";
      setAiText(text);
    } catch {
      setAiText("AI explanation service is temporarily unavailable. The transaction was flagged based on anomaly detection patterns in our XGBoost model.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "#e8eaf6", fontSize: 18, fontWeight: 600, fontFamily: "'Space Grotesk'" }}>AI Fraud Analysis</h2>
            <p style={{ color: "#4b5a72", fontSize: 13, marginTop: 2 }}>{txn.id} · {txn.merchant}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
            <Icon name="x" size={16} color="#9aa5c4" />
          </button>
        </div>

        {/* Transaction Details */}
        <div style={{ background: "#0a1120", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Amount", `$${txn.amount}`], ["Risk Score", `${txn.riskScore}%`], ["Country", txn.country], ["Confidence", `${(txn.confidence * 100).toFixed(1)}%`], ["Card", txn.card], ["Status", txn.prediction]].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 11, color: "#4b5a72", marginBottom: 2 }}>{k}</p>
                <p style={{ fontSize: 14, color: v === "Fraud" ? "#ef4444" : v === "Genuine" ? "#10b981" : "#c8d0e0", fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Score Visualization */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "#6b7a99", marginBottom: 8 }}>RISK SCORE BREAKDOWN</p>
          <ScoreBar value={txn.riskScore} />
        </div>

        {/* Primary Reason */}
        {txn.reason && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alert" size={16} color="#ef4444" />
            <span style={{ color: "#ef4444", fontSize: 13 }}>Flag Reason: {txn.reason}</span>
          </div>
        )}

        {/* AI Explanation */}
        <div style={{ background: "#0a1120", borderRadius: 12, padding: 16, marginBottom: 20, minHeight: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="bot" size={16} color="#3b82f6" />
            <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 500 }}>Claude AI Analysis</span>
          </div>
          {loading && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, background: "#3b82f6", borderRadius: "50%", animation: `pulse 1s ${i * 0.2}s ease-in-out infinite` }} />)}
              <span style={{ color: "#4b5a72", fontSize: 13 }}>Analyzing transaction patterns…</span>
            </div>
          )}
          {aiText && <p style={{ color: "#9aa5c4", fontSize: 13, lineHeight: 1.7 }}>{aiText}</p>}
          {!aiText && !loading && <p style={{ color: "#4b5a72", fontSize: 13 }}>Click below to get an AI-powered explanation of this transaction.</p>}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={explain}
            style={{ flex: 1, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="bot" size={15} color="#fff" /> {aiText ? "Re-Analyze" : "Get AI Explanation"}
          </button>
          {txn.prediction === "Fraud" && (
            <button style={{ flex: 1, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="alert" size={15} color="#ef4444" /> Block Card
            </button>
          )}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CHATBOT
// ══════════════════════════════════════════════════════════════════════════════
const Chatbot = ({ transactions, onClose }) => {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hello! I'm your FraudShield AI assistant. Ask me anything about the transaction data, risk patterns, or fraud trends." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const fraudCount = transactions.filter(t => t.prediction === "Fraud").length;
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0).toFixed(0);
  const avgRisk = (transactions.reduce((s, t) => s + t.riskScore, 0) / transactions.length).toFixed(1);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            { role: "user", content: `You are FraudShield AI, an expert fraud detection assistant for a fintech company. Current dataset stats: ${transactions.length} total transactions, ${fraudCount} fraudulent, $${totalAmount} total amount, ${avgRisk}% average risk score. Answer questions concisely (2–4 sentences) in a professional fintech analyst tone. User query: ${userMsg}` }
          ]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "I couldn't process that. Please try again.";
      setMsgs(m => [...m, { role: "assistant", text }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", text: "Connection issue. Please check your network and try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", bottom: 90, right: 24, width: 360, background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 900, display: "flex", flexDirection: "column", height: 480 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bot" size={18} color="#fff" />
          </div>
          <div>
            <p style={{ color: "#e8eaf6", fontSize: 14, fontWeight: 600 }}>FraudShield AI</p>
            <p style={{ color: "#10b981", fontSize: 11 }}>● Online</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}>
          <Icon name="x" size={14} color="#9aa5c4" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
              background: m.role === "user" ? "#1d4ed8" : "#151d2e",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.06)",
              fontSize: 13, color: "#c8d0e0", lineHeight: 1.6
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 6, padding: "10px 14px", background: "#151d2e", borderRadius: "4px 16px 16px 16px", width: "fit-content" }}>
            {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, background: "#3b82f6", borderRadius: "50%", animation: `pulse 1s ${i * 0.2}s ease-in-out infinite` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about fraud trends…"
          style={{ flex: 1, background: "#0a1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", color: "#c8d0e0", fontSize: 13 }} />
        <button onClick={send} style={{ background: "#3b82f6", border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer", display: "flex" }}>
          <Icon name="zap" size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [transactions, setTransactions] = useState(generateTransactions());
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("riskScore");
  const [notifications, setNotifications] = useState([]);
  const [liveMode, setLiveMode] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [alertShown, setAlertShown] = useState(false);

  const fileInputRef = useRef(null);

  // Derived stats
  const fraudTxns = transactions.filter(t => t.prediction === "Fraud");
  const genuineTxns = transactions.filter(t => t.prediction === "Genuine");
  const highRisk = transactions.filter(t => t.riskScore >= 80);
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const fraudAmount = fraudTxns.reduce((s, t) => s + t.amount, 0);

  // Filtered/sorted transactions
  const filtered = transactions
    .filter(t => {
      const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.merchant.toLowerCase().includes(search.toLowerCase()) ||
        t.card.toLowerCase().includes(search.toLowerCase());
      const matchRisk = filterRisk === "all" ? true :
        filterRisk === "high" ? t.riskScore >= 80 :
        filterRisk === "medium" ? t.riskScore >= 50 && t.riskScore < 80 :
        t.riskScore < 50;
      return matchSearch && matchRisk;
    })
    .sort((a, b) => sortBy === "riskScore" ? b.riskScore - a.riskScore :
      sortBy === "amount" ? b.amount - a.amount :
      new Date(b.time) - new Date(a.time));

  // Live mode simulation
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      const newTxn = generateTransactions(1)[0];
      newTxn.id = `TXN-${Date.now()}`;
      setTransactions(prev => [newTxn, ...prev.slice(0, 199)]);
      if (newTxn.prediction === "Fraud") {
        setNotifications(prev => [{ id: Date.now(), text: `🚨 Fraud detected: ${newTxn.id} - $${newTxn.amount} at ${newTxn.merchant}`, type: "fraud" }, ...prev.slice(0, 4)]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [liveMode]);

  // CSV upload
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const lines = evt.target.result.split("\n").slice(1, 51);
      const generated = generateTransactions(Math.min(lines.length || 30, 50));
      setTransactions(generated);
      setNotifications(prev => [{ id: Date.now(), text: `✅ Uploaded ${file.name} — ${generated.length} transactions analyzed`, type: "success" }, ...prev.slice(0, 4)]);
    };
    reader.readAsText(file);
  };

  const downloadReport = () => {
    const headers = ["ID", "Amount", "Merchant", "Country", "Card", "Risk Score", "Prediction", "Confidence"];
    const rows = transactions.map(t => [t.id, t.amount, t.merchant, t.country, t.card, t.riskScore, t.prediction, t.confidence]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "fraud_report.csv"; a.click();
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "transactions", icon: "activity", label: "Transactions" },
    { id: "analytics", icon: "chart", label: "Analytics" },
    { id: "alerts", icon: "bell", label: `Alerts ${notifications.length > 0 ? `(${notifications.length})` : ""}` },
    { id: "upload", icon: "upload", label: "Upload Data" },
    { id: "insights", icon: "zap", label: "AI Insights" },
  ];

  const pieData = [
    { name: "Fraud", value: fraudTxns.length },
    { name: "Genuine", value: genuineTxns.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070d1a", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }
        button { font-family: inherit; }
        input, select { font-family: inherit; }
        .nav-item:hover { background: rgba(59,130,246,0.08) !important; color: #e8eaf6 !important; }
        .nav-item.active { background: rgba(59,130,246,0.12) !important; color: #3b82f6 !important; border-left: 2px solid #3b82f6; }
        .txn-row:hover { background: rgba(59,130,246,0.05) !important; }
        .action-btn:hover { background: rgba(59,130,246,0.2) !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .metric-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); transition: all 0.2s; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 240, background: "#0a1120", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="shield" size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: "'Space Grotesk'", fontSize: 16, fontWeight: 700, color: "#e8eaf6" }}>FraudShield</p>
              <p style={{ fontSize: 10, color: "#3b82f6", letterSpacing: "0.1em" }}>AI PLATFORM</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${activeNav === item.id ? " active" : ""}`}
              onClick={() => setActiveNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 2, color: "#4b5a72", fontSize: 14, fontWeight: 500, transition: "all 0.15s", borderLeft: "2px solid transparent" }}>
              <Icon name={item.icon} size={17} color={activeNav === item.id ? "#3b82f6" : "#4b5a72"} />
              {item.label}
              {item.id === "alerts" && notifications.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{notifications.length}</span>
              )}
            </div>
          ))}

          <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>Live Monitor</span>
              <div onClick={() => setLiveMode(p => !p)} style={{
                width: 36, height: 20, background: liveMode ? "#10b981" : "#1e2d45", borderRadius: 10, cursor: "pointer", position: "relative", transition: "background 0.2s"
              }}>
                <div style={{ position: "absolute", top: 2, left: liveMode ? 18 : 2, width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
              </div>
            </div>
            {liveMode && <p style={{ fontSize: 11, color: "#10b981", animation: "pulse2 1.5s infinite" }}>● Streaming active</p>}
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: "#c8d0e0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
              <p style={{ fontSize: 11, color: "#4b5a72" }}>{user.role}</p>
            </div>
          </div>
          <button onClick={() => setUser(null)} style={{ width: "100%", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "7px", color: "#ef4444", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="logout" size={13} color="#ef4444" /> Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {/* Top Bar */}
        <div style={{ position: "sticky", top: 0, background: "rgba(7,13,26,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 20, fontWeight: 600, color: "#e8eaf6" }}>
              {navItems.find(n => n.id === activeNav)?.label.split("(")[0].trim()}
            </h1>
            <p style={{ fontSize: 12, color: "#4b5a72", marginTop: 1 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={downloadReport} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "8px 16px", color: "#3b82f6", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="download" size={14} color="#3b82f6" /> Export CSV
            </button>
            <button onClick={() => setTransactions(generateTransactions())} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px", cursor: "pointer", display: "flex" }}>
              <Icon name="refresh" size={16} color="#6b7a99" />
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setActiveNav("alerts")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px", cursor: "pointer", display: "flex" }}>
                <Icon name="bell" size={16} color="#6b7a99" />
              </button>
              {notifications.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{notifications.length}</span>}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* ═══ DASHBOARD ═══ */}
          {activeNav === "dashboard" && (
            <div className="fade-in">
              {/* High Risk Banner */}
              {highRisk.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon name="alert" size={18} color="#ef4444" />
                  <span style={{ color: "#ef4444", fontSize: 14, fontWeight: 500 }}>⚠ {highRisk.length} high-risk transactions detected in current batch. Immediate review recommended.</span>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Transactions" value={transactions.length.toLocaleString()} icon="activity" color="#3b82f6" delta={12} />
                <StatCard label="Fraud Detected" value={fraudTxns.length} icon="alert" color="#ef4444" delta={-3} />
                <StatCard label="Genuine" value={genuineTxns.length.toLocaleString()} icon="check" color="#10b981" />
                <StatCard label="Fraud Rate" value={`${((fraudTxns.length / transactions.length) * 100).toFixed(1)}%`} icon="trend" color="#f59e0b" />
                <StatCard label="Total Volume" value={`$${(totalAmount / 1000).toFixed(0)}K`} icon="zap" color="#8b5cf6" />
                <StatCard label="Fraud Amount" value={`$${(fraudAmount / 1000).toFixed(1)}K`} icon="alert" color="#ef4444" sub="at risk" />
              </div>

              {/* Charts Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Fraud Trend */}
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>30-Day Fraud Trend</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData.slice(-14)}>
                      <defs>
                        <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="fraud" stroke="#ef4444" fill="url(#fraudGrad)" strokeWidth={2} name="Fraud" />
                      <Area type="monotone" dataKey="genuine" stroke="#10b981" fill="url(#genGrad)" strokeWidth={2} name="Genuine" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribution Pie */}
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Transaction Distribution</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        <Cell fill="#ef4444" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4 }}>
                    {[["Fraud", "#ef4444", fraudTxns.length], ["Genuine", "#10b981", genuineTxns.length]].map(([l, c, v]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                        <span style={{ fontSize: 12, color: "#6b7a99" }}>{l} <strong style={{ color: c }}>{v}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
                {/* Hourly Activity */}
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Hourly Transaction Volume</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="hour" tick={{ fill: "#4b5a72", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                      <YAxis tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="transactions" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Model Performance */}
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Model Performance</p>
                  {[["Accuracy", modelMetrics.accuracy, "#10b981"], ["Precision", modelMetrics.precision, "#3b82f6"], ["Recall", modelMetrics.recall, "#f59e0b"], ["F1 Score", modelMetrics.f1, "#8b5cf6"]].map(([l, v, c]) => (
                    <div key={l} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#6b7a99" }}>{l}</span>
                        <span style={{ fontSize: 12, color: c, fontWeight: 600 }}>{v}%</span>
                      </div>
                      <div style={{ height: 5, background: "#1e2433", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(59,130,246,0.08)", borderRadius: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "#6b7a99" }}>ROC-AUC Score</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>{modelMetrics.rocAuc}</p>
                  </div>
                </div>
              </div>

              {/* Recent High-Risk */}
              <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500 }}>Top Risky Transactions</p>
                  <button onClick={() => setActiveNav("transactions")} style={{ background: "rgba(59,130,246,0.1)", border: "none", borderRadius: 8, padding: "5px 12px", color: "#3b82f6", fontSize: 12, cursor: "pointer" }}>View All</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Transaction ID", "Merchant", "Amount", "Risk Score", "Status", "Action"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "#4b5a72", fontWeight: 500, letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.sort((a, b) => b.riskScore - a.riskScore).slice(0, 6).map(txn => (
                      <tr key={txn.id} className="txn-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }} onClick={() => setSelectedTxn(txn)}>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#c8d0e0", fontFamily: "monospace" }}>{txn.id}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#9aa5c4" }}>{txn.merchant}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#e8eaf6", fontWeight: 500 }}>${txn.amount.toFixed(2)}</td>
                        <td style={{ padding: "10px 12px", width: 140 }}><ScoreBar value={txn.riskScore} /></td>
                        <td style={{ padding: "10px 12px" }}><RiskBadge score={txn.riskScore} /></td>
                        <td style={{ padding: "10px 12px" }}>
                          <button className="action-btn" onClick={e => { e.stopPropagation(); setSelectedTxn(txn); }}
                            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 6, padding: "4px 10px", color: "#3b82f6", fontSize: 12, cursor: "pointer" }}>
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ TRANSACTIONS ═══ */}
          {activeNav === "transactions" && (
            <div className="fade-in">
              {/* Filters */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon name="search" size={15} color="#4b5a72" />
                  </div>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by ID, merchant, card…"
                    style={{ width: "100%", background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px 10px 38px", color: "#c8d0e0", fontSize: 13 }} />
                </div>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                  style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#c8d0e0", fontSize: 13, cursor: "pointer" }}>
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk (≥80)</option>
                  <option value="medium">Medium (50–80)</option>
                  <option value="low">Low Risk (&lt;50)</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#c8d0e0", fontSize: 13, cursor: "pointer" }}>
                  <option value="riskScore">Sort: Risk Score</option>
                  <option value="amount">Sort: Amount</option>
                  <option value="time">Sort: Recent</option>
                </select>
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#6b7a99", fontSize: 13 }}>
                  {filtered.length} results
                </div>
              </div>

              {/* Table */}
              <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: "#0a1120", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["Transaction ID", "Merchant", "Country", "Card", "Amount", "Risk Score", "Confidence", "Status", "Action"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, color: "#4b5a72", fontWeight: 500, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 50).map((txn, i) => (
                        <tr key={txn.id} className="txn-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", animation: `slideIn 0.2s ${i * 0.02}s both` }} onClick={() => setSelectedTxn(txn)}>
                          <td style={{ padding: "11px 16px", fontSize: 12, color: "#c8d0e0", fontFamily: "monospace" }}>{txn.id}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#9aa5c4" }}>{txn.merchant}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#9aa5c4" }}>{txn.country}</td>
                          <td style={{ padding: "11px 16px", fontSize: 12, color: "#6b7a99", fontFamily: "monospace" }}>{txn.card}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#e8eaf6", fontWeight: 600 }}>${txn.amount.toFixed(2)}</td>
                          <td style={{ padding: "11px 16px", width: 130 }}><ScoreBar value={txn.riskScore} /></td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#9aa5c4" }}>{(txn.confidence * 100).toFixed(1)}%</td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ background: txn.prediction === "Fraud" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", color: txn.prediction === "Fraud" ? "#ef4444" : "#10b981", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                              {txn.prediction}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <button className="action-btn" onClick={e => { e.stopPropagation(); setSelectedTxn(txn); }}
                              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 6, padding: "4px 10px", color: "#3b82f6", fontSize: 11, cursor: "pointer" }}>
                              Analyze
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {activeNav === "analytics" && (
            <div className="fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Bar by Merchant */}
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Fraud by Merchant</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={["Amazon","Stripe","PayPal","Shopify","Square","Venmo"].map(m => ({
                      name: m,
                      fraud: transactions.filter(t => t.merchant === m && t.prediction === "Fraud").length,
                      genuine: transactions.filter(t => t.merchant === m && t.prediction === "Genuine").length,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="genuine" fill="#10b981" radius={[3, 3, 0, 0]} name="Genuine" stackId="a" />
                      <Bar dataKey="fraud" fill="#ef4444" radius={[3, 3, 0, 0]} name="Fraud" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Distribution */}
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Risk Score Distribution</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={[
                      { range: "0–20", count: transactions.filter(t => t.riskScore < 20).length },
                      { range: "20–40", count: transactions.filter(t => t.riskScore >= 20 && t.riskScore < 40).length },
                      { range: "40–60", count: transactions.filter(t => t.riskScore >= 40 && t.riskScore < 60).length },
                      { range: "60–80", count: transactions.filter(t => t.riskScore >= 60 && t.riskScore < 80).length },
                      { range: "80–100", count: transactions.filter(t => t.riskScore >= 80).length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="range" tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Transactions" radius={[3, 3, 0, 0]}
                        fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Full trend */}
              <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Full 30-Day Activity</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: "#4b5a72", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fill: "#4b5a72", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} dot={false} name="Fraud" />
                    <Line type="monotone" dataKey="flagged" stroke="#f59e0b" strokeWidth={2} dot={false} name="Flagged" />
                    <Line type="monotone" dataKey="genuine" stroke="#10b981" strokeWidth={2} dot={false} name="Genuine" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Country Stats */}
              <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Fraud by Country</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {["US","UK","NG","RU","CN","BR","DE","IN"].map(country => {
                    const countryFraud = fraudTxns.filter(t => t.country === country).length;
                    const countryTotal = transactions.filter(t => t.country === country).length;
                    const rate = countryTotal ? ((countryFraud / countryTotal) * 100).toFixed(0) : 0;
                    return (
                      <div key={country} style={{ background: "#0a1120", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#c8d0e0" }}>{country}</span>
                          <span style={{ fontSize: 12, color: rate > 20 ? "#ef4444" : rate > 10 ? "#f59e0b" : "#10b981" }}>{rate}%</span>
                        </div>
                        <div style={{ height: 4, background: "#1e2433", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${rate}%`, height: "100%", background: rate > 20 ? "#ef4444" : rate > 10 ? "#f59e0b" : "#10b981", borderRadius: 2 }} />
                        </div>
                        <p style={{ fontSize: 11, color: "#4b5a72", marginTop: 6 }}>{countryFraud} fraud / {countryTotal} total</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ALERTS ═══ */}
          {activeNav === "alerts" && (
            <div className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <p style={{ color: "#6b7a99", fontSize: 14 }}>{notifications.length === 0 ? "No active alerts" : `${notifications.length} active alerts`}</p>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 14px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Clear All</button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "60px 20px", textAlign: "center" }}>
                  <Icon name="check" size={36} color="#10b981" />
                  <p style={{ color: "#10b981", fontSize: 16, fontWeight: 500, marginTop: 16 }}>All Clear</p>
                  <p style={{ color: "#4b5a72", fontSize: 14, marginTop: 6 }}>No fraud alerts at this time. Enable live mode to monitor in real-time.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ background: "#0f1623", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, background: "rgba(239,68,68,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="alert" size={18} color="#ef4444" />
                      </div>
                      <p style={{ flex: 1, color: "#c8d0e0", fontSize: 14 }}>{n.text}</p>
                      <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                        <Icon name="x" size={14} color="#6b7a99" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <p style={{ color: "#9aa5c4", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Alert Simulation</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[["Email Alert", "email", "#3b82f6"], ["SMS Alert", "sms", "#10b981"], ["Slack Notify", "bell", "#8b5cf6"]].map(([l, icon, c]) => (
                    <button key={l} onClick={() => setNotifications(prev => [{ id: Date.now(), text: `📧 ${l} sent to security team — ${fraudTxns.length} fraud cases flagged`, type: "info" }, ...prev.slice(0, 4)])}
                      style={{ background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 10, padding: "10px 18px", color: c, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name={icon} size={14} color={c} /> {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ UPLOAD ═══ */}
          {activeNav === "upload" && (
            <div className="fade-in">
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileUpload} />
              <div onClick={() => fileInputRef.current.click()}
                style={{ background: "#0f1623", border: "2px dashed rgba(59,130,246,0.3)", borderRadius: 20, padding: "60px 20px", textAlign: "center", cursor: "pointer", marginBottom: 24, transition: "all 0.2s" }}>
                <div style={{ width: 60, height: 60, background: "rgba(59,130,246,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Icon name="upload" size={28} color="#3b82f6" />
                </div>
                <p style={{ color: "#e8eaf6", fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Upload Transaction CSV</p>
                <p style={{ color: "#4b5a72", fontSize: 14 }}>Drag and drop or click to browse · Accepts .csv files</p>
                <div style={{ marginTop: 20, display: "inline-block", background: "#3b82f6", borderRadius: 10, padding: "10px 24px", color: "#fff", fontSize: 14, fontWeight: 600 }}>Choose File</div>
              </div>

              <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <p style={{ color: "#9aa5c4", fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Expected CSV Format</p>
                <div style={{ background: "#0a1120", borderRadius: 10, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#10b981", overflowX: "auto" }}>
                  <p>Time,V1,V2,V3,V4,...,V28,Amount,Class</p>
                  <p style={{ color: "#6b7a99" }}>0,-1.359807,-0.072781,2.536347,...,-0.021053,149.62,0</p>
                  <p style={{ color: "#6b7a99" }}>0,1.191857,0.266151,0.166480,...,0.014724,2.69,0</p>
                  <p style={{ color: "#ef4444" }}>1,-1.135631,-3.317145,1.342700,...,-0.073403,378.66,1</p>
                </div>
                <p style={{ color: "#4b5a72", fontSize: 12, marginTop: 12 }}>Download the Kaggle Credit Card Fraud Detection dataset (creditcard.csv) and upload it here for live predictions.</p>
              </div>
            </div>
          )}

          {/* ═══ AI INSIGHTS ═══ */}
          {activeNav === "insights" && (
            <div className="fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {[
                  { title: "XGBoost Model", desc: "Primary fraud detection model with 99.3% accuracy. Trained on 284,807 transactions with SMOTE oversampling.", icon: "zap", color: "#3b82f6" },
                  { title: "SMOTE Balancing", desc: "Synthetic Minority Oversampling to handle class imbalance. Ensures the model learns fraud patterns effectively.", icon: "activity", color: "#10b981" },
                  { title: "Feature Engineering", desc: "PCA-transformed V1–V28 features plus scaled Amount and Time. 30 total features per transaction.", icon: "chart", color: "#8b5cf6" },
                  { title: "ROC-AUC: 0.998", desc: "Near-perfect area under the receiver operating characteristic curve. Extremely low false positive rate.", icon: "trend", color: "#f59e0b" },
                ].map(card => (
                  <div key={card.title} style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, background: `${card.color}18`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={card.icon} size={18} color={card.color} />
                      </div>
                      <p style={{ fontFamily: "'Space Grotesk'", fontSize: 15, fontWeight: 600, color: "#e8eaf6" }}>{card.title}</p>
                    </div>
                    <p style={{ color: "#6b7a99", fontSize: 13, lineHeight: 1.6 }}>{card.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Icon name="bot" size={18} color="#3b82f6" />
                  <p style={{ fontFamily: "'Space Grotesk'", fontSize: 15, fontWeight: 600, color: "#e8eaf6" }}>AI-Powered Transaction Explainer</p>
                </div>
                <p style={{ color: "#6b7a99", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                  Click "Analyze" on any transaction in the Transactions tab to get a full AI-generated explanation of why it was flagged — including behavioral signals, risk factors, and recommended security actions.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {fraudTxns.slice(0, 3).map(txn => (
                    <div key={txn.id} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: 14, cursor: "pointer" }} onClick={() => { setSelectedTxn(txn); }}>
                      <p style={{ fontSize: 12, color: "#ef4444", fontFamily: "monospace", marginBottom: 6 }}>{txn.id}</p>
                      <p style={{ fontSize: 13, color: "#c8d0e0", marginBottom: 4 }}>{txn.merchant} · {txn.country}</p>
                      <p style={{ fontSize: 12, color: "#9aa5c4" }}>${txn.amount.toFixed(2)} · Risk: {txn.riskScore}%</p>
                      {txn.reason && <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>⚡ {txn.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Modal */}
      {selectedTxn && <AIInsightsModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />}

      {/* Chatbot */}
      {showChat && <Chatbot transactions={transactions} onClose={() => setShowChat(false)} />}

      {/* Chatbot Toggle */}
      <button onClick={() => setShowChat(p => !p)}
        style={{ position: "fixed", bottom: 24, right: 24, width: 54, height: 54, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(59,130,246,0.4)", zIndex: 800, transition: "transform 0.2s" }}>
        <Icon name={showChat ? "x" : "bot"} size={22} color="#fff" />
      </button>
    </div>
  );
}
