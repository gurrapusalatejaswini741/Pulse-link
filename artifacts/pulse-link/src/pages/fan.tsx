import { useState } from "react";
import { Link } from "wouter";
import { 
  ScanFace, Map as MapIcon, Bell, Navigation, 
  MessageSquare, ChevronRight, X, ScanLine
} from "lucide-react";
import { 
  useListNotifications, 
  useDismissNotification, 
  useGetFanNavigation,
  useCreateCheckin,
  useGetFan
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FanInterface() {
  const fanId = 1; // Simulated logged-in fan
  const [destination, setDestination] = useState<string>("North Concessions");
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<boolean | null>(null);

  const { data: fan } = useGetFan(fanId, { query: { enabled: true } });
  const { data: notifications = [], refetch: refetchNotifications } = useListNotifications({ query: { refetchInterval: 5000 } });
  const dismissNotification = useDismissNotification();
  const createCheckin = useCreateCheckin();

  const { data: navPath } = useGetFanNavigation(fanId, { 
    query: { enabled: true },
    params: { destination }
  });

  const handleDismiss = (id: number) => {
    dismissNotification.mutate(
      { id },
      { onSuccess: () => refetchNotifications() }
    );
  };

  const handleScan = () => {
    setScanning(true);
    setScanSuccess(null);
    
    // Simulate biometric processing time
    setTimeout(() => {
      createCheckin.mutate(
        { data: { fanId, gateId: 1, verificationMethod: "biometric" } },
        { 
          onSuccess: () => {
            setScanning(false);
            setScanSuccess(true);
          },
          onError: () => {
            setScanning(false);
            setScanSuccess(false);
          }
        }
      );
    }, 2000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-[#0a0f1e] text-foreground font-mono pb-20">
      <header className="px-4 py-4 border-b border-border/30 bg-card/80 backdrop-blur sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg text-primary uppercase tracking-widest">Pulse-Link</h1>
          <p className="text-xs text-muted-foreground">Attendee Access</p>
        </div>
        {fan && (
          <div className="text-right">
            <p className="text-sm font-bold">{fan.name}</p>
            <p className="text-xs text-secondary">{fan.seatSection}</p>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Nudges / Notifications */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm mb-2">
            <Bell className="h-4 w-4" /> Smart Nudges
          </div>
          
          {notifications.filter(n => !n.dismissed).length === 0 ? (
            <div className="text-xs text-muted-foreground text-center p-4 border border-dashed border-border/50 rounded">
              No active offers.
            </div>
          ) : (
            notifications.filter(n => !n.dismissed).map(n => (
              <Card key={n.id} className="bg-primary/10 border-primary/30 relative overflow-hidden">
                <CardContent className="p-4 flex items-start gap-3">
                  {n.discountPercent ? (
                    <div className="bg-primary text-primary-foreground p-2 rounded font-bold text-lg flex items-center justify-center">
                      {n.discountPercent}%
                    </div>
                  ) : (
                    <div className="bg-secondary/20 p-2 rounded text-secondary">
                      <Bell className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    {n.discountCode && (
                      <Badge variant="outline" className="mt-2 border-primary text-primary font-mono text-[10px]">
                        CODE: {n.discountCode}
                      </Badge>
                    )}
                  </div>
                  <button onClick={() => handleDismiss(n.id)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* Aura-Gate Scanner */}
        {!fan?.checkedIn && (
          <section className="space-y-3">
             <div className="flex items-center gap-2 text-secondary font-bold uppercase tracking-wider text-sm mb-2">
              <ScanFace className="h-4 w-4" /> Aura-Gate Check-in
            </div>
            <Card className="bg-card border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-black flex items-center justify-center group cursor-pointer" onClick={handleScan}>
                  {/* Scanner UI overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-secondary/30"></div>
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-secondary"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-secondary"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-secondary"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-secondary"></div>
                  
                  {scanning ? (
                    <div className="flex flex-col items-center">
                      <ScanLine className="h-12 w-12 text-secondary animate-bounce" />
                      <p className="text-secondary font-bold mt-4 uppercase tracking-widest text-xs animate-pulse">Scanning Biometrics...</p>
                    </div>
                  ) : scanSuccess === true ? (
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center text-secondary border border-secondary mb-4">
                        <ScanFace className="h-8 w-8" />
                      </div>
                      <p className="text-secondary font-bold uppercase tracking-widest text-sm">Access Granted</p>
                    </div>
                  ) : scanSuccess === false ? (
                     <div className="flex flex-col items-center text-destructive">
                      <AlertTriangle className="h-12 w-12 mb-4" />
                      <p className="font-bold uppercase tracking-widest text-sm">Scan Failed</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <ScanFace className="h-12 w-12 text-muted-foreground group-hover:text-secondary mb-4" />
                      <p className="text-muted-foreground group-hover:text-secondary font-bold uppercase tracking-widest text-xs">Tap to Scan</p>
                    </div>
                  )}

                  {/* Scan line animation */}
                  {scanning && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-secondary shadow-[0_0_10px_#00FF88] animate-[pulse_1s_infinite]" style={{ animation: 'scan 2s linear infinite' }}></div>
                  )}
                  <style>{`
                    @keyframes scan {
                      0% { top: 0%; opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                      100% { top: 100%; opacity: 0; }
                    }
                  `}</style>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Dynamic Route Map */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
              <Navigation className="h-4 w-4" /> Optimal Route
            </div>
            <select 
              className="bg-card border border-border text-xs py-1 px-2 rounded text-foreground outline-none"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="North Concessions">North Concessions</option>
              <option value="South Concessions">South Concessions</option>
              <option value="Section A">Section A Seating</option>
              <option value="Restrooms">Main Restrooms</option>
            </select>
          </div>
          
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-[#050810] overflow-hidden border-b border-border/30">
                {/* Abstract simplified map */}
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Current Location */}
                <div className="absolute bottom-10 left-10 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_#00BFFF] relative z-10"></div>
                  <span className="text-[9px] text-primary mt-1 font-bold">YOU</span>
                </div>

                {/* Destination */}
                <div className="absolute top-10 right-10 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-secondary shadow-[0_0_10px_#00FF88] relative z-10"></div>
                  <span className="text-[9px] text-secondary mt-1 font-bold">DEST</span>
                </div>

                {/* Route Line (Simulated SVG Path) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 4px #00BFFF)' }}>
                  <path 
                    d="M 48 150 C 48 100, 150 120, 150 70 L 250 70 C 280 70, 300 60, 312 48" 
                    fill="none" 
                    stroke="var(--color-primary)" 
                    strokeWidth="3" 
                    strokeDasharray="6 6"
                    className="animate-[dash_20s_linear_infinite]"
                  />
                  <style>{`
                    @keyframes dash {
                      to { stroke-dashoffset: -1000; }
                    }
                  `}</style>
                </svg>
              </div>
              
              {navPath && (
                <div className="p-4 flex items-center justify-between bg-card/50">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Est. Time</p>
                    <p className="text-xl font-bold text-foreground">{navPath.estimatedMinutes} MIN</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">Congestion</p>
                    <p className={`font-bold uppercase ${
                      navPath.congestionLevel === 'low' ? 'text-secondary' : 
                      navPath.congestionLevel === 'high' ? 'text-destructive' : 'text-yellow-500'
                    }`}>
                      {navPath.congestionLevel}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

      </main>

      {/* Floating Action Button for Assistant */}
      <Link href="/fan/assistant" className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_0_20px_rgba(0,191,255,0.4)] flex items-center justify-center hover:scale-105 transition-transform z-30">
        <MessageSquare className="h-6 w-6" />
      </Link>
    </div>
  );
}