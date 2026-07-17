import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Send,
  LayoutGrid,
  DoorOpen,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Camera,
  LineChart,
  FileSpreadsheet,
  MessageSquare,
  Radio,
  Zap
} from "lucide-react";
import './src/styles.css';
import SectionTitle from './src/components/SectionTitle';
import Card from './src/components/Card';
import StatCard from './src/components/StatCard';
import Overview from './src/components/Overview';
import GatesView from './src/components/GatesView';
import { callGeminiSafe } from './src/utils/api';
import { severityFor, fmtClock, stripFence, initialGates } from './src/utils/helpers';

// ---------------------------------------------------------------------------
// Enterprise Technical Layout Design System (Precision Minimalist Theme)
// ---------------------------------------------------------------------------
const C = {
  bg: "#12161A",          // Matte Obsidian technical backdrop
  panel: "#1A1F26",       // Solid carbon core system surface panels
  border: "#2C3540",      // Single-stroke primary ink rules (CAD grid weight)
  borderThick: "#475569", // Double weight for major terminal boundaries
  text: "#E2E8F0",        // Neutral paper white text layer
  muted: "#8A99AD",       // Muted slate gray labeling ink
  faint: "#414E5E",       // Minimal architectural guide lines
  accent: "#38BDF8",      // Sky blue high-precision data vectors
  accentSoft: "#1E293B",  // Recessed panel overlay tinting
};

const SEVERITY = {
  normal: { label: "STATUS: NORMAL // PASS", color: "#10B981", bg: "transparent", border: "#059669" },
  caution: { label: "STATUS: CAUTION // OVERAGE", color: "#F59E0B", bg: "transparent", border: "#D97706" },
  critical: { label: "STATUS: CRITICAL // ACTIONS REQ", color: "#EF4444", bg: "transparent", border: "#DC2626" },
};

const INCIDENT_TYPES = ["Medical", "Security", "Policy", "Facilities"];
const CAPACITY = 62000;

const GATES_SEED = [
  "Gate A — North Plaza",
  "Gate B — Northeast",
  "Gate C — East Concourse",
  "Gate D — Southeast",
  "Gate E — South Plaza",
  "Gate F — Southwest",
  "Gate G — West Concourse",
  "Gate H — Northwest",
];

