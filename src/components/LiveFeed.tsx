import { useEffect, useState } from "react";
import { Shield, Siren, Clock, Radio, AlertTriangle, AlertCircle, Info, Target, Brain, Database, Fish } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ScanLog {
  id: string;
  created_at: string;
  prompt_text: string;
  verdict: string;
  risk_score: number;
  threat_type: string;
  attack_category: string;
}

type SeverityLevel = "Critical" | "High" | "Medium" | "Low";
type AttackCategory = "Prompt Injection" | "Jailbreak" | "Data Extraction" | "Phishing" | "None";

const getSeverityFromScore = (score: number): SeverityLevel => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
};

const severityConfig: Record<SeverityLevel, { color: string; bgColor: string; icon: typeof AlertTriangle }> = {
  Critical: { color: "text-red-500", bgColor: "bg-red-500/20", icon: Siren },
  High: { color: "text-orange-500", bgColor: "bg-orange-500/20", icon: AlertTriangle },
  Medium: { color: "text-yellow-500", bgColor: "bg-yellow-500/20", icon: AlertCircle },
  Low: { color: "text-neon-green", bgColor: "bg-neon-green/20", icon: Info },
};

const categoryConfig: Record<AttackCategory, { color: string; bgColor: string; borderColor: string; icon: typeof Target }> = {
  "Prompt Injection": { color: "text-neon-purple", bgColor: "bg-neon-purple/20", borderColor: "border-neon-purple/30", icon: Target },
  "Jailbreak": { color: "text-neon-orange", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/30", icon: Brain },
  "Data Extraction": { color: "text-neon-cyan", bgColor: "bg-cyan-500/20", borderColor: "border-cyan-500/30", icon: Database },
  "Phishing": { color: "text-pink-400", bgColor: "bg-pink-500/20", borderColor: "border-pink-500/30", icon: Fish },
  "None": { color: "text-muted-foreground", bgColor: "bg-muted/20", borderColor: "border-muted/30", icon: Info },
};

interface LiveFeedProps {
  refreshTrigger: number;
}

export function LiveFeed({ refreshTrigger }: LiveFeedProps) {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("scan_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching logs:", error);
      return;
    }

    setLogs(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("scan-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as ScanLog, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchLogs();
    }
  }, [refreshTrigger]);

  return (
    <div className="cyber-card h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
          <Radio className="w-5 h-5 text-neon-green animate-glow-pulse" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-wider">
            Live Feed
          </h2>
          <p className="text-xs text-muted-foreground">Last {logs.length} scans</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No scans yet</p>
            <p className="text-sm text-muted-foreground/60">Run your first scan above</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const severity = getSeverityFromScore(log.risk_score);
            const severityCfg = severityConfig[severity];
            const SeverityIcon = severityCfg.icon;
            
            const category = (log.attack_category as AttackCategory) || "None";
            const categoryCfg = categoryConfig[category] || categoryConfig["None"];
            const CategoryIcon = categoryCfg.icon;

            return (
              <div
                key={log.id}
                className={cn(
                  "p-4 rounded-xl border transition-all hover:scale-[1.01] hover-lift",
                  "animate-slide-up",
                  log.verdict === "SAFE"
                    ? "bg-neon-green/5 border-neon-green/30 hover:border-neon-green/60"
                    : "bg-neon-red/5 border-neon-red/30 hover:border-neon-red/60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      log.verdict === "SAFE"
                        ? "bg-gradient-to-br from-neon-green to-neon-cyan"
                        : "bg-gradient-to-br from-neon-red to-neon-orange"
                    )}
                  >
                    {log.verdict === "SAFE" ? (
                      <Shield className="w-5 h-5 text-background" />
                    ) : (
                      <Siren className="w-5 h-5 text-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          log.verdict === "SAFE" ? "text-neon-green" : "text-neon-red"
                        )}
                      >
                        {log.verdict}
                      </span>
                      
                      {/* Severity Badge */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1",
                          severityCfg.bgColor,
                          severityCfg.color
                        )}
                      >
                        <SeverityIcon className="w-3 h-3" />
                        {severity}
                      </span>
                      
                      {/* Risk Score */}
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-secondary text-muted-foreground">
                        {log.risk_score}%
                      </span>
                    </div>
                    
                    {/* Attack Category Badge */}
                    {category !== "None" && (
                      <div className="mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                            categoryCfg.bgColor,
                            categoryCfg.color,
                            categoryCfg.borderColor
                          )}
                        >
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {category}
                        </span>
                      </div>
                    )}
                    
                    {/* Threat Type */}
                    {log.threat_type && log.threat_type !== "None" && (
                      <p className="text-xs text-neon-red mb-1 font-medium">{log.threat_type}</p>
                    )}
                    
                    <p className="text-sm text-foreground/80 font-mono truncate">
                      {log.prompt_text}
                    </p>
                    
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), "HH:mm:ss")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}