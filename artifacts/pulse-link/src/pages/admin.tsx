import { Activity, AlertTriangle, RefreshCw, Users, Map as MapIcon, Zap, Database } from "lucide-react";
import { 
  useGetCrowdState, 
  useSimulateHalftime, 
  useResetCrowd, 
  useGetBottlenecks,
  useGetCrowdStats,
  useListZones,
  useGetZone,
  useListVenues,
  useListFans,
  useListCheckins,
  useCreateFan,
  useCreateNotification,
  useDeleteGeminiConversation,
  useListGeminiConversations
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: crowdState, isLoading: isLoadingState } = useGetCrowdState({ query: { refetchInterval: 3000 } });
  const { data: bottlenecks = [] } = useGetBottlenecks({ query: { refetchInterval: 3000 } });
  const { data: stats } = useGetCrowdStats({ query: { refetchInterval: 3000 } });
  const { data: zones } = useListZones();
  const { data: venues } = useListVenues();
  const { data: fans } = useListFans();
  const { data: checkins } = useListCheckins();
  const { data: conversations } = useListGeminiConversations();
  
  const simulateHalftime = useSimulateHalftime();
  const resetCrowd = useResetCrowd();
  const createFan = useCreateFan();
  const createNotification = useCreateNotification();
  const deleteConversation = useDeleteGeminiConversation();

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  const { data: selectedZone } = useGetZone(selectedZoneId || 0, { 
    query: { enabled: !!selectedZoneId } 
  });

  const getDensityColor = (density: number) => {
    if (density < 0.4) return "bg-secondary/20 border-secondary text-secondary-foreground"; // Green
    if (density < 0.7) return "bg-yellow-500/20 border-yellow-500 text-yellow-500"; // Yellow
    if (density < 0.9) return "bg-orange-500/20 border-orange-500 text-orange-500"; // Orange
    return "bg-destructive/20 border-destructive text-destructive bottleneck-critical"; // Red
  };

  const getGridCells = () => {
    const cells = Array(48).fill(null); // 6x8 grid
    if (!crowdState) return cells;

    crowdState.zones.forEach(zone => {
      const index = (zone.gridRow * 8) + zone.gridCol;
      if (index >= 0 && index < 48) {
        cells[index] = zone;
      }
    });

    return cells;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col w-full text-foreground bg-background font-mono">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Activity className="text-primary h-6 w-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-widest uppercase">Pulse-Link<span className="text-primary">::COMMAND</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowSystemInfo(true)}>
            <Database className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Link href="/fan" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Fan UI
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => resetCrowd.mutate()}
            disabled={resetCrowd.isPending}
            className="border-muted hover:border-primary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${resetCrowd.isPending ? "animate-spin" : ""}`} />
            RESET
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => simulateHalftime.mutate()}
            disabled={simulateHalftime.isPending}
            className="font-bold tracking-wide"
          >
            <Zap className="h-4 w-4 mr-2" />
            SIMULATE HALFTIME
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Fans</p>
                    <p className="text-3xl font-bold text-primary">{stats?.totalFans || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Density</p>
                    <p className="text-3xl font-bold text-secondary">{((stats?.averageDensity || 0) * 100).toFixed(1)}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-secondary/40" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-destructive/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-destructive uppercase tracking-wider mb-1">Bottlenecks</p>
                    <p className="text-3xl font-bold text-destructive">{stats?.activeBottlenecks || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive/40" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hottest Zone</p>
                    <p className="text-lg font-bold text-orange-500 truncate max-w-[120px]">{stats?.maxDensityZone || 'None'}</p>
                  </div>
                  <MapIcon className="h-8 w-8 text-orange-500/40" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Heat Map Grid */}
          <Card className="bg-card/40 border-border/50 flex-1 flex flex-col min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                Live Tactical Map
              </CardTitle>
              <CardDescription>Real-time stadium zone density</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center pb-6">
              {isLoadingState ? (
                <div className="flex-1 flex items-center justify-center">
                  <Activity className="h-12 w-12 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2 w-full max-w-4xl mx-auto aspect-[4/3]">
                  {getGridCells().map((zone, i) => (
                    <div 
                      key={i}
                      onClick={() => zone && setSelectedZoneId(zone.id)}
                      className={`
                        heat-map-cell border border-border/20 rounded relative cursor-pointer overflow-hidden
                        ${zone ? getDensityColor(zone.density) : 'bg-muted/10'}
                        hover:brightness-125
                      `}
                    >
                      {zone && (
                        <div className="absolute inset-0 p-2 flex flex-col justify-between">
                          <span className="text-[10px] font-bold opacity-80 uppercase truncate">{zone.name}</span>
                          <span className="text-xs font-bold text-right">
                            {Math.round(zone.density * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Alerts */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/50 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-3">
                {bottlenecks.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-border/50 rounded text-muted-foreground text-sm">
                    No active alerts. Sector clear.
                  </div>
                ) : (
                  bottlenecks.map(b => (
                    <div key={b.id} className={`p-4 border rounded relative overflow-hidden ${
                      b.severity === 'critical' ? 'border-destructive bg-destructive/10 bottleneck-critical' : 
                      b.severity === 'high' ? 'border-orange-500 bg-orange-500/10' :
                      'border-yellow-500 bg-yellow-500/10'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm uppercase">{b.zoneName}</h4>
                        <Badge variant="outline" className={
                          b.severity === 'critical' ? 'border-destructive text-destructive' : 
                          b.severity === 'high' ? 'border-orange-500 text-orange-500' :
                          'border-yellow-500 text-yellow-500'
                        }>
                          {b.severity}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs opacity-70">
                          {new Date(b.detectedAt).toLocaleTimeString()}
                        </span>
                        <span className="text-lg font-bold">
                          {Math.round(b.density * 100)}% cap
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!selectedZoneId} onOpenChange={(open) => !open && setSelectedZoneId(null)}>
        <DialogContent className="border-border bg-card font-mono text-foreground sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest text-primary flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              {selectedZone?.name || 'Loading...'}
            </DialogTitle>
            <DialogDescription className="font-mono text-muted-foreground">
              Sector Detailed Analysis
            </DialogDescription>
          </DialogHeader>
          {selectedZone && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border/50 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Type</p>
                  <p className="font-bold uppercase text-primary">{selectedZone.type}</p>
                </div>
                <div className="p-4 border border-border/50 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Density</p>
                  <p className={`font-bold ${selectedZone.density > 0.8 ? 'text-destructive' : 'text-secondary'}`}>
                    {Math.round(selectedZone.density * 100)}%
                  </p>
                </div>
                <div className="p-4 border border-border/50 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Current Count</p>
                  <p className="font-bold">{selectedZone.currentCount}</p>
                </div>
                <div className="p-4 border border-border/50 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Capacity</p>
                  <p className="font-bold">{selectedZone.capacity}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">0%</span>
                  <span className="text-muted-foreground text-right">100%</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded overflow-hidden">
                  <div 
                    className={`h-full ${
                      selectedZone.density > 0.8 ? 'bg-destructive' : 
                      selectedZone.density > 0.6 ? 'bg-orange-500' : 'bg-secondary'
                    }`}
                    style={{ width: `${Math.min(selectedZone.density * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSystemInfo} onOpenChange={setShowSystemInfo}>
        <DialogContent className="border-border bg-card font-mono text-foreground sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest text-primary flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Diagnostics
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm">
            <div className="p-4 border border-border/50 rounded bg-background/50">
              <p className="text-xs text-muted-foreground uppercase mb-2 border-b border-border/50 pb-2">Active Venues</p>
              <div className="flex gap-2 flex-wrap">
                {venues?.map(v => <Badge key={v.id} variant="secondary">{v.name}</Badge>) || "None"}
              </div>
            </div>
            <div className="p-4 border border-border/50 rounded bg-background/50">
              <p className="text-xs text-muted-foreground uppercase mb-2 border-b border-border/50 pb-2">System Zones Count</p>
              <p className="font-bold">{zones?.length || 0}</p>
            </div>
            <div className="p-4 border border-border/50 rounded bg-background/50">
              <p className="text-xs text-muted-foreground uppercase mb-2 border-b border-border/50 pb-2">Registered Fans</p>
              <p className="font-bold">{fans?.length || 0}</p>
            </div>
            <div className="p-4 border border-border/50 rounded bg-background/50">
              <p className="text-xs text-muted-foreground uppercase mb-2 border-b border-border/50 pb-2">Gate Check-ins</p>
              <p className="font-bold">{checkins?.length || 0}</p>
            </div>
            <div className="p-4 border border-border/50 rounded bg-background/50">
              <p className="text-xs text-muted-foreground uppercase mb-2 border-b border-border/50 pb-2">AI Subsystems</p>
              <p className="font-bold">{conversations?.length || 0} active threads</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}