import { useState, useEffect } from "react";
import { Send, Shield, Siren, Loader2, Terminal, Sparkles, AlertTriangle, Zap, Target, Brain, Database, Fish } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AnalysisResult {
  verdict: "SAFE" | "BLOCKED";
  riskScore: number;
  threatType: string;
  attackCategory: string;
  prompt: string;
}

type AttackCategory = "Prompt Injection" | "Jailbreak" | "Data Extraction" | "Phishing" | "None";

type SeverityLevel = "Critical" | "High" | "Medium" | "Low";

const getSeverityFromScore = (score: number): SeverityLevel => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
};

interface LiveInterceptConsoleProps {
  onScanComplete: () => void;
  autoRunTrigger?: number; // New prop to trigger auto-scan
}

export function LiveInterceptConsole({ onScanComplete, autoRunTrigger = 0 }: LiveInterceptConsoleProps) {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Changed from isScanning
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const { playAlert } = useSoundEffects();

  // Handle voice command auto-run
  useEffect(() => {
    if (autoRunTrigger > 0) {
      const demoPrompt = "Initiate Level 5 Deep Packet Inspection and heuristic threat analysis on gateway nodes.";
      setPrompt(demoPrompt);
      handleAnalyze(demoPrompt);
    }
  }, [autoRunTrigger]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAnalyzing) return;
    handleAnalyze(prompt);
  };

  const handleAnalyze = async (textToAnalyze?: string) => {
    const analysisText = textToAnalyze || prompt;
    if (!analysisText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: { prompt: analysisText },
      });

      if (error) throw error;

      setResult({
        verdict: data.verdict,
        riskScore: data.riskScore,
        threatType: data.threatType,
        attackCategory: data.attackCategory || "None",
        prompt: data.prompt,
      });

      onScanComplete();

      if (data.verdict !== "SAFE") {
        playAlert();
      }

      toast({
        title: data.verdict === "SAFE" ? "✓ Prompt Cleared" : "⚠ Threat Detected",
        description: data.verdict === "SAFE"
          ? "No malicious patterns detected"
          : `${data.threatType} detected and blocked`,
        variant: data.verdict === "SAFE" ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error analyzing prompt:", error);
      toast({
        title: "Error",
        description: "Failed to analyze prompt",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setPrompt("");
    }
  };

  const severity = result ? getSeverityFromScore(result.riskScore) : null;

  return (
    <div className="cyber-card-premium border-glow-green relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
              <Terminal className="w-6 h-6 text-background" />
            </div>
            <Sparkles className="w-4 h-4 text-neon-green absolute -top-1 -right-1 animate-glow-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl text-gradient-primary uppercase tracking-wider">
              Live Intercept Console
            </h2>
            <p className="text-xs text-muted-foreground">AI-powered threat detection in real-time</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30">
            <span className="w-2 h-2 rounded-full bg-neon-green pulse-green" />
            <span className="text-xs font-medium text-neon-green uppercase tracking-wider">Ready</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green font-mono text-sm opacity-60">
              {">>>"}
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter prompt to analyze for threats..."
              className="cyber-input pl-14 pr-14 font-mono text-sm h-14 group-hover:border-neon-green/50 transition-colors"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isAnalyzing}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "hover:bg-neon-green/20 hover:box-glow-green",
                "bg-neon-green/10"
              )}
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 text-neon-green animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-neon-green" />
              )}
            </button>
          </div>
        </form>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-neon-blue border-t-transparent animate-spin" />
                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-neon-purple border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Analyzing with Gemini AI...</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green animate-gradient-shift" style={{ backgroundSize: '200% 100%', width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {result && (
          <div
            className={cn(
              "mt-6 p-6 rounded-xl border-2 animate-scale-in",
              result.verdict === "SAFE"
                ? "bg-neon-green/5 border-neon-green/50 box-glow-green"
                : "bg-neon-red/5 border-neon-red/50 box-glow-red"
            )}
          >
            <div className="flex items-start gap-5">
              {result.verdict === "SAFE" ? (
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                    <Shield className="w-8 h-8 text-background" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-green flex items-center justify-center pulse-green">
                    <span className="text-background text-xs font-bold">✓</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-red to-neon-orange flex items-center justify-center animate-pulse">
                    <Siren className="w-8 h-8 text-background" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-red flex items-center justify-center pulse-red">
                    <AlertTriangle className="w-3 h-3 text-background" />
                  </div>
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span
                    className={cn(
                      "font-display font-bold text-2xl uppercase tracking-wider",
                      result.verdict === "SAFE" ? "text-neon-green text-glow-green" : "text-neon-red text-glow-red"
                    )}
                  >
                    {result.verdict}
                  </span>

                  {/* Severity Badge */}
                  {severity && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                      severity === "Critical" && "bg-red-500/20 text-red-400 border border-red-400/30",
                      severity === "High" && "bg-orange-500/20 text-orange-400 border border-orange-400/30",
                      severity === "Medium" && "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30",
                      severity === "Low" && "bg-neon-green/20 text-neon-green border border-neon-green/30",
                    )}>
                      {severity === "Critical" && <Zap className="w-3 h-3" />}
                      {severity === "High" && <AlertTriangle className="w-3 h-3" />}
                      {severity}
                    </span>
                  )}

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold font-mono",
                      result.verdict === "SAFE"
                        ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                        : "bg-neon-red/20 text-neon-red border border-neon-red/30"
                    )}
                  >
                    Risk: {result.riskScore}%
                  </span>

                  {result.threatType !== "None" && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-neon-red/20 text-neon-red border border-neon-red/30">
                      {result.threatType}
                    </span>
                  )}
                </div>

                {/* Attack Category */}
                {result.attackCategory && result.attackCategory !== "None" && (
                  <div className="mb-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border",
                        result.attackCategory === "Prompt Injection" && "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
                        result.attackCategory === "Jailbreak" && "bg-orange-500/20 text-orange-400 border-orange-500/30",
                        result.attackCategory === "Data Extraction" && "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
                        result.attackCategory === "Phishing" && "bg-pink-500/20 text-pink-400 border-pink-500/30"
                      )}
                    >
                      {result.attackCategory === "Prompt Injection" && <Target className="w-4 h-4" />}
                      {result.attackCategory === "Jailbreak" && <Brain className="w-4 h-4" />}
                      {result.attackCategory === "Data Extraction" && <Database className="w-4 h-4" />}
                      {result.attackCategory === "Phishing" && <Fish className="w-4 h-4" />}
                      Attack Type: {result.attackCategory}
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-background/50 border border-border">
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    <span className="text-primary">$</span> "{result.prompt}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}