const CHANNELS = [
  { id: "gates", label: "PERIMETER GATES FEED", subtitle: "All Active Ingress Points" },
  { id: "security_mgr", label: "SECURITY MANAGER DESK", subtitle: "Direct Command Link" },
  { id: "ambulance", label: "EMS / AMBULANCE DISPATCH", subtitle: "Medical Response Units" },
  { id: "police", label: "LAW ENFORCEMENT NET", subtitle: "External Police Link" },
  { id: "incharges", label: "SECTOR IN-CHARGES", subtitle: "Internal Floor Management" },
];

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes tactical-pulse { 0%, 100% { border-color: #DC2626; opacity: 1; } 50% { border-color: #475569; opacity: 0.8; } }
    .pulse-alert { animation: tactical-pulse 1.5s infinite ease-in-out; border-width: 2px !important; }
    @keyframes text-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .pulse-text-anim { animation: text-blink 2s infinite ease-in-out; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #1A1F26; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #2C3540; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

    @keyframes football-roll {
      0%   { transform: translate(-50%, -50%) translate(-18px, 0px) rotate(0deg); }
      25%  { transform: translate(-50%, -50%) translate(-4px, -8px) rotate(90deg); }
      50%  { transform: translate(-50%, -50%) translate(18px, 0px) rotate(180deg); }
      75%  { transform: translate(-50%, -50%) translate(-4px, 8px) rotate(270deg); }
      100% { transform: translate(-50%, -50%) translate(-18px, 0px) rotate(360deg); }
    }
    .football-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      font-size: 15px;
      animation: football-roll 3.2s ease-in-out infinite;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    }

    @keyframes live-dot-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
      50% { box-shadow: 0 0 6px 2px rgba(16,185,129,0.35); }
    }
    .live-status-dot { animation: live-dot-glow 1.8s infinite ease-in-out; }
  `;
  document.head.appendChild(style);
}

// Network API callers are implemented in `src/utils/api.js` (callGeminiSafe)

const TABS = [
  { id: "overview", label: "Overview Map", icon: LayoutGrid },
  { id: "gates", label: "Ingress Matrix", icon: DoorOpen },
  { id: "assistant", label: "AI Intel Desk", icon: Sparkles },
  { id: "incidents", label: "Operations Log", icon: ClipboardList },
  { id: "comms", label: "Radio Comms", icon: MessageSquare },
];


export default function StadiumOpsControl() {
  const [tab, setTab] = useState("overview");
  const [gates, setGates] = useState(initialGates);
  const [matchMinute, setMatchMinute] = useState(12);
  const [weather] = useState({ tempF: 94 });
  const [seatsFilled, setSeatsFilled] = useState(38400);
  const [flowRate, setFlowRate] = useState(640);

  const [briefs, setBriefs] = useState([]);
  const [briefLoading, setBriefLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [incidentType, setIncidentType] = useState("Medical");
  const [incidentLocation, setIncidentLocation] = useState(GATES_SEED[0]);
  const [incidentText, setIncidentText] = useState("");
  const [incidentDraft, setIncidentDraft] = useState(null);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentLog, setIncidentLog] = useState([]);

  // Intra-Agency Radio Comms States
  const [activeChannel, setActiveChannel] = useState("gates");
  const [channelInputs, setChannelInputs] = useState({ gates: "", security_mgr: "", ambulance: "", police: "", incharges: "" });
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelHistories, setChannelHistories] = useState({
    gates: [
      { sender: "Gate C Supervisor", msg: "Visual check confirms high congestion layout at the turnstiles. Requesting AI balancing shunts.", time: "10'" },
      { sender: "Operating Officer", msg: "Copy that. Reviewing system metric balances now.", time: "11'" }
    ],
    security_mgr: [
      { sender: "Security Manager", msg: "Perimeter checkpoints locked. Cross-referencing current zone tracking details.", time: "05'" }
    ],
    ambulance: [
      { sender: "Ambulance Core 1", msg: "Paramedic crew alpha stationed on outer bypass loop ring road. Status clear.", time: "02'" }
    ],
    police: [
      { sender: "Police Dispatch Post", msg: "External transport grids maintaining normalized vehicular movement vectors.", time: "08'" }
    ],
    incharges: [
      { sender: "Concourse 2 Incharge", msg: "Stairwell routing monitors in position. Flow rate calculated safe.", time: "09'" }
    ],
  });

  // System Core Simulation Toggles
  const [forecastActive, setForecastActive] = useState(false);
  const [cameraSimulated, setCameraSimulated] = useState(false);
  const [activeRerouteRecommendation, setActiveRerouteRecommendation] = useState({
    sourceId: "C",
    sourceName: "Gate C — East Concourse",
    targetId: "F",
    targetName: "Gate F — Southwest",
    active: true
  });

  const staffOnDuty = React.useMemo(() => gates.filter((g) => g.open).reduce((s, g) => s + g.staff, 0) + 54, [gates]);
  const flowRateRef = useRef(flowRate);
  useEffect(() => { flowRateRef.current = flowRate; }, [flowRate]);

  useEffect(() => {
    // Single persistent interval; read latest flowRate from ref to avoid re-creating the timer.
    const iv = setInterval(() => {
      setGates((prev) =>
        prev.map((g) => {
          if (!g.open) return g;
          const rateModifier = flowRateRef.current / 800;
          const drift = (Math.random() - 0.38) * 16 * rateModifier;
          const next = Math.min(98, Math.max(6, g.density + drift));
          const trend = next - g.density > 2 ? 'rising' : g.density - next > 2 ? 'falling' : 'steady';
          const queue = Math.max(1, Math.round((next * 1.8) / (g.staff || 1)));
          return { ...g, density: Math.round(next), queue, trend };
        })
      );
      setMatchMinute((m) => (m >= 90 ? 90 : m + 1));
      setSeatsFilled((prev) => {
        const room = CAPACITY * 0.96 - prev;
        const delta = Math.max(0, Math.round(room * 0.035 + (Math.random() - 0.28) * 110));
        setFlowRate((_) => {
          const newFlow = Math.max(0, Math.round(delta * 16.4));
          flowRateRef.current = newFlow;
          return newFlow;
        });
        return Math.min(Math.round(CAPACITY * 0.96), prev + delta);
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const snapshot = useCallback(
    () => ({
      matchMinute,
      seatsFilled,
      capacity: CAPACITY,
      flowRatePerMin: flowRate,
      staffOnDuty,
      gates: gates.map((g) => ({
        gate: g.name,
        open: g.open,
        staff: g.staff,
        density_pct: g.open ? g.density : null,
        queue_minutes: g.open ? g.queue : null,
        trend: g.open ? g.trend : null,
      })),
      weather,
    }),
    [gates, matchMinute, weather, seatsFilled, flowRate, staffOnDuty]
  );

  const generateBrief = useCallback(async () => {
    setBriefLoading(true);
    const snap = snapshot();
    const prompt = `Generate venue intelligence summary JSON for match minute ${snap.matchMinute}. Data: ${JSON.stringify(snap)}`;
    
    try {
      const raw = await callGeminiSafe(prompt, "json");
      const parsed = JSON.parse(stripFence(raw));
      setBriefs((prev) => [
        { id: Date.now(), time: fmtClock(matchMinute), summary: parsed.summary, alerts: parsed.alerts || [] },
        ...prev,
      ].slice(0, 5));
    } catch (e) {
      const criticalGatesCount = gates.filter((g) => g.open && severityFor(g.density) === "critical");
      const localSummary = `Command Audit Log: Facilities distribution flow capacity operating at ${Math.round((seatsFilled / CAPACITY) * 100)}% absolute efficiency load. ${criticalGatesCount.length} operational zones recording upper-tier volume densities under extended environmental ambient temp variables (${weather.tempF}°F).`;
      
      const localAlerts = gates
        .filter((g) => g.open && severityFor(g.density) !== "normal")
        .map((g) => ({
          gate: g.name,
          severity: severityFor(g.density),
          message: `${g.name} calculated capacity matrix sitting at ${g.density}% with standard line delay coefficients estimated at ~${g.queue}M.`,
          action: g.density >= 75 ? "Initiate operational re-routing vectors to balance processing queues." : "Reallocate sector staff resources to open supplementary checkpoints.",
        }));

      setBriefs((prev) => [
        { id: Date.now(), time: fmtClock(matchMinute), summary: localSummary, alerts: localAlerts, localEngine: true },
        ...prev,
      ].slice(0, 5));
    } finally {
      setBriefLoading(false);
    }
  }, [snapshot, matchMinute, gates, seatsFilled, weather]);

  useEffect(() => {
    generateBrief();
    const iv = setInterval(generateBrief, 35000);
    return () => clearInterval(iv);
  }, [generateBrief]);

  const askAI = useCallback(async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatLoading(true);

    try {
      const prompt = `Context: ${JSON.stringify(snapshot())}. Question: ${q}`;
      const raw = await callGeminiSafe(prompt, "text");
      setChatMessages((prev) => [...prev, { role: "ai", text: raw.trim() }]);
    } catch (e) {
      let fallbackResponse = `Analytical query processed against active telemetry arrays. Operational frameworks confirm performance thresholds remain inside expected variance windows. Global field staff tracking stands at ${staffOnDuty} responders across all sectors.`;
      setChatMessages((prev) => [...prev, { role: "ai", text: fallbackResponse }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, snapshot, staffOnDuty]);

  // Generative AI Radio Communications Simulation Layer
  const syncChannelWithGenAI = async (channelId) => {
    setChannelLoading(true);
    const snap = snapshot();
    const channelMeta = CHANNELS.find(c => c.id === channelId);
    
    const prompt = `You are simulated enterprise facility staff communicating on an official technical radio. 
    Generate a JSON array containing exactly 2 highly professional, realistic, technical radio messages between field personnel and the Operating Officer for the channel: "${channelMeta.label}".
    Current venue context: Match Minute ${snap.matchMinute}, Ambient Temp ${snap.weather.tempF}°F, Ingress Flow Rate ${snap.flowRatePerMin}/min, Mean Density ${avgLoad}%.
    Use realistic code words, explicit sector names, professional tone (no casual text slang). Return layout structure exactly:
    [
      {"sender": "Gate Alpha Lead", "msg": "...", "time": "${fmtClock(snap.matchMinute)}"},
      {"sender": "Operating Officer", "msg": "...", "time": "${fmtClock(snap.matchMinute + 1)}"}
    ]`;

    try {
      const raw = await callGeminiSafe(prompt, "json");
      const parsed = JSON.parse(stripFence(raw));
      if (Array.isArray(parsed)) {
        setChannelHistories(prev => ({
          ...prev,
          [channelId]: parsed
        }));
      }
    } catch (err) {
      console.error("AI Comms generation failed, using local emergency arrays", err);
    } finally {
      setChannelLoading(false);
    }
  };

  const sendRadioMessage = async () => {
    const currentTxt = channelInputs[activeChannel].trim();
    if (!currentTxt) return;

    const userMessage = {
      sender: "Operating Officer",
      msg: currentTxt,
      time: fmtClock(matchMinute)
    };

    setChannelHistories(prev => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], userMessage]
    }));

    setChannelInputs(prev => ({ ...prev, [activeChannel]: "" }));
    setChannelLoading(true);

    // AI Core responds directly to user prompt text inside agency channels
    const prompt = `Context: A stadium control dispatcher sent this radio message over channel "${activeChannel}": "${currentTxt}".
    Current stadium metrics: Temp ${weather.tempF}°F, Flow Rate ${flowRate}/m.
    Generate a 1-sentence highly professional, technical, authoritative response acknowledgement from the perspective of that specific agency field unit. Do not include quotes.`;

    try {
      const rawReply = await callGeminiSafe(prompt, "text");
      let respondentName = "Field Dispatch Echo";
      if (activeChannel === "gates") respondentName = "Turnstile Control Sector C";
      if (activeChannel === "security_mgr") respondentName = "Security Supervisor Main";
      if (activeChannel === "ambulance") respondentName = "EMS Medic Unit Alpha";
      if (activeChannel === "police") respondentName = "Police Command Vehicle";
      if (activeChannel === "incharges") respondentName = "Floor Management Incharge";

      setChannelHistories(prev => ({
        ...prev,
        [activeChannel]: [...prev[activeChannel], { sender: respondentName, msg: rawReply.trim(), time: fmtClock(matchMinute) }]
      }));
    } catch (e) {
      // Fallback
      setChannelHistories(prev => ({
        ...prev,
        [activeChannel]: [...prev[activeChannel], { sender: "Field unit", msg: "Directive received. Confirm alignment with telemetry systems.", time: fmtClock(matchMinute) }]
      }));
    } finally {
      setChannelLoading(false);
    }
  };

  const getSopChecklist = (type) => {
    switch(type) {
      case "Medical":
        return [
          { step: "Clear access pathways for emergency vehicular ingress corridors.", done: true },
          { step: "Establish line-of-sight tracking on localized microclimatic thermal indicators.", done: false },
          { step: "Signal local medical bay assets to stand by for localized patient triage protocols.", done: false }
        ];
      case "Security":
        return [
          { step: "Enforce spatial buffer zoning to manage localized sector bottlenecks.", done: true },
          { step: "Direct target optical camera feeds to secure cross-referenced tracking coordinates.", done: false },
          { step: "Verify identity clearance documentation indices for field coordinators.", done: false }
        ];
      default:
        return [
          { step: "Perform verification audits on active technical logging entries.", done: true },
          { step: "Update standard administrative records inside core infrastructure ledger.", done: false }
        ];
    }
  };

  const draftIncident = useCallback(async () => {
    const t = incidentText.trim();
    if (!t || incidentLoading) return;
    setIncidentLoading(true);

    try {
      const prompt = `Draft structured incident log JSON for: "${t}" at ${incidentLocation}`;
      const raw = await callGeminiSafe(prompt, "json");
      const parsed = JSON.parse(stripFence(raw));
      
      const entry = {
        id: Date.now(),
        time: fmtClock(matchMinute),
        type: incidentType,
        location: incidentLocation,
        dispatchedUnits: [],
        sopChecklist: getSopChecklist(incidentType),
        ...parsed,
      };
      setIncidentLog((prev) => [entry, ...prev]);
      setIncidentDraft(entry);
    } catch (e) {
      const isCriticalKeyword = t.toLowerCase().includes("heat") || t.toLowerCase().includes("collapse") || t.toLowerCase().includes("fight") || weather.tempF >= 92;
      
      const entry = {
        id: Date.now(),
        time: fmtClock(matchMinute),
        type: incidentType,
        location: incidentLocation,
        title: `${incidentType} Operating Event Classification`,
        severity: isCriticalKeyword ? "high" : "medium",
        description: t,
        dispatchedUnits: [],
        sopChecklist: getSopChecklist(incidentType),
        recommended_department: incidentType === "Medical" ? "Emergency Medical Dispatch" : incidentType === "Security" ? "Perimeter Security Fleet" : "General Operations Command",
      };
      setIncidentLog((prev) => [entry, ...prev]);
      setIncidentDraft(entry);
    } finally {
      setIncidentText("");
      setIncidentLoading(false);
    }
  }, [incidentText, incidentLoading, matchMinute, incidentType, incidentLocation, weather]);

  const executeTrafficReroute = useCallback((targetGateId) => {
    setGates((prevGates) => {
      const currentTarget = prevGates.find((g) => g.id === targetGateId);
      if (!currentTarget) return prevGates;
      return prevGates.map((g) => {
        if (g.id === targetGateId) { return { ...g, density: Math.max(20, g.density - 22), trend: "falling", staff: g.staff + 2 }; }
        if (g.open && g.id !== targetGateId && g.density < 45) { return { ...g, density: Math.min(95, g.density + 4), staff: Math.max(1, g.staff - 1) }; }
        return g;
      });
    });
  }, []);

  const handleAcceptAIRecommendation = () => {
    executeTrafficReroute(activeRerouteRecommendation.sourceId);
    setActiveRerouteRecommendation(prev => ({ ...prev, active: false }));
  };

  const handleTriggerCameraSimulation = () => {
    setCameraSimulated(true);
    setGates((prev) => prev.map(g => g.id === "C" || g.id === "D" ? { ...g, density: 85, trend: "rising" } : g));
    setTimeout(() => setCameraSimulated(false), 8000);
  };

  const handleTriggerForecast = () => {
    setForecastActive(true);
    setTimeout(() => setForecastActive(false), 10000);
  };

  const triggerUnitDispatch = (incidentId, unitLabel) => {
    setIncidentLog((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const currentUnits = inc.dispatchedUnits || [];
          if (!currentUnits.includes(unitLabel)) { return { ...inc, dispatchedUnits: [...currentUnits, unitLabel] }; }
        }
        return inc;
      })
    );
  };

  const toggleSopStep = (incidentId, stepIndex) => {
    setIncidentLog((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId && inc.sopChecklist) {
          const updated = [...inc.sopChecklist];
          updated[stepIndex].done = !updated[stepIndex].done;
          return { ...inc, sopChecklist: updated };
        }
        return inc;
      })
    );
  };

  const openGates = gates.filter((g) => g.open);
  const closedGates = gates.filter((g) => !g.open);
  const criticalGates = openGates.filter((g) => severityFor(g.density) === "critical");
  const cautionGates = openGates.filter((g) => severityFor(g.density) === "caution");
  const avgLoad = Math.round(openGates.reduce((s, g) => s + g.density, 0) / (openGates.length || 1));
  const latestBrief = briefs[0];

  const sevPill = (sev) => {
    const s = SEVERITY[sev] || SEVERITY.normal;
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-sm tracking-wide uppercase border"
        style={{ color: s.color, borderColor: s.color, fontSize: "10px" }}
      >
        {s.label.split("//")[1] || s.label}
      </span>
    );
  };

  return (
    <main role="main" aria-label="Stadium Operations Control" style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: 40 }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Top Professional Operational Navigation Strip */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.panel, padding: "14px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", color: "#FFF" }}>FACILITIES MANAGEMENT OPERATIONS SYSTEM CONTROLLER</div>
            <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 16, marginTop: 4 }}>
              <span>WORKFLOW ID: 24BAI70001</span>
              <span>•</span>
              <span>DATA SUBSYSTEM: GEN AI INTEGRATED RADIO ARCHITECTURE</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 12, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: 9, color: C.muted }}>MATCH TIMELINE</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF" }}>{fmtClock(matchMinute)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1200, margin: "24px auto 0 auto", gap: 24, padding: "0 16px" }}>
        
        {/* Left Side Control Panel Columns */}
        <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, padding: "0 6px 6px 6px", borderBottom: `1px solid ${C.border}`, letterSpacing: "0.05em" }}>OPERATIONAL VIEWPORTS</div>
          <nav aria-label="Operational viewports" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: active ? "#242C37" : "transparent",
                    color: active ? C.accent : C.text,
                    border: active ? `1px solid ${C.borderThick}` : `1px solid transparent`,
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s ease",
                  }}
                >
                  <Icon size={14} />
                  <span style={{ flex: 1 }}>{t.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div style={{ border: `1px solid ${C.border}`, padding: 12, marginTop: 16, background: C.panel, borderRadius: 3 }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.03em", marginBottom: 8 }}>DIAGNOSTIC AUTOMATION MOCKS</div>
            <button 
              onClick={handleTriggerForecast}
              disabled={forecastActive}
              style={{
                width: "100%",
                background: "#000",
                color: "#E2E8F0",
                border: `1px solid ${C.border}`,
                fontSize: 10,
                padding: "8px 6px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginBottom: 6
              }}
            >
              <LineChart size={12} />
              {forecastActive ? "CALCULATING..." : "RUN 15-MIN OPERATIONAL FORECAST"}
            </button>

            <button 
              onClick={handleTriggerCameraSimulation}
              disabled={cameraSimulated}
              style={{
                width: "100%",
                background: "#000",
                color: "#E2E8F0",
                border: `1px solid ${C.border}`,
                fontSize: 10,
                padding: "8px 6px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Camera size={12} />
              {cameraSimulated ? "PROCESSING FEED..." : "SIMULATE CAMERA FEED UPLOAD"}
            </button>
          </div>
        </div>

        {/* Workspace Display Core Canvas Area */}
        <div id="main-content" tabIndex={-1} style={{ flex: 1, minWidth: 0 }}>
          {tab === "overview" && (
            <Overview
              avgLoad={avgLoad}
              seatsFilled={seatsFilled}
              openGates={openGates}
              closedGates={closedGates}
              criticalGates={criticalGates}
              cautionGates={cautionGates}
              flowRate={flowRate}
              latestBrief={latestBrief}
              briefLoading={briefLoading}
              onOpenAssistant={() => setTab("assistant")}
              sevPill={sevPill}
              weather={weather}
              C={C}
              SEVERITY={SEVERITY}
            />
          )}
          
          {tab === "gates" && (
            <GatesView 
              gates={gates} 
              sevPill={sevPill} 
              executeTrafficReroute={executeTrafficReroute}
              C={C}
              SEVERITY={SEVERITY}
            />
          )}
          
          {tab === "assistant" && (
            <AssistantView
              briefs={briefs}
              briefLoading={briefLoading}
              generateBrief={generateBrief}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatLoading={chatLoading}
              askAI={askAI}
              flowRate={flowRate}
              weather={weather}
              staffOnDuty={staffOnDuty}
              avgLoad={avgLoad}
              gates={gates}
              activeRerouteRecommendation={activeRerouteRecommendation}
              handleAcceptAIRecommendation={handleAcceptAIRecommendation}
              forecastActive={forecastActive}
            />
          )}
          
          {tab === "incidents" && (
            <IncidentsView
              incidentType={incidentType}
              setIncidentType={setIncidentType}
              incidentLocation={incidentLocation}
              setIncidentLocation={setIncidentLocation}
              incidentText={incidentText}
              setIncidentText={setIncidentText}
              draftIncident={draftIncident}
              incidentLoading={incidentLoading}
              incidentDraft={incidentDraft}
              incidentLog={incidentLog}
              triggerUnitDispatch={triggerUnitDispatch}
              toggleSopStep={toggleSopStep}
            />
          )}

          {tab === "comms" && (
            <CommsHubView
              channels={CHANNELS}
              activeChannel={activeChannel}
              setActiveChannel={setActiveChannel}
              channelInputs={channelInputs}
              setChannelInputs={setChannelInputs}
              channelHistories={channelHistories}
              sendRadioMessage={sendRadioMessage}
              syncChannelWithGenAI={syncChannelWithGenAI}
              channelLoading={channelLoading}
            />
          )}
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// DUAL-PANEL INTRA-AGENCY COMMS HUB WITH GEN AI STREAMING
// ---------------------------------------------------------------------------
function CommsHubView({ channels, activeChannel, setActiveChannel, channelInputs, setChannelInputs, channelHistories, sendRadioMessage, syncChannelWithGenAI, channelLoading }) {
  const selectedChan = channels.find(c => c.id === activeChannel);
  
  return (
    <div>
      <SectionTitle 
        action={
          <button 
            onClick={() => syncChannelWithGenAI(activeChannel)} 
            disabled={channelLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, padding: "5px 8px", background: "#000", border: `1px solid ${C.border}`, color: C.accent, cursor: "pointer", fontWeight: 700 }}
          >
            {channelLoading ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />} 
            GENERATE REAL AI TRAFFIC
          </button>
        }
      >
        Intra-Agency Tactical Radio Communications Network
      </SectionTitle>
      
      <div style={{ display: "flex", gap: 16, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3, height: 460 }}>
        
        {/* Left Sub-Channel Selection */}
        <div style={{ width: 240, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 2, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, padding: "0 4px 6px 4px", letterSpacing: "0.03em" }}>AVAILABLE NETWORKS</div>
          {channels.map((chan) => {
            const isActive = chan.id === activeChannel;
            return (
              <button
                key={chan.id}
                onClick={() => setActiveChannel(chan.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  background: isActive ? "#242C37" : "transparent",
                  border: `1px solid ${isActive ? C.borderThick : "transparent"}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: isActive ? C.accent : "#FFF" }}>
                  <Radio size={12} color={isActive ? C.accent : C.muted} />
                  {chan.label}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2, paddingLeft: 18 }}>{chan.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Right Shared Message Feed Space */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0E1116" }}>
          
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 16px", background: "#161B22", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>{selectedChan?.label}</span>
              <span style={{ fontSize: 9, color: C.muted, marginLeft: 10 }}>[GEN AI TRANSMISSION STREAMING ENGINE]</span>
            </div>
            <span className={!channelLoading ? "live-status-dot" : ""} style={{ fontSize: 9, padding: "2px 6px", background: channelLoading ? "#78350F" : "#064E3B", color: channelLoading ? "#F59E0B" : "#10B981", border: `1px solid ${channelLoading ? "#D97706" : "#059669"}`, fontWeight: 700 }}>
              {channelLoading ? "SYNTHESIZING FLOW..." : "RADIO LINK OK"}
            </span>
          </div>

          <div className="custom-scrollbar" style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {channelHistories[activeChannel].map((message, index) => {
              const isOfficer = message.sender === "Operating Officer";
              return (
                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: isOfficer ? "flex-end" : "flex-start" }}>
                  <div style={{ display: "flex", gap: 6, fontSize: 9, color: C.muted, fontWeight: 600, marginBottom: 2 }}>
                    <span>{message.sender.toUpperCase()}</span>
                    <span>•</span>
                    <span>{message.time}</span>
                  </div>
                  <div style={{
                    fontSize: 11.5,
                    padding: "8px 12px",
                    maxWidth: "75%",
                    background: isOfficer ? "#1E293B" : C.panel,
                    color: "#FFF",
                    border: `1px solid ${isOfficer ? C.borderThick : C.border}`,
                    borderRadius: 2,
                    lineHeight: 1.45
                  }}>
                    {message.msg}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, background: "#161B22" }}>
              <div style={{ display: "flex", gap: 6 }}>
              <input aria-label={`Broadcast message to ${selectedChan?.label}`} 
                value={channelInputs[activeChannel]}
                onChange={(e) => {
                  const val = e.target.value;
                  setChannelInputs(prev => ({ ...prev, [activeChannel]: val }));
                }}
                onKeyDown={(e) => e.key === "Enter" && sendRadioMessage()}
                placeholder={`BROADCAST OVERRIDE MESSAGE TO ${selectedChan?.label}...`} 
                style={{ flex: 1, fontSize: 11, background: "#000", color: "#FFF", padding: "8px 12px", border: `1px solid ${C.border}`, outline: "none" }}
              />
              <button aria-label="Send broadcast message" onClick={sendRadioMessage} disabled={channelLoading} style={{ background: "transparent", border: `1px solid ${C.borderThick}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {channelLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} color={C.accent} />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Core UI primitives (Card, SectionTitle, StatCard, Overview, GatesView) are
// provided as separate, independently-tested components in `src/components`
// and imported at the top of this file — they are not redefined here.

function AssistantView({ briefs, briefLoading, generateBrief, chatMessages, chatInput, setChatInput, chatLoading, askAI, gates, activeRerouteRecommendation, handleAcceptAIRecommendation, forecastActive }) {
  const getGateStyles = (gateId) => {
    const target = gates.find(g => g.id === gateId);
    if (!target) return { bg: "#161B22", text: C.muted, border: `1px dashed ${C.border}`, label: "VOID SECTOR" };
    if (!target.open) return { bg: "#14181E", text: C.muted, border: `1px solid ${C.faint}`, label: "LOCKED GRID" };
    const sev = severityFor(target.density);
    let forecastBorder = null;
    if (forecastActive && (gateId === "C" || gateId === "D" || gateId === "B")) { forecastBorder = `1px dashed ${SEVERITY.critical.color}`; }
    if (sev === "critical") return { bg: "transparent", text: SEVERITY.critical.color, border: forecastBorder || `1px solid ${SEVERITY.critical.color}`, label: `OVER LOAD [${target.density}%]`, pulse: true };
    if (sev === "caution") return { bg: "transparent", text: SEVERITY.caution.color, border: forecastBorder || `1px solid ${SEVERITY.caution.color}`, label: `ELEVATED [${target.density}%]` };
    return { bg: "transparent", text: C.text, border: forecastBorder || `1px solid ${C.border}`, label: `NOMINAL [${target.density}%]` };
  };

  return (
    <div>
      <SectionTitle action={<button onClick={generateBrief} disabled={briefLoading} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, padding: "5px 8px", background: "#000", border: `1px solid ${C.border}`, color: "#FFF", cursor: "pointer", fontWeight: 600 }}>{briefLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} FORCE COMPILER SNAPSHOT</button>}>
        Tactical Intelligence Integration Terminal Desk Workspace
      </SectionTitle>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", background: C.panel, border: `1px solid ${C.border}`, minWidth: 0, borderRadius: 3 }}>
          {activeRerouteRecommendation.active && (
            <div style={{ background: "#1F242E", borderBottom: `1px solid ${C.accent}`, padding: "10px 14px", display: "flex", alignItems: "center", justifySpace: "space-between", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color={C.accent} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#FFF" }}>AI Core Recommendation: Shift capacity routing load from <strong style={{ color: SEVERITY.critical.color }}>{activeRerouteRecommendation.sourceId}</strong> to donor gate <strong style={{ color: "#10B981" }}>{activeRerouteRecommendation.targetId}</strong>.</span>
              </div>
              <button onClick={handleAcceptAIRecommendation} style={{ background: "transparent", border: `1px solid ${C.accent}`, color: C.accent, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>[Accept Directive]</button>
            </div>
          )}
          <div style={{ padding: 10, borderBottom: `1px solid ${C.border}`, background: "#151920" }}>
              <div style={{ display: "flex", gap: 6 }}>
              <input aria-label="AI prompt input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAI()} placeholder="PROMPT AI CORE ENGINE AGENTS..." style={{ flex: 1, fontSize: 11, background: "#0D0F12", color: "#FFF", padding: "8px 10px", border: `1px solid ${C.border}`, outline: "none" }} />
              <button aria-label="Send AI prompt" onClick={askAI} disabled={chatLoading} style={{ width: 36, background: "transparent", border: `1px solid ${C.borderThick}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{chatLoading ? <Loader2 size={13} color="#fff" className="animate-spin" /> : <Send size={13} color={C.accent} />}</button>
            </div>
          </div>
          <div className="custom-scrollbar" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: "220px", overflowY: "auto", background: "#0E1217" }}>
            {chatMessages.length === 0 && <div style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>// Data pipeline logs clear.</div>}
            {chatMessages.map((m, i) => (
              <div key={i} style={{ fontSize: 11.5, padding: 10, border: `1px solid ${C.border}`, background: m.role === "user" ? "#19222B" : "#1A1F26", color: "#FFF", lineHeight: 1.45 }}><span style={{ fontWeight: 700, color: m.role === "user" ? C.accent : SEVERITY.caution.color }}>{m.role === "user" ? "DISPATCH OPERATOR AUDIT: " : "SYSTEM LOG ENGINE: "}</span>{m.text}</div>
            ))}
          </div>
          <div className="custom-scrollbar" style={{ borderTop: `1px solid ${C.border}`, padding: 14, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10, background: "#12161D" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.04em" }}>// COMPILING AUDIT TELEMETRY RECTIFIER RECORD PACKETS</div>
            {briefs.map((b) => (
              <div key={b.id} style={{ border: `1px solid ${C.border}`, padding: 10, background: "#161B24", borderLeft: b.alerts?.length ? `2px solid ${SEVERITY.caution.color}` : `2px solid ${C.borderThick}` }}>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: "#CBD5E1" }}>{b.summary}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 340 }}>
          <div style={{ background: "#0D1116", border: `1px solid ${C.border}`, padding: 10, borderRadius: 3 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gap: 6, height: 250 }}>
              {["A", "B", "H", "G"].map(id => (
                <div key={id} className={getGateStyles(id).pulse ? "pulse-alert" : ""} style={{ color: getGateStyles(id).text, border: getGateStyles(id).border, padding: 4, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontSize: 10, fontWeight: 700 }}><div>GATE {id}</div><span style={{ fontSize: 8, color: C.muted }}>{getGateStyles(id).label}</span></div>
              ))}
              <div style={{ color: "#FFF", border: `1px solid ${C.borderThick}`, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 11, fontWeight: 700, background: "#1F2937", position: "relative", overflow: "hidden" }}>
                <span style={{ fontSize: 9, fontWeight: 800 }}>ARENA BOWL</span>
                <span className="football-icon" role="img" aria-label="football">⚽</span>
              </div>
              {["C", "F", "E", "D"].map(id => (
                <div key={id} className={getGateStyles(id).pulse ? "pulse-alert" : ""} style={{ color: getGateStyles(id).text, border: getGateStyles(id).border, padding: 4, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontSize: 10, fontWeight: 700 }}><div>GATE {id}</div><span style={{ fontSize: 8, color: C.muted }}>{getGateStyles(id).label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentsView({ incidentType, setIncidentType, incidentLocation, setIncidentLocation, incidentText, setIncidentText, draftIncident, incidentLoading, incidentLog, triggerUnitDispatch, toggleSopStep }) {
  const getSevDetails = (sev) => sev === "high" ? SEVERITY.critical : sev === "medium" ? SEVERITY.caution : SEVERITY.normal;
  return (
    <div>
      <SectionTitle>Emergency Incidents Logging Workspace</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="sr-only" htmlFor="incidentTypeSelect">Incident Type</label>
            <select id="incidentTypeSelect" aria-label="Incident type" value={incidentType} onChange={(e) => setIncidentType(e.target.value)} style={{ width: "100%", fontSize: 12, background: "#000", color: "#FFF", padding: "8px", border: `1px solid ${C.border}` }}>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()} PROTOCOL</option>)}
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor="incidentLocationSelect">Incident Location</label>
            <select id="incidentLocationSelect" aria-label="Incident location" value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)} style={{ width: "100%", fontSize: 12, background: "#000", color: "#FFF", padding: "8px", border: `1px solid ${C.border}` }}>
              {GATES_SEED.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <textarea aria-label="Incident details" value={incidentText} onChange={(e) => setIncidentText(e.target.value)} placeholder="FILE COMPREHENSIVE NARRATIVE DETAILS..." style={{ width: "100%", minHeight: 70, fontSize: 12, background: "#000", color: "#FFF", padding: 10, border: `1px solid ${C.border}` }} />
        <button onClick={draftIncident} disabled={incidentLoading || !incidentText.trim()} style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "8px 14px", border: `1px solid ${C.borderThick}`, background: C.accentSoft, color: C.accent }}><FileSpreadsheet size={12} /> COMMIT DATA MANIFEST</button>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {incidentLog.map((e) => (
          <Card key={e.id} style={{ borderLeft: `2px solid ${getSevDetails(e.severity).color}` }}>
            <div style={{ fontSize: 11.5, color: "#D1D5DB", background: "#0F1319", padding: 10, border: `1px solid ${C.border}` }}>{e.description}</div>
            {e.sopChecklist && (
              <div style={{ background: "#161B22", border: `1px solid ${C.border}`, padding: 10, marginTop: 8 }}>
                {e.sopChecklist.map((stepObj, stepIdx) => (
                  <label key={stepIdx} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#E2E8F0" }}><input type="checkbox" checked={stepObj.done} onChange={() => toggleSopStep(e.id, stepIdx)} /><span>{stepObj.step}</span></label>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {["Ambulance", "Police", "Security", "Paramedics"].map(unit => (
                <button key={unit} onClick={() => triggerUnitDispatch(e.id, unit)} style={{ fontSize: 10, padding: "5px 10px", border: `1px solid ${C.border}`, background: "#000", color: "#FFF" }}>[CALL {unit.toUpperCase()}]</button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}