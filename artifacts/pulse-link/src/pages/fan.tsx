import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Ticket, Navigation, Bell, Bot, ScanFace, ScanLine,
  X, ChevronRight, MapPin, Clock, Users, CheckCircle2,
  Zap, AlertTriangle, Copy, Check, ArrowLeft
} from "lucide-react";
import {
  useListNotifications,
  useDismissNotification,
  useGetFanNavigation,
  useCreateCheckin,
  useGetFan,
  useListCheckins,
} from "@workspace/api-client-react";

type Tab = "ticket" | "navigate" | "deals" | "assistant";

// ─── Stadium coordinate map ──────────────────────────────────────────────────
// Each location name maps to [x, y] on a 320×180 SVG canvas
const WAYPOINT_COORDS: Record<string, [number, number]> = {
  "Your Location":          [28,  138],
  "Section A Entrance":     [28,  138],
  "Gate 2 - North East":    [248,  22],
  "Gate 3 - East":          [302,  90],
  "Gate 4 - South East":    [248, 158],
  "North Concessions":      [160,   8],
  "South Concessions":      [160, 172],
  "Section A Seating":      [95,   90],
  "Section B Seating":      [225,  90],
  "Main Restrooms":         [210, 162],
  "VIP Lounge":             [75,   22],
  "Medical Station":        [22,   72],
  "Security Checkpoint 1":  [258,  55],
  "Main Corridor":          [160,  90],
};

