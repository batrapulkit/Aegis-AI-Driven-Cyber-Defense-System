import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BarChart3, TrendingUp, AlertTriangle, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ThreatData {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

interface SeverityData {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function ThreatAnalyticsChart() {
  const [severityData, setSeverityData] = useState<SeverityData>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from("scan_logs")
      .select("risk_score, verdict")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching analytics:", error);
      return;
    }

    const severity = { critical: 0, high: 0, medium: 0, low: 0 };
    
    data?.forEach((log) => {
      if (log.risk_score >= 80) severity.critical++;
      else if (log.risk_score >= 60) severity.high++;
      else if (log.risk_score >= 30) severity.medium++;
      else severity.low++;
    });

    setSeverityData(severity);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();

    const channel = supabase
      .channel("analytics-realtime")
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

  const chartData: ThreatData[] = [
    { name: "Critical", value: severityData.critical, color: "hsl(350, 100%, 60%)", icon: AlertTriangle },
    { name: "High", value: severityData.high, color: "hsl(25, 100%, 55%)", icon: Zap },
    { name: "Medium", value: severityData.medium, color: "hsl(45, 100%, 50%)", icon: TrendingUp },
    { name: "Low", value: severityData.low, color: "hsl(160, 100%, 50%)", icon: Shield },
  ];

  const total = Object.values(severityData).reduce((a, b) => a + b, 0);
  const threatRate = total > 0 ? (((severityData.critical + severityData.high) / total) * 100).toFixed(1) : "0";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-effect rounded-lg p-3 border border-border">
          <p className="font-bold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} threats ({total > 0 ? ((data.value / total) * 100).toFixed(1) : 0}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cyber-card-premium h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-neon-purple" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-wider">
            Threat Analytics
          </h2>
          <p className="text-xs text-muted-foreground">Last 100 scans by severity</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="h-64 flex items-center justify-center text-center">
          <div>
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No scan data yet</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {chartData.map((item) => {
              const Icon = item.icon;
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.value} ({percentage}%)</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Threat Rate Indicator */}
          <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">High-Risk Rate</span>
              <span className={cn(
                "text-sm font-bold",
                parseFloat(threatRate) > 30 ? "text-neon-red" : parseFloat(threatRate) > 15 ? "text-orange-400" : "text-neon-green"
              )}>
                {threatRate}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  parseFloat(threatRate) > 30 ? "bg-neon-red" : parseFloat(threatRate) > 15 ? "bg-orange-400" : "bg-neon-green"
                )}
                style={{ width: `${Math.min(parseFloat(threatRate), 100)}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}