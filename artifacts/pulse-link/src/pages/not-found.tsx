import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground font-mono p-6">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="h-24 w-24 rounded-full bg-destructive/20 flex items-center justify-center mb-4 border border-destructive/50">
          <AlertTriangle className="h-12 w-12 text-destructive animate-pulse" />
        </div>
        
        <h1 className="text-4xl font-bold uppercase tracking-widest text-primary">
          404 <span className="text-muted-foreground">::</span> NO SIGNAL
        </h1>
        
        <p className="text-muted-foreground leading-relaxed">
          The requested sector is offline or does not exist. Command center cannot establish a connection to this endpoint.
        </p>
        
        <div className="flex items-center gap-4 mt-8">
          <Link href="/">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 uppercase tracking-widest">
              <Home className="h-4 w-4 mr-2" />
              Return to Command
            </Button>
          </Link>
        </div>
        
        <div className="w-full h-px bg-border/50 mt-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground uppercase tracking-widest">
            End of Line
          </div>
        </div>
      </div>
    </div>
  );
}