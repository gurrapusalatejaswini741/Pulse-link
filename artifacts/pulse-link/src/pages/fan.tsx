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

            {/* Map */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-[#050c1a]">
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                {/* Grid background */}
                <div className="absolute inset-0 opacity-10"
                     style={{ backgroundImage: "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

                {/* Stadium outline */}
                <div className="absolute inset-6 rounded-full border border-white/10 opacity-30" />
                <div className="absolute inset-10 rounded-full border border-white/5 opacity-20" />

                {/* Field */}
                <div className="absolute inset-14 rounded-sm border border-[#00FF88]/20 opacity-40" />

                {/* You marker */}
                <div className="absolute bottom-12 left-8 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-[#00BFFF] shadow-[0_0_14px_#00BFFF] border-2 border-white relative z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-[9px] text-[#00BFFF] font-black mt-1 uppercase">You</span>
                </div>

                {/* Destination marker */}
                <div className="absolute top-8 right-10 flex flex-col items-center">
                  <MapPin className="h-5 w-5 text-[#00FF88]" style={{ filter: "drop-shadow(0 0 6px #00FF88)" }} />
                  <span className="text-[9px] text-[#00FF88] font-black mt-0.5 uppercase">Dest</span>
                </div>

                {/* Route SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00BFFF" />
                      <stop offset="100%" stopColor="#00FF88" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 52 155 C 52 120, 100 110, 130 90 L 180 70 C 220 55, 270 45, 296 35"
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth="2.5"
                    strokeDasharray="8 5"
                    style={{ filter: "drop-shadow(0 0 4px #00BFFF)" }}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="2s" repeatCount="indefinite" />
                  </path>

                  {/* Waypoint dots */}
                  {[[130, 90], [180, 70]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#00BFFF" opacity="0.6">
                      <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
                    </circle>
                  ))}
                </svg>

                {/* Congestion overlays */}
                {navPath?.congestionLevel === "high" && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded px-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-red-400 uppercase">High Traffic</span>
                  </div>
                )}
              </div>

              {/* Route info bar */}
              {navPath && (
                <div className="border-t border-white/10 p-4 grid grid-cols-3 gap-4 text-center">
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
            </div>

            {/* Path steps */}
            {navPath?.recommendedPath && navPath.recommendedPath.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Recommended Route</div>
                <div className="space-y-2">
                  {navPath.recommendedPath.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                             style={{
                               background: i === 0 ? "#00BFFF" : i === navPath.recommendedPath.length - 1 ? "#00FF88" : "rgba(255,255,255,0.1)",
                               color: i === 0 || i === navPath.recommendedPath.length - 1 ? "#0a0f1e" : "white",
                             }}>
                          {i + 1}
                        </div>
                        {i < navPath.recommendedPath.length - 1 && (
                          <div className="w-px h-4 bg-white/10 mt-1" />
                        )}
                      </div>
                      <div className={`text-sm ${i === 0 ? "text-[#00BFFF] font-bold" : i === navPath.recommendedPath.length - 1 ? "text-[#00FF88] font-bold" : "text-gray-300"}`}>
                        {step}
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