// Stadium map component
function StadiumMap({
  navPath,
  destination,
}: {
  navPath?: { recommendedPath: string[]; congestionLevel: string } | null;
  destination: string;
}) {
  const W = 320;
  const H = 180;
  const cx = 160;
  const cy = 90;

  // Build polyline points from recommendedPath
  const routePoints: [number, number][] = [];
  if (navPath?.recommendedPath) {
    for (const stop of navPath.recommendedPath) {
      const coord = WAYPOINT_COORDS[stop];
      if (coord) routePoints.push(coord);
    }
  }
  // Fallback: at least show start → dest
  if (routePoints.length < 2) {
    const destId = destination;
    // Find best coordinate for selected destination
    const destCoord =
      WAYPOINT_COORDS[destId] ||
      WAYPOINT_COORDS[destId.replace(" Seating", "")] ||
      [300, 90] as [number, number];
    routePoints.push([28, 138], destCoord);
  }

  const polylineStr = routePoints.map(([x, y]) => `${x},${y}`).join(" ");
  const start = routePoints[0];
  const end = routePoints[routePoints.length - 1];
  const middle = routePoints.slice(1, -1);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-[#050c1a]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        style={{ background: "#050c1a" }}
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00BFFF" />
            <stop offset="100%" stopColor="#00FF88" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softglow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Stadium outer ring ── */}
        <ellipse cx={cx} cy={cy} rx={148} ry={84}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        <ellipse cx={cx} cy={cy} rx={148} ry={84}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

        {/* ── Inner walkway ── */}
        <ellipse cx={cx} cy={cy} rx={112} ry={64}
          fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* ── Playing field ── */}
        <rect x={106} y={56} width={108} height={68} rx={6}
          fill="#062210" stroke="#00FF88" strokeWidth="0.8" strokeOpacity="0.3" />
        {/* Centre circle */}
        <circle cx={cx} cy={cy} r={16}
          fill="none" stroke="#00FF88" strokeWidth="0.6" strokeOpacity="0.25" />
        {/* Centre line */}
        <line x1={cx} y1={58} x2={cx} y2={122}
          stroke="#00FF88" strokeWidth="0.5" strokeOpacity="0.2" />
        {/* Penalty areas */}
        <rect x={106} y={69} width={22} height={42} rx={2}
          fill="none" stroke="#00FF88" strokeWidth="0.5" strokeOpacity="0.15" />
        <rect x={192} y={69} width={22} height={42} rx={2}
          fill="none" stroke="#00FF88" strokeWidth="0.5" strokeOpacity="0.15" />

        {/* ── Static labels for main zones ── */}
        {[
          { label: "N STAND", x: cx, y: 30 },
          { label: "S STAND", x: cx, y: 163 },
          { label: "W", x: 16, y: 93 },
          { label: "E", x: 308, y: 93 },
        ].map(({ label, x, y }) => (
          <text key={label} x={x} y={y} textAnchor="middle"
            fontSize="5.5" fill="rgba(255,255,255,0.15)" fontFamily="monospace" fontWeight="700"
            letterSpacing="1">
            {label}
          </text>
        ))}

        {/* ── Gate markers (static dots at gate positions) ── */}
        {(Object.entries(WAYPOINT_COORDS) as [string, [number, number]][])
          .filter(([name]) => name.startsWith("Gate"))
          .map(([name, [gx, gy]]) => (
            <g key={name}>
              <circle cx={gx} cy={gy} r={4}
                fill="#1a2840" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <text x={gx} y={gy - 6} textAnchor="middle"
                fontSize="4.5" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
                {name.split(" - ")[0]}
              </text>
            </g>
          ))}

        {/* ── Route line ── */}
        {routePoints.length >= 2 && (
          <>
            {/* Shadow / glow layer */}
            <polyline
              points={polylineStr}
              fill="none"
              stroke="#00BFFF"
              strokeWidth="5"
              strokeOpacity="0.12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main dashed route */}
            <polyline
              points={polylineStr}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="2.5"
              strokeDasharray="7 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-55"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </polyline>
          </>
        )}

        {/* ── Intermediate waypoint markers ── */}
        {middle.map(([wx, wy], i) => (
          <g key={i}>
            <circle cx={wx} cy={wy} r={5}
              fill="#0d1a2e" stroke="#00BFFF" strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx={wx} cy={wy} r={2} fill="#00BFFF" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4"
                dur="2s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
            </circle>
          </g>
        ))}

        {/* ── YOU marker (pulsing beacon) ── */}
        {start && (
          <g>
            {/* Pulse ring */}
            <circle cx={start[0]} cy={start[1]} r={10}
              fill="none" stroke="#00BFFF" strokeWidth="1.5" opacity="0.3">
              <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={start[0]} cy={start[1]} r={6}
              fill="#00BFFF" stroke="white" strokeWidth="1.5" filter="url(#glow)" />
            <circle cx={start[0]} cy={start[1]} r={2.5} fill="white" />
            <text x={start[0]} y={start[1] - 12} textAnchor="middle"
              fontSize="5.5" fill="#00BFFF" fontFamily="monospace" fontWeight="700">YOU</text>
          </g>
        )}

        {/* ── DESTINATION marker ── */}
        {end && !(end[0] === start[0] && end[1] === start[1]) && (
          <g>
            <circle cx={end[0]} cy={end[1]} r={8}
              fill="#00FF88" fillOpacity="0.15" stroke="#00FF88" strokeWidth="1.5"
              filter="url(#softglow)" />
            <circle cx={end[0]} cy={end[1]} r={3.5} fill="#00FF88" filter="url(#glow)" />
            {/* Pin spike */}
            <line x1={end[0]} y1={end[1] + 3.5} x2={end[0]} y2={end[1] + 10}
              stroke="#00FF88" strokeWidth="1.5" strokeOpacity="0.7" />
            <text x={end[0]} y={end[1] - 12} textAnchor="middle"
              fontSize="5.5" fill="#00FF88" fontFamily="monospace" fontWeight="700">DEST</text>
          </g>
        )}
      </svg>

      {/* Congestion badge */}
      {navPath && (
        <div className="border-t border-white/5 px-3 py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse"
               style={{ background: navPath.congestionLevel === "low" ? "#00FF88" : navPath.congestionLevel === "high" ? "#ff4d4d" : "#f59e0b" }} />
          <span className="text-[10px] uppercase tracking-widest text-gray-500">
            Crowd: <span style={{ color: navPath.congestionLevel === "low" ? "#00FF88" : navPath.congestionLevel === "high" ? "#ff4d4d" : "#f59e0b" }}>
              {navPath.congestionLevel}
            </span>
          </span>
          <span className="text-[10px] text-gray-600 ml-auto">{routePoints.length - 1} stops</span>
        </div>
      )}
    </div>
  );
}

const DESTINATIONS = [
  { id: "North Concessions", label: "North Concessions", emoji: "🍔" },
  { id: "South Concessions", label: "South Concessions", emoji: "🌮" },
  { id: "Section A Seating", label: "Section A", emoji: "🪑" },
  { id: "Section B Seating", label: "Section B", emoji: "🪑" },
  { id: "Main Restrooms", label: "Restrooms", emoji: "🚻" },
  { id: "VIP Lounge", label: "VIP Lounge", emoji: "⭐" },
];

