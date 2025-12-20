import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Target, Brain, Database, Fish } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ThreatLog {
  id: string;
  prompt_text: string;
  verdict: string;
  risk_score: number;
  threat_type: string;
  attack_category: string;
  created_at: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Prompt Injection": return Target;
    case "Jailbreak": return Brain;
    case "Data Extraction": return Database;
    case "Phishing": return Fish;
    default: return AlertTriangle;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Prompt Injection": return "text-red-500";
    case "Jailbreak": return "text-purple-500";
    case "Data Extraction": return "text-orange-500";
    case "Phishing": return "text-yellow-500";
    default: return "text-muted-foreground";
  }
};

export function ThreatsSection() {
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreats = async () => {
      const { data } = await supabase
        .from("scan_logs")
        .select("*")
        .eq("verdict", "BLOCKED")
        .order("created_at", { ascending: false })
        .limit(20);
      
      setThreats(data || []);
      setLoading(false);
    };

    fetchThreats();

    const channel = supabase
      .channel("threats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_logs" },
        (payload) => {
          if (payload.new.verdict === "BLOCKED") {
            setThreats((prev) => [payload.new as ThreatLog, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-8 bg-gradient-to-b from-destructive to-orange-500 rounded-full" />
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
            Blocked <span className="text-destructive">Threats</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm ml-5">
          All intercepted malicious prompts and attack attempts
        </p>
      </header>

      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading threats...</div>
        ) : threats.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">No threats detected yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threats.map((threat) => {
              const CategoryIcon = getCategoryIcon(threat.attack_category);
              return (
                <div
                  key={threat.id}
                  className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <CategoryIcon className={`w-5 h-5 mt-0.5 ${getCategoryColor(threat.attack_category)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-mono truncate">
                          {threat.prompt_text}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className={`px-2 py-0.5 rounded ${getCategoryColor(threat.attack_category)} bg-background/50`}>
                            {threat.attack_category}
                          </span>
                          <span>Risk: {threat.risk_score}%</span>
                          <span>{new Date(threat.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-destructive/20 text-destructive rounded">
                      BLOCKED
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
