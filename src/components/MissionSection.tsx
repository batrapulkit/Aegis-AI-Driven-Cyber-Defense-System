import { Shield, Zap, Brain, Lock, Eye, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description: "Advanced LLM analyzes intent, not just keywords",
    color: "neon-purple",
  },
  {
    icon: Eye,
    title: "Zero-Trust Analysis",
    description: "Every prompt treated as potentially malicious",
    color: "neon-blue",
  },
  {
    icon: Lock,
    title: "Real-Time Blocking",
    description: "Threats neutralized before they reach your systems",
    color: "neon-green",
  },
  {
    icon: Target,
    title: "Context-Aware",
    description: "Detects hidden attacks in stories and roleplay",
    color: "neon-orange",
  },
];

export function MissionSection() {
  return (
    <div className="cyber-card-premium relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center">
              <Shield className="w-7 h-7 text-background" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-green pulse-green" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-gradient-primary uppercase tracking-wider">
              About Aegis
            </h2>
            <p className="text-sm text-muted-foreground">Next-Gen AI Security Layer</p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-foreground/90 leading-relaxed">
            <span className="text-primary font-bold">Aegis</span> is a <span className="text-neon-blue font-semibold">Zero-Trust Security Sentinel</span> that 
            protects AI systems from prompt injection attacks, jailbreaks, and malicious intent—even when 
            hidden inside seemingly innocent requests.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm text-neon-red uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            The Problem
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Traditional security filters use keyword matching—easily bypassed by attackers using stories, 
            hypotheticals, or social engineering. <span className="text-foreground font-medium">87% of AI systems</span> are 
            vulnerable to prompt injection attacks.
          </p>
        </div>

        {/* Solution */}
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm text-neon-green uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Our Solution
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aegis uses <span className="text-neon-purple font-medium">AI to detect malicious INTENT</span>, not just keywords. 
            Our paranoid analysis catches threats that traditional methods miss, 
            providing <span className="text-neon-green font-medium">real-time protection</span> with severity scoring.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={cn(
                  "p-3 rounded-lg bg-secondary/50 border border-border/50",
                  "hover:border-primary/50 hover:bg-secondary transition-all duration-300",
                  "group cursor-default"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg mb-2 flex items-center justify-center",
                  `bg-${feature.color}/20 group-hover:bg-${feature.color}/30 transition-colors`
                )}>
                  <Icon className={cn("w-4 h-4", `text-${feature.color}`)} />
                </div>
                <h4 className="font-bold text-xs text-foreground mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-tight">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Tech Stack Badge */}
        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <span className="badge-info">Gemini AI</span>
          <span className="badge-success">Real-Time</span>
          <span className="badge-warning">Zero-Trust</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
            Edge Functions
          </span>
        </div>
      </div>
    </div>
  );
}