import { Link } from "wouter";
import { Ticket, ShieldCheck, Zap, MapPin, Bell, Bot } from "lucide-react";
import { useEffect, useState } from "react";

const MATCH_INFO = {
  homeTeam: "City Thunderbolts",
  awayTeam: "River Hawks",
  date: "Today, April 15",
  time: "19:30",
  venue: "Apex Arena",
  gate: "Gate 2 — North East",
};

export default function HomePage() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const countdown = () => {
    const target = new Date();
    target.setHours(19, 30, 0, 0);
    const diff = target.getTime() - time.getTime();
    if (diff < 0) return "Match in progress";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0f1e] text-white font-mono flex flex-col items-center justify-between px-4 py-8 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 pointer-events-none"
           style={{ background: "radial-gradient(circle, #00BFFF 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full opacity-8 pointer-events-none"
           style={{ background: "radial-gradient(circle, #00FF88 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="w-full max-w-md text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-[#00BFFF]" />
          <span className="text-xs uppercase tracking-[0.3em] text-[#00BFFF]">Pulse-Link</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          Welcome to<br />
          <span className="text-[#00BFFF]">{MATCH_INFO.venue}</span>
        </h1>
        <div className="mt-3 text-sm text-gray-400">{MATCH_INFO.date}</div>
      </div>

      {/* Match card */}
      <div className="w-full max-w-md z-10 space-y-4">
        {/* Score / matchup */}
        <div className="border border-[#00BFFF]/30 rounded-xl bg-[#0d1526] p-5 text-center shadow-[0_0_30px_rgba(0,191,255,0.08)]">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Tonight's Match</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 text-center">
              <div className="text-2xl font-black text-[#00BFFF] leading-tight">
                {MATCH_INFO.homeTeam.split(" ")[0]}
              </div>
              <div className="text-xs text-gray-400 mt-1">{MATCH_INFO.homeTeam.split(" ").slice(1).join(" ")}</div>
            </div>
            <div className="text-2xl font-black text-gray-600 px-4">VS</div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-black text-[#00FF88] leading-tight">
                {MATCH_INFO.awayTeam.split(" ")[0]}
              </div>
              <div className="text-xs text-gray-400 mt-1">{MATCH_INFO.awayTeam.split(" ").slice(1).join(" ")}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 justify-center">
              <MapPin className="h-3.5 w-3.5 text-[#00BFFF]" />
              <span>Kick-off {MATCH_INFO.time}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00FF88]" />
              <span>{MATCH_INFO.gate}</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="border border-white/10 rounded-xl bg-[#0d1526]/60 p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Kick-off in</div>
          <div className="text-3xl font-black text-white tabular-nums tracking-wide">{countdown()}</div>
        </div>

        {/* Fan features preview */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: MapPin, label: "Navigate", color: "#00BFFF" },
            { icon: Bell, label: "Deals", color: "#00FF88" },
            { icon: Bot, label: "AI Guide", color: "#a78bfa" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="border border-white/10 rounded-lg p-3 bg-[#0d1526]/60 flex flex-col items-center gap-1.5">
              <Icon className="h-5 w-5" style={{ color }} />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-md z-10 space-y-3">
        <Link href="/fan">
          <button className="w-full py-4 rounded-xl bg-[#00BFFF] text-[#0a0f1e] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-[#00BFFF]/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,191,255,0.4)]">
            <Ticket className="h-5 w-5" />
            Enter with My Ticket
          </button>
        </Link>

        <div className="text-center">
          <Link href="/admin">
            <span className="text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer uppercase tracking-widest">
              Staff / Admin View
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