export default function FanInterface() {
  const fanId = 1;
  const [activeTab, setActiveTab] = useState<Tab>("ticket");
  const [destination, setDestination] = useState(DESTINATIONS[0].id);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState<"success" | "fail" | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: fan, refetch: refetchFan } = useGetFan(fanId, { query: { enabled: true } });
  const { data: notifications = [], refetch: refetchNotifications } = useListNotifications({
    query: { refetchInterval: 5000 },
  });
  const { data: checkins = [] } = useListCheckins({ query: { refetchInterval: 5000 } });
  const dismissNotification = useDismissNotification();
  const createCheckin = useCreateCheckin();

  const { data: navPath } = useGetFanNavigation(
    fanId,
    { destination },
    { query: { enabled: !!destination, refetchInterval: 5000 } }
  );

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const myCheckin = checkins.find(c => c.fanId === fanId);
  const isCheckedIn = fan?.checkedIn || !!myCheckin;

  const handleScan = () => {
    if (scanning || isCheckedIn) return;
    setScanning(true);
    setScanDone(null);
    setTimeout(() => {
      createCheckin.mutate(
        { data: { fanId, gateId: 2, verificationMethod: "biometric" } },
        {
          onSuccess: () => {
            setScanning(false);
            setScanDone("success");
            refetchFan();
          },
          onError: () => {
            setScanning(false);
            setScanDone("fail");
          },
        }
      );
    }, 2500);
  };

  const handleDismiss = (id: number) => {
    dismissNotification.mutate({ id }, { onSuccess: () => refetchNotifications() });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const congestionColor =
    navPath?.congestionLevel === "low"
      ? "#00FF88"
      : navPath?.congestionLevel === "high"
      ? "#ff4d4d"
      : "#f59e0b";

  return (
    <div className="min-h-[100dvh] bg-[#0a0f1e] text-white font-mono flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-3 border-b border-white/10 bg-[#0a0f1e]/90 backdrop-blur flex items-center justify-between">
        <Link href="/">
          <button className="p-1 text-gray-500 hover:text-[#00BFFF] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#00BFFF]" />
          <span className="text-sm font-bold uppercase tracking-widest text-[#00BFFF]">Pulse-Link</span>
        </div>
        {activeNotifications.length > 0 && (
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00FF88] rounded-full flex items-center justify-center text-[9px] font-black text-[#0a0f1e]">
              {activeNotifications.length}
            </div>
          </div>
        )}
        {activeNotifications.length === 0 && <div className="w-7" />}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* TICKET TAB */}
        {activeTab === "ticket" && (
          <div className="p-4 space-y-4">
            {/* Digital Ticket */}
            <div className="relative rounded-2xl overflow-hidden border border-[#00BFFF]/40 shadow-[0_0_30px_rgba(0,191,255,0.1)]"
                 style={{ background: "linear-gradient(135deg, #0d1a2e 0%, #0a1628 50%, #071220 100%)" }}>
              {/* Ticket top strip */}
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #00BFFF, #00FF88)" }} />

              <div className="p-5">
                {/* Event name */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">City Thunderbolts</div>
                    <div className="text-xl font-black text-white leading-tight">VS River Hawks</div>
                    <div className="text-xs text-gray-400 mt-1">Apex Arena · Apr 15 · 19:30</div>
                  </div>
                  {isCheckedIn && (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="h-7 w-7 text-[#00FF88]" />
                      <span className="text-[9px] text-[#00FF88] uppercase tracking-wider">Checked In</span>
                    </div>
                  )}
                </div>

                {/* Divider with holes */}
                <div className="relative my-4 flex items-center">
                  <div className="absolute -left-5 w-5 h-5 rounded-full bg-[#0a0f1e]" />
                  <div className="flex-1 border-t border-dashed border-white/20" />
                  <div className="absolute -right-5 w-5 h-5 rounded-full bg-[#0a0f1e]" />
                </div>

                {/* Fan details */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fan</div>
                    <div className="text-sm font-bold text-white mt-0.5">{fan?.name?.split(" ")[0] ?? "Alex"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Section</div>
                    <div className="text-sm font-bold text-[#00BFFF] mt-0.5">{fan?.seatSection ?? "A"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Gate</div>
                    <div className="text-sm font-bold text-[#00FF88] mt-0.5">Gate 2</div>
                  </div>
                </div>

                {/* Barcode area */}
                <div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-center gap-1" style={{ height: 48 }}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/60 rounded-sm"
                      style={{ width: i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1, height: i % 7 === 0 ? 36 : i % 4 === 0 ? 28 : 20 }}
                    />
                  ))}
                </div>
                <div className="text-center text-[9px] text-gray-600 mt-1 tracking-[0.3em]">PL-2025-0001-{fanId.toString().padStart(4, "0")}</div>
              </div>

              {/* Ticket bottom strip */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00FF88, #00BFFF)" }} />
            </div>

            {/* Aura-Gate Check-in */}
            {!isCheckedIn ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <ScanFace className="h-3.5 w-3.5 text-[#00FF88]" />
                  Aura-Gate Check-in
                </div>
                <div
                  onClick={handleScan}
                  className="relative rounded-xl border-2 overflow-hidden cursor-pointer select-none transition-all"
                  style={{
                    borderColor: scanning ? "#00FF88" : scanDone === "fail" ? "#ff4d4d" : "rgba(255,255,255,0.15)",
                    background: "#050c1a",
                    aspectRatio: "16/9",
                  }}
                >
                  {/* Corner brackets */}
                  {["top-3 left-3 border-t-2 border-l-2", "top-3 right-3 border-t-2 border-r-2",
                    "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"].map(cls => (
                    <div key={cls} className={`absolute w-7 h-7 ${cls}`}
                         style={{ borderColor: scanning ? "#00FF88" : "#00BFFF" }} />
                  ))}

                  {/* Scan line */}
                  {scanning && (
                    <div className="absolute left-4 right-4 h-0.5 bg-[#00FF88] shadow-[0_0_12px_#00FF88]"
                         style={{ animation: "scanline 1.5s linear infinite" }} />
                  )}
                  <style>{`
                    @keyframes scanline {
                      0%   { top: 20%; opacity: 0 }
                      10%  { opacity: 1 }
                      90%  { opacity: 1 }
                      100% { top: 80%; opacity: 0 }
                    }
                  `}</style>

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {scanDone === "success" ? (
                      <>
                        <CheckCircle2 className="h-12 w-12 text-[#00FF88]" style={{ filter: "drop-shadow(0 0 12px #00FF88)" }} />
                        <div className="text-sm font-bold text-[#00FF88] uppercase tracking-widest">Access Granted</div>
                        <div className="text-xs text-gray-400">Welcome to Apex Arena!</div>
                      </>
                    ) : scanDone === "fail" ? (
                      <>
                        <AlertTriangle className="h-12 w-12 text-red-400" />
                        <div className="text-sm font-bold text-red-400 uppercase tracking-widest">Scan Failed</div>
                        <div className="text-xs text-gray-400">Tap to try again</div>
                      </>
                    ) : scanning ? (
                      <>
                        <ScanLine className="h-12 w-12 text-[#00FF88] animate-pulse" />
                        <div className="text-sm font-bold text-[#00FF88] uppercase tracking-widest animate-pulse">Scanning...</div>
                        <div className="text-xs text-gray-500">Hold still — biometric analysis in progress</div>
                      </>
                    ) : (
                      <>
                        <ScanFace className="h-12 w-12 text-gray-500 group-hover:text-[#00BFFF]" />
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tap to Scan Face</div>
                        <div className="text-xs text-gray-600">Aura-Gate biometric entry</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center">Powered by Aura-Gate · Facial recognition entry</div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/5 p-4 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-[#00FF88] shrink-0" />
                <div>
                  <div className="font-bold text-[#00FF88] text-sm">You're inside!</div>
                  <div className="text-xs text-gray-400 mt-0.5">Checked in via Aura-Gate · Gate 2 · {myCheckin ? new Date(myCheckin.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Earlier today"}</div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveTab("navigate")}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#00BFFF]/40 transition-colors text-left">
                <Navigation className="h-5 w-5 text-[#00BFFF]" />
                <div>
                  <div className="text-xs font-bold text-white">Navigate</div>
                  <div className="text-[10px] text-gray-500">Find your way</div>
                </div>
              </button>
              <button onClick={() => setActiveTab("deals")}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#00FF88]/40 transition-colors text-left">
                <Bell className="h-5 w-5 text-[#00FF88]" />
                <div>
                  <div className="text-xs font-bold text-white">Live Deals</div>
                  <div className="text-[10px] text-gray-500">{activeNotifications.length} active offers</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATE TAB */}
        {activeTab === "navigate" && (
          <div className="p-4 space-y-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">Where do you want to go?</div>

            {/* Destination picker */}
            <div className="grid grid-cols-3 gap-2">
              {DESTINATIONS.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => setDestination(dest.id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center"
                  style={{
                    borderColor: destination === dest.id ? "#00BFFF" : "rgba(255,255,255,0.1)",
                    background: destination === dest.id ? "rgba(0,191,255,0.1)" : "rgba(255,255,255,0.03)",
                    boxShadow: destination === dest.id ? "0 0 16px rgba(0,191,255,0.2)" : "none",
                  }}
                >
                  <span className="text-xl">{dest.emoji}</span>
                  <span className="text-[10px] text-gray-300 leading-tight">{dest.label}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Stadium Map */}
            <StadiumMap navPath={navPath} destination={destination} />

            {/* Route info bar */}
            {navPath && (
              <div className="rounded-xl border border-white/10 bg-[#050c1a] p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <Clock className="h-4 w-4 mx-auto mb-1" style={{ color: "#00BFFF" }} />
                  <div className="text-lg font-black text-white">{navPath.estimatedMinutes}m</div>
                  <div className="text-[10px] text-gray-500 uppercase">Est. Walk</div>
                </div>
                <div>
                  <Users className="h-4 w-4 mx-auto mb-1" style={{ color: congestionColor }} />
                  <div className="text-sm font-black capitalize" style={{ color: congestionColor }}>
                    {navPath.congestionLevel}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Crowd</div>
                </div>
                <div>
                  <Navigation className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <div className="text-sm font-black text-white">{navPath.recommendedPath.length - 1}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Waypoints</div>
                </div>
              </div>
            )}

            {/* Path steps */}
            {navPath?.recommendedPath && navPath.recommendedPath.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Turn-by-turn</div>
                <div className="space-y-1">
                  {navPath.recommendedPath.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                             style={{
                               background: i === 0 ? "#00BFFF" : i === navPath.recommendedPath.length - 1 ? "#00FF88" : "rgba(255,255,255,0.12)",
                               color: i === 0 || i === navPath.recommendedPath.length - 1 ? "#0a0f1e" : "rgba(255,255,255,0.7)",
                             }}>
                          {i + 1}
                        </div>
                        {i < navPath.recommendedPath.length - 1 && (
                          <div className="w-px flex-1 min-h-[16px] mt-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                        )}
                      </div>
                      <div className={`pb-3 text-sm leading-tight ${i === 0 ? "text-[#00BFFF] font-bold" : i === navPath.recommendedPath.length - 1 ? "text-[#00FF88] font-bold" : "text-gray-300"}`}>
                        {step}
                        {i === 0 && <span className="block text-[10px] text-gray-600 font-normal mt-0.5">Your current position</span>}
                        {i === navPath.recommendedPath.length - 1 && <span className="block text-[10px] text-[#00FF88]/60 font-normal mt-0.5">Destination</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discount offer if available */}
            {navPath?.discountOffer && (
              <div className="rounded-xl border border-[#00FF88]/40 bg-[#00FF88]/5 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00FF88] flex items-center justify-center font-black text-[#0a0f1e] shrink-0 text-sm">10%</div>
                <div>
                  <div className="text-sm font-bold text-[#00FF88]">Nearby Deal!</div>
                  <div className="text-xs text-gray-300 mt-0.5">{navPath.discountOffer}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEALS TAB */}
        {activeTab === "deals" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 uppercase tracking-widest">Live Offers</div>
              <div className="text-xs text-[#00FF88]">{activeNotifications.length} active</div>
            </div>

            {activeNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Bell className="h-10 w-10 text-gray-700" />
                <div>
                  <div className="text-gray-400 font-bold text-sm">No offers right now</div>
                  <div className="text-gray-600 text-xs mt-1">Check back soon — deals appear based on crowd density</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeNotifications.map((n) => (
                  <div key={n.id} className="rounded-xl border overflow-hidden transition-all"
                       style={{
                         borderColor: n.discountPercent ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.1)",
                         background: n.discountPercent ? "rgba(0,255,136,0.04)" : "rgba(255,255,255,0.02)",
                       }}>
                    <div className="p-4 flex items-start gap-3">
                      {n.discountPercent ? (
                        <div className="w-12 h-12 rounded-xl bg-[#00FF88] flex items-center justify-center font-black text-[#0a0f1e] text-lg shrink-0">
                          {n.discountPercent}%
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#00BFFF]/10 border border-[#00BFFF]/30 flex items-center justify-center shrink-0">
                          <Bell className="h-5 w-5 text-[#00BFFF]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white">{n.title}</div>
                        <div className="text-xs text-gray-400 mt-1 leading-relaxed">{n.message}</div>

                        {n.discountCode && (
                          <button
                            onClick={() => copyCode(n.discountCode!)}
                            className="mt-2.5 flex items-center gap-2 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 hover:border-[#00FF88]/40 transition-all group"
                          >
                            <span className="font-mono text-xs font-bold text-[#00FF88] tracking-widest">{n.discountCode}</span>
                            {copiedCode === n.discountCode ? (
                              <Check className="h-3 w-3 text-[#00FF88]" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-500 group-hover:text-[#00FF88]" />
                            )}
                            <span className="text-[10px] text-gray-500 ml-1">
                              {copiedCode === n.discountCode ? "Copied!" : "Tap to copy"}
                            </span>
                          </button>
                        )}
                      </div>
                      <button onClick={() => handleDismiss(n.id)}
                              className="text-gray-600 hover:text-gray-300 shrink-0 p-1 -mt-1 -mr-1 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {n.discountPercent && (
                      <button
                        onClick={() => setActiveTab("navigate")}
                        className="w-full border-t border-[#00FF88]/20 py-2.5 text-xs font-bold text-[#00FF88] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#00FF88]/5 transition-colors"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Navigate there
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* How deals work */}
            <div className="rounded-xl border border-white/10 bg-white/2 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">How smart deals work</div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Pulse-Link monitors real-time crowd density across all concession stands and zones. When a nearby spot has a shorter queue, we push you an exclusive discount to help you skip the crowd and save money.
              </div>
            </div>
          </div>
        )}

        {/* ASSISTANT TAB (preview, redirects to full page) */}
        {activeTab === "assistant" && (
          <div className="p-4 flex flex-col items-center justify-center gap-6 pt-12">
            <div className="w-20 h-20 rounded-2xl bg-[#00BFFF]/10 border border-[#00BFFF]/30 flex items-center justify-center"
                 style={{ boxShadow: "0 0 30px rgba(0,191,255,0.15)" }}>
              <Bot className="h-10 w-10 text-[#00BFFF]" />
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-white">Aura AI</div>
              <div className="text-sm text-gray-400 mt-1">Your personal stadium guide</div>
              <div className="text-xs text-gray-600 mt-3 max-w-xs leading-relaxed">
                Ask about shortest lines, best routes, available deals, or anything else about today's match.
              </div>
            </div>

            <div className="w-full max-w-sm space-y-2">
              {["Where is the shortest line for water?", "Which gate has the least crowd?", "Best route to Section B?"].map(q => (
                <Link key={q} href="/fan/assistant">
                  <button className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/3 hover:border-[#00BFFF]/40 transition-colors text-xs text-gray-300 hover:text-white flex items-center justify-between group">
                    {q}
                    <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-[#00BFFF]" />
                  </button>
                </Link>
              ))}
            </div>

            <Link href="/fan/assistant">
              <button className="mt-2 px-8 py-3 rounded-xl bg-[#00BFFF] text-[#0a0f1e] font-black uppercase tracking-widest text-sm hover:bg-[#00BFFF]/90 active:scale-95 transition-all"
                      style={{ boxShadow: "0 0 20px rgba(0,191,255,0.4)" }}>
                Open AI Guide
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0a0f1e]/95 backdrop-blur px-2 pb-safe">
        <div className="flex justify-around py-2">
          {([
            { id: "ticket", icon: Ticket, label: "Ticket" },
            { id: "navigate", icon: Navigation, label: "Navigate" },
            { id: "deals", icon: Bell, label: `Deals${activeNotifications.length > 0 ? ` (${activeNotifications.length})` : ""}` },
            { id: "assistant", icon: Bot, label: "AI Guide" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-1"
              style={{
                color: activeTab === id ? "#00BFFF" : "rgba(255,255,255,0.3)",
                background: activeTab === id ? "rgba(0,191,255,0.08)" : "transparent",
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] uppercase tracking-wide leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
