import { useState, useEffect } from "react";
import { Globe, Shield, AlertTriangle, CheckCircle, Search, Terminal, Lock, Bug, Code, ChevronRight, Server, Wifi, Cpu, MapPin, Brain, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Vulnerability {
    id: string; // We will generate this
    type: "high" | "medium" | "low";
    name: string;
    description: string;
    fix: string;
}

interface ScanMetaData {
    latency: number;
    grade?: string;
    score?: number;
    techStack: string[];
    location: {
        country: string;
        city: string;
        isp: string;
        ip: string;
    };
}

export const WebScanner = () => {
    const { playClick, playHover } = useSoundEffects();
    const [url, setUrl] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanStep, setScanStep] = useState(0);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [scanMetadata, setScanMetadata] = useState<ScanMetaData | null>(null);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [expandedVuln, setExpandedVuln] = useState<string | null>(null);

    const scanSteps = [
        "Detecting LLM endpoints...",
        "Analyzing System Prompt safeguards...",
        "Testing for Prompt Injection...",
        "Attempting Jailbreak vectors...",
        "Verifying output sanitization...",
        "Checking for PII leakage...",
        "Auditing Model Card metadata...",
        "Validating Rate Limits...",
        "Finalizing AI Safety Report..."
    ];

    const handleScan = async () => {
        if (!url) {
            toast.error("Please enter a valid URL");
            return;
        }
        // Basic URL validation
        let targetUrl = url;
        if (!url.startsWith("http")) {
            targetUrl = `https://${url}`;
            setUrl(targetUrl); // Auto-fix for display
        }

        playClick();
        setIsScanning(true);
        setScanStep(0);
        setVulnerabilities([]);
        setScanMetadata(null);
        setScanLog([]);
        setProgress(0);

        // Visual Simulation while fetching
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < scanSteps.length) {
                setScanStep(step);
                setProgress((prev) => Math.min(prev + 10, 90)); // Cap at 90% until done
                setScanLog(prev => [...prev.slice(-5), `> ${scanSteps[step - 1]} [OK]`]);
            }
        }, 800);

        try {
            console.log("Invoking scan-website function with:", targetUrl);
            const { data, error } = await supabase.functions.invoke('scan-website', {
                body: { url: targetUrl }
            });

            clearInterval(interval);
            setProgress(100);
            setScanStep(scanSteps.length);

            if (error) {
                console.error("Scan function error:", error);
                throw error;
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            console.log("Scan Data:", data);

            // Use REAL data from the backend
            const realVulns = (data.vulnerabilities || []).map((v: any, index: number) => ({
                ...v,
                id: `real-vuln-${index}`
            }));

            setVulnerabilities(realVulns);
            setScanMetadata({
                latency: data.latency || 0,
                grade: data.grade,
                score: data.score,
                techStack: data.techStack || [],
                location: data.location || { country: 'Unknown', city: 'Unknown', isp: 'Unknown', ip: 'Unknown' }
            });

            const isRiskDetected = realVulns.length > 0;
            const statusMsg = isRiskDetected ? "Risk Detected" : "No Critical AI Risks Found";

            setScanLog(prev => [...prev, "> Gen AI Security Analysis Complete", `> Status: ${statusMsg}`]);

            if (isRiskDetected) {
                toast.success("AI Security Scan Complete", { description: `Found ${realVulns.length} potential AI security issues.` });
            } else {
                toast.success("AI Security Scan Complete", { description: "Target appears secure against common Gen AI threats." });
            }

        } catch (err: any) {
            clearInterval(interval);
            setIsScanning(false);
            console.error(err);
            toast.error("Scan Failed", { description: err.message || "Could not connect to scanner service." });
            setScanLog(prev => [...prev, `> ERROR: ${err.message}`]);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto p-6">
            <header className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-neon-purple/10 rounded-xl border border-neon-purple/20">
                    <Brain className="w-8 h-8 text-neon-purple" />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-display font-bold text-3xl text-foreground">
                            Gen AI <span className="text-neon-purple">Security Scanner</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Scan for LLM vulnerabilities (Prompt Injection, Jailbreaks, Data Leaks).
                    </p>
                </div>
            </header>

            {/* Input Section */}
            <div className="bg-[#050a14] border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-50" />

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full space-y-2">
                        <label className="text-xs font-mono text-neon-purple uppercase tracking-wider">Target AI Endpoint / App URL</label>
                        <div className="relative group">
                            <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-neon-purple transition-colors" />
                            <Input
                                placeholder="https://my-ai-app.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-neon-purple/50 focus:ring-neon-purple/20 h-12 text-lg font-mono"
                                disabled={isScanning}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleScan}
                        disabled={isScanning}
                        className={cn(
                            "h-12 px-8 min-w-[140px] font-bold tracking-wide transition-all",
                            isScanning ? "bg-neon-purple/20 text-neon-purple cursor-not-allowed" : "bg-neon-purple hover:bg-neon-purple/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
                        )}
                    >
                        {isScanning ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-neon-purple rounded-full animate-bounce delay-75" />
                                <span className="w-2 h-2 bg-neon-purple rounded-full animate-bounce delay-150" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                SCAN
                            </div>
                        )}
                    </Button>
                </div>


                {/* Scan Progress & Logs */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-6 border-t border-white/10 pt-6"
                        >
                            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground font-mono">
                                <span>PROGRESS</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                                <motion.div
                                    className="h-full bg-neon-purple box-shadow-[0_0_10px_#a855f7]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="font-mono text-xs space-y-1 text-green-400 p-4 bg-black/50 rounded-lg border border-white/5 min-h-[100px]">
                                {scanLog.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        {log}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results Section */}
            <AnimatePresence>
                {vulnerabilities.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats Column */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-1 space-y-4"
                        >
                            {/* Security Grade */}
                            <div className="bg-card/50 backdrop-blur border border-border/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full border-4 border-red-500/20 flex items-center justify-center mb-4 relative">
                                    <div className={cn("absolute inset-0 border-4 rounded-full border-t-transparent animate-spin-slow",
                                        scanMetadata?.grade === 'A' ? "border-green-500" :
                                            scanMetadata?.grade === 'B' ? "border-blue-500" :
                                                "border-red-500"
                                    )} />
                                    <span className={cn("text-3xl font-bold",
                                        scanMetadata?.grade === 'A' ? "text-green-500" :
                                            scanMetadata?.grade === 'B' ? "text-blue-500" :
                                                "text-red-500"
                                    )}>
                                        {scanMetadata?.grade || '-'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Security Grade</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {scanMetadata?.score !== undefined ? `Score: ${scanMetadata.score}/100` : 'Scan Completed'}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 opacity-50">
                                    <CheckCircle className="w-3 h-3" /> Saved to History
                                </span>
                            </div>

                            {/* Reconnaissance Data */}
                            {scanMetadata && (
                                <div className="bg-card/50 backdrop-blur border border-border/50 p-6 rounded-xl space-y-4">
                                    <h4 className="text-sm font-bold text-neon-purple uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Server className="w-4 h-4" /> Target Intel
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-3 h-3" /> Location</span>
                                            <span className="text-white font-mono text-xs">{scanMetadata.location.country || "Unknown"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-2"><Wifi className="w-3 h-3" /> Latency</span>
                                            <span className={cn("font-mono text-xs", scanMetadata.latency < 200 ? "text-green-400" : "text-yellow-400")}>
                                                {scanMetadata.latency}ms
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-white/5">
                                            <span className="text-xs text-muted-foreground mb-2 block flex items-center gap-2"><Cpu className="w-3 h-3" /> Tech Stack</span>
                                            <div className="flex flex-wrap gap-2">
                                                {scanMetadata.techStack.length > 0 ? (
                                                    scanMetadata.techStack.map(tech => (
                                                        <span key={tech} className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/80 border border-white/10">
                                                            {tech}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Hidden / Detected none</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Vulnerability Counts */}
                            <div className="bg-card/50 backdrop-blur border border-border/50 p-6 rounded-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">High Risk</span>
                                    <span className="text-red-500 font-bold">{vulnerabilities.filter(v => v.type === 'high').length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Medium Risk</span>
                                    <span className="text-orange-500 font-bold">{vulnerabilities.filter(v => v.type === 'medium').length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Low Risk</span>
                                    <span className="text-blue-500 font-bold">{vulnerabilities.filter(v => v.type === 'low').length}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Vulnerability List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2 space-y-4"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-neon-purple" />
                                Identified Threats
                            </h3>

                            {vulnerabilities.map((vuln) => (
                                <div key={vuln.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "p-2 rounded-lg mt-1",
                                                vuln.type === 'high' ? "bg-red-500/10 text-red-500" :
                                                    vuln.type === 'medium' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                <Bug className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-white">{vuln.name}</h4>
                                                    <span className={cn(
                                                        "text-[10px] uppercase px-2 py-0.5 rounded border",
                                                        vuln.type === 'high' ? "border-red-500/30 text-red-500" :
                                                            vuln.type === 'medium' ? "border-orange-500/30 text-orange-500" : "border-blue-500/30 text-blue-500"
                                                    )}>
                                                        {vuln.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">{vuln.description}</p>

                                                <AnimatePresence>
                                                    {expandedVuln === vuln.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="bg-black/30 rounded p-3 border border-white/5 flex items-start gap-3 mt-2">
                                                                <Code className="w-4 h-4 text-neon-purple mt-0.5" />
                                                                <div>
                                                                    <span className="text-xs text-neon-purple block font-bold mb-0.5">Recommended Fix</span>
                                                                    <code className="text-xs text-gray-300 font-mono">{vuln.fix}</code>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setExpandedVuln(expandedVuln === vuln.id ? null : vuln.id)}
                                            className="text-muted-foreground hover:text-white shrink-0"
                                        >
                                            {expandedVuln === vuln.id ? "Hide" : "Details"}
                                            <ChevronRight className={cn("w-4 h-4 ml-1 transition-transform", expandedVuln === vuln.id ? "rotate-90" : "")} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
