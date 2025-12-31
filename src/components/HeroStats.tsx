import { Shield, AlertOctagon, Activity, TrendingUp, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface HeroStatsProps {
  totalScans: number;
  threatsBlocked: number;
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (value - startValue) * easeOutQuart);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export function HeroStats({ totalScans, threatsBlocked }: HeroStatsProps) {
  const safeScans = totalScans - threatsBlocked;
  const threatPercentage = totalScans > 0 ? ((threatsBlocked / totalScans) * 100).toFixed(1) : "0.0";
  const safePercentage = totalScans > 0 ? ((safeScans / totalScans) * 100).toFixed(1) : "100.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Scans */}
      <div className="cyber-card hover-lift group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-blue/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-background" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-blue pulse-blue" />
              <span className="text-xs font-medium text-neon-blue">LIVE</span>
            </div>
          </div>
          <p className="stat-label mb-1">Total Scans</p>
          <p className="stat-value text-neon-blue text-glow-blue">
            <AnimatedCounter value={totalScans} />
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
            <span>Real-time monitoring active</span>
          </div>
        </div>
      </div>

      {/* Threats Neutralized */}
      <div className="cyber-card hover-lift group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-red/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-red to-neon-orange flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-6 h-6 text-background" />
            </div>
            {threatsBlocked > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-red/10 border border-neon-red/30 animate-pulse">
                <Zap className="w-3 h-3 text-neon-red" />
                <span className="text-xs font-medium text-neon-red">ACTIVE</span>
              </div>
            )}
          </div>
          <p className="stat-label mb-1">Threats Neutralized</p>
          <p className="stat-value text-neon-red text-glow-red">
            <AnimatedCounter value={threatsBlocked} />
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-bold",
              parseFloat(threatPercentage) > 20 ? "bg-neon-red/20 text-neon-red" : "bg-neon-green/20 text-neon-green"
            )}>
              {threatPercentage}% threat rate
            </span>
          </div>
        </div>
      </div>

      {/* Safe Prompts */}
      <div className="cyber-card hover-lift group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-green/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-background" />
            </div>
            <span className="badge-success">{safePercentage}%</span>
          </div>
          <p className="stat-label mb-1">Safe Prompts</p>
          <p className="stat-value text-neon-green text-glow-green">
            <AnimatedCounter value={safeScans} />
          </p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-blue transition-all duration-700 ease-out"
              style={{ width: `${totalScans > 0 ? (safeScans / totalScans) * 100 : 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="cyber-card hover-lift group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-purple/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center group-hover:scale-110 transition-transform relative">
              <Lock className="w-6 h-6 text-background" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neon-green pulse-green" />
            </div>
          </div>
          <p className="stat-label mb-1">System Status</p>
          <p className={cn(
            "font-display font-bold text-2xl tracking-wide transition-colors duration-500",
            threatsBlocked > 10 ? "text-neon-red text-glow-red animate-pulse" : "text-neon-purple text-glow-purple"
          )}>
            {threatsBlocked > 10 ? "UNDER ATTACK" : "OPERATIONAL"}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">AI Latency</span>
              <span className="text-neon-green font-mono">~200ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-neon-green font-mono">99.9%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Model</span>
              <span className="text-neon-purple font-mono">Azure OpenAI GPT-4o</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}