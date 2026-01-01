import { useState, useRef } from "react";
import { Upload, FileText, ShieldAlert, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function LogAnalysis() {
    const [logs, setLogs] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            toast.error("File too large (max 1MB)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setLogs(text);
            setAnalysis(null); // Reset previous analysis
        };
        reader.readAsText(file);
    };

    const analyzeLogs = async () => {
        if (!logs) return;

        setIsAnalyzing(true);
        try {
            // Check session, but DO NOT BLOCK or force login.
            // If no session, we proceed as Guest.
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log("No active session. Proceeding as Guest.");
            }

            // We reuse the analyze-prompt function but prepend context
            const promptContext = `[SYSTEM LOG ANALYSIS REQUEST]
      Analyze the following log lines for security threats, anomalies, or errors.

    LOGS:
      ${logs.slice(0, 5000)}

(Truncated to 5000 chars)`;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session ? `Bearer ${session.access_token}` : ''
                },
                body: JSON.stringify({ prompt: promptContext, logMode: true })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Analysis failed');
            }

            const result = await response.json();
            setAnalysis(result);
            toast.success("Log analysis complete!");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to analyze logs");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="cyber-card p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-neon-purple" />
                </div>
                <h3 className="font-display font-bold text-lg">SIEM Log Analysis</h3>
            </div>

            <div className="space-y-4">
                <div
                    className="border-2 border-dashed border-border hover:border-neon-purple/50 transition-colors rounded-xl p-8 text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".log,.txt,.json"
                        onChange={handleFileUpload}
                    />
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload .log or .txt file</p>
                </div>

                {logs && (
                    <div className="bg-secondary/50 p-4 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
                        {logs}
                    </div>
                )}

                <Button
                    className="w-full bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30"
                    disabled={!logs || isAnalyzing}
                    onClick={analyzeLogs}
                >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isAnalyzing ? "Analyzing Patterns..." : "Run AI Analysis"}
                </Button>

                {analysis && (
                    <div className={`mt-4 p-4 rounded-lg border ${analysis.verdict === 'BLOCKED' ? 'border-neon-red bg-neon-red/10' :
                            analysis.verdict === 'WARNING' ? 'border-neon-orange bg-neon-orange/10' :
                                'border-neon-green bg-neon-green/10'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            {analysis.verdict === 'BLOCKED' ? (
                                <ShieldAlert className="w-6 h-6 text-neon-red animate-pulse" />
                            ) : analysis.verdict === 'WARNING' ? (
                                <AlertTriangle className="w-6 h-6 text-neon-orange animate-pulse" />
                            ) : (
                                <ShieldCheck className="w-6 h-6 text-neon-green" />
                            )}
                            <span className={`font-display font-bold text-lg ${analysis.verdict === 'BLOCKED' ? 'text-neon-red' :
                                    analysis.verdict === 'WARNING' ? 'text-neon-orange' :
                                        'text-neon-green'
                                }`}>
                                {analysis.verdict === 'BLOCKED' ? 'ANOMALIES DETECTED' :
                                    analysis.verdict === 'WARNING' ? 'POTENTIAL RISK' :
                                        'LOGS LOOK CLEAN'}
                            </span>
                        </div>
                        <div className="text-sm opacity-90 space-y-3 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded bg-black/20">
                                    <span className="text-xs uppercase opacity-70 block mb-1">Risk Score</span>
                                    <span className="font-mono text-xl font-bold">{analysis.riskScore}/100</span>
                                </div>
                                <div className="p-3 rounded bg-black/20">
                                    <span className="text-xs uppercase opacity-70 block mb-1">Threat Type</span>
                                    <span className="font-bold">{analysis.threatType || 'System Anomaly'}</span>
                                </div>
                            </div>

                            {analysis.summary && (
                                <div className="p-3 rounded bg-black/10 border border-white/5">
                                    <span className="text-xs font-bold uppercase opacity-70 block mb-1 text-neon-blue">Analysis Summary</span>
                                    <p className="leading-relaxed">{analysis.summary}</p>
                                </div>
                            )}

                            {analysis.mitigation && (
                                <div className="p-3 rounded bg-neon-blue/5 border border-neon-blue/20">
                                    <span className="text-xs font-bold uppercase opacity-70 block mb-1 text-neon-cyan flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                                        Recommended Mitigation
                                    </span>
                                    <p className="leading-relaxed font-medium">{analysis.mitigation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
