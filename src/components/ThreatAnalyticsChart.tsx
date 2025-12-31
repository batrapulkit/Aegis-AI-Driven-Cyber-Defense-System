import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Radar as RadarIcon, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function ThreatAnalyticsChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    // Fetch last 200 logs to get a good distribution
    const { data: logs, error } = await supabase
      .from("scan_logs")
      .select("attack_category")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching analytics:", error);
      return;
    }

    // Default Categories
    const categories: Record<string, number> = {
      "Malware": 0,
      "Injection": 0,
      "Phishing": 0,
      "Jailbreak": 0,
      "Unknown": 0
    };

    logs?.forEach((log) => {
      // Normalize category names
      const cat = log.attack_category || "Unknown";
      if (cat.includes("Malware")) categories["Malware"]++;
      else if (cat.includes("Injection") || cat.includes("SQL") || cat.includes("XSS")) categories["Injection"]++;
      else if (cat.includes("Phishing") || cat.includes("Social")) categories["Phishing"]++;
      else if (cat.includes("Jailbreak") || cat.includes("Bypass")) categories["Jailbreak"]++;
      else categories["Unknown"]++;
    });

    // Transform for Radar Chart
    const radarData = Object.keys(categories).map(key => ({
      subject: key,
      A: categories[key],
      fullMark: logs?.length || 100
    }));

    setData(radarData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();

    const channel = supabase
      .channel("analytics-radar-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_logs" },
        () => fetchAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="cyber-card-premium h-full min-h-[300px] flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
          <RadarIcon className="w-5 h-5 text-neon-cyan" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-wider">
            Attack Surface
          </h2>
          <p className="text-xs text-muted-foreground">Vector Analysis (Last 200)</p>
        </div>
      </div>

      <div className="flex-1 w-full h-full min-h-[250px] relative">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1)_0%,transparent_70%)] pointer-events-none" />

        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />

            <Radar
              name="Threats"
              dataKey="A"
              stroke="#38bdf8"
              strokeWidth={2}
              fill="#38bdf8"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
              itemStyle={{ color: '#38bdf8' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Stats */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.slice(0, 4).map((item) => (
          <div key={item.subject} className="flex justify-between items-center text-xs px-2 py-1 rounded bg-white/5 border border-white/5">
            <span className="text-muted-foreground">{item.subject}</span>
            <span className="font-mono text-neon-cyan">{item.A}</span>
          </div>
        ))}
      </div>
    </div>
  );
}