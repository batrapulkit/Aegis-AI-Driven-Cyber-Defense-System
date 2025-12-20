import { useEffect, useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface ScanLog {
  id: string;
  verdict: string;
  created_at: string;
}

interface ThreatPoint {
  id: string;
  x: number;
  y: number;
  type: 'attack' | 'defense';
  delay: number;
  timestamp: string;
}

// Simple deterministic hash to get 0-100 coordinates from a string ID
const getCoordinate = (id: string, salt: number) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const result = Math.abs((hash + salt) % 100);

  // Constrain to "map-ish" area (avoid borders)
  return 10 + (result * 0.8);
};

export const GlobalThreatMap = ({ scanningTrigger = 0 }: { scanningTrigger?: number }) => {
  const [threats, setThreats] = useState<ThreatPoint[]>([]);
  const [isscanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (scanningTrigger > 0) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanningTrigger]);

  const fetchThreats = async () => {
    const { data } = await supabase
      .from("scan_logs")
      .select("id, verdict, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const mappedThreats: ThreatPoint[] = data.map((log) => ({
        id: log.id,
        x: getCoordinate(log.id, 1234),
        y: getCoordinate(log.id, 5678) % 60 + 20,
        type: log.verdict === 'BLOCKED' ? 'attack' : 'defense',
        delay: Math.random() * 2,
        timestamp: log.created_at
      }));
      setThreats(mappedThreats);
    }
  };

  useEffect(() => {
    fetchThreats();

    // Subscribe to new attacks in real-time
    const channel = supabase
      .channel("map-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_logs" },
        (payload) => {
          const log = payload.new as ScanLog;
          const newThreat: ThreatPoint = {
            id: log.id,
            x: getCoordinate(log.id, 1234),
            y: getCoordinate(log.id, 5678) % 60 + 20,
            type: log.verdict === 'BLOCKED' ? 'attack' : 'defense',
            delay: 0,
            timestamp: log.created_at
          };

          setThreats(prev => [newThreat, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeAttacks = threats.filter(t => t.type === 'attack').length;
  const activeDefenses = threats.filter(t => t.type === 'defense').length;

  return (
    <div className="cyber-card relative overflow-hidden h-[250px] w-full bg-[#0a0f1d]">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-display font-bold text-gradient-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Global Threat Intelligence
        </h3>
        <p className="text-xs text-muted-foreground ml-4">Live Satellite Uplink • {threats.length} Active Nodes</p>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,100,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* World Map Silhouette (SVG) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <svg viewBox="0 0 1000 500" className="w-full h-full text-neon-cyan fill-current">
          <path d="M225.5,335.5 c-3.5-3.5-8-1-8,4 c0,8-9,16-5,24 c8,16,2,30-2,44 c-2,6,1,11,7,12 c11,2,25-5,30-14 c9-15,6-33,12-50 c3-9-1-20-4-28 C248.5,312.5,233.5,343.5,225.5,335.5 z M825.5,135.5 c-3-3-8-1-8,4 c0,5,3,10,2,15 c-2,8-9,13-17,16 c-6,2-11,8-9,14 c2,8,12,12,19,10 c14-4,24-17,28-31 C843.5,152.5,833.5,142.5,825.5,135.5 z M450.5,150.5 c-6,3-3,12,3,14 c5,2,11-2,13-7 C468.5,148.5,459.5,146.5,450.5,150.5 z M150.5,150.5 c2,5,8,4,11-1 c4-6-2-13-8-12 C146.5,138.5,147.5,143.5,150.5,150.5 z" />
          <rect x="0" y="0" width="1000" height="500" fill="transparent" />
        </svg>
      </div>

      {/* Radar Scan Overlay */}
      {isscanning && (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <div className="w-[800px] h-[800px] rounded-full border border-neon-green/30 animate-ping absolute" />
          <div className="w-[600px] h-[600px] rounded-full border border-neon-cyan/20 animate-ping delay-75 absolute" />
          <div
            className="w-[1000px] h-[1000px] bg-gradient-to-r from-transparent via-neon-green/10 to-transparent animate-spin absolute"
            style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}
          />
        </div>
      )}

      {/* Render Threat Points */}
      {threats.map((threat, i) => (
        <div
          key={threat.id}
          className="absolute transition-all duration-500 ease-out"
          style={{
            left: `${threat.x}%`,
            top: `${threat.y}%`,
            animation: `float 3s infinite ease-in-out ${threat.delay}s`,
          }}
        >
          <div className="relative group">
            {/* Pulse effect */}
            <div
              className={`absolute -inset-4 rounded-full opacity-20 animate-ping ${threat.type === 'attack' ? 'bg-neon-red' : 'bg-neon-green'
                }`}
            />

            {/* Icon */}
            <div
              className={`relative z-10 w-3 h-3 rounded-full flex items-center justify-center border shadow-[0_0_10px_rgba(0,0,0,0.5)] ${threat.type === 'attack'
                ? 'bg-background border-neon-red text-neon-red'
                : 'bg-background border-neon-green text-neon-green'
                }`}
            >
              {threat.type === 'attack' ? (
                <AlertCircle size={8} />
              ) : (
                <Shield size={8} />
              )}
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 border border-border px-2 py-1 rounded text-[10px] whitespace-nowrap z-20">
              <span className={threat.type === 'attack' ? "text-red-400" : "text-green-400"}>
                {threat.type === 'attack' ? "NET.ATTACK" : "SYS.DEFENSE"}
              </span>
              <span className="text-muted-foreground ml-2">
                ID: {threat.id.slice(0, 8)}
              </span>
            </div>

            {/* Connection lines to nearby points (simulated connections for visual density) */}
            {i % 4 === 0 && (
              <svg className="absolute top-3 left-3 w-32 h-32 pointer-events-none opacity-20 overflow-visible">
                <line x1="0" y1="0" x2={Math.random() * 50 - 25} y2={Math.random() * 50 - 25} stroke="currentColor" className={threat.type === 'attack' ? "text-neon-red" : "text-neon-green"} strokeWidth="1" />
              </svg>
            )}
          </div>
        </div>
      ))}

      {/* Footer Status */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4 flex justify-between items-end">
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-red" />
            <span className="text-neon-red/80">INTERCEPTED: {activeAttacks}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
            <span className="text-neon-green/80">SECURED: {activeDefenses}</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          LIVE DATA FEED
        </div>
      </div>
    </div>
  );
};
