
import { useState } from "react";
import { Mail, Globe, AlertTriangle, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PhishingDetector() {
    const [content, setContent] = useState("");
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const analyzePhishing = async (type: 'email' | 'url') => {
        const payload = type === 'email' ? content : url;
        if (!payload) return;

        setLoading(true);
        try {
            let { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // FALLBACK: Attempt Anonymous Sign-in for Demo
                const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
                if (authError || !authData.session) {
                    toast.error("Unauthorized. Please sign in.");
                    return; // Stop if auth fails completely
                }
                session = authData.session;
            }

            let endpoint = 'analyze-prompt';
            let body: any = { prompt: payload };

            if (type === 'url') {
                endpoint = 'scan-website';
                body = { url: payload };
            } else {
                // Context wrapper for email
                body.prompt = `[PHISHING ANALYSIS] Analyze this email/message for phishing indicators: "${payload}"`;
            }

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Scan failed');

            const data = await response.json();
            setResult({ type, data });

        } catch (error) {
            toast.error("Scan failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cyber-card p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-neon-orange/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-neon-orange" />
                </div>
                <h3 className="font-display font-bold text-lg">Phishing & URL Guard</h3>
            </div>

            <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="email">Email Content</TabsTrigger>
                    <TabsTrigger value="url">Suspicious URL</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                    <Textarea
                        placeholder="Paste email headers or body here..."
                        className="bg-secondary/50 border-border min-h-[100px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <Button
                        className="w-full bg-neon-orange/20 text-neon-orange hover:bg-neon-orange/30"
                        onClick={() => analyzePhishing('email')}
                        disabled={loading || !content}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                        Scan Email
                    </Button>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                    <Input
                        placeholder="https://suspicious-site.com"
                        className="bg-secondary/50 border-border"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <Button
                        className="w-full bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30"
                        onClick={() => analyzePhishing('url')}
                        disabled={loading || !url}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Globe className="mr-2 h-4 w-4" />}
                        Scan Link
                    </Button>
                </TabsContent>
            </Tabs>

            {result && (
                <div className="mt-4 animate-fade-in">
                    {result.type === 'email' ? (
                        <div className={`p-4 rounded-lg border ${result.data.verdict === 'BLOCKED' ? 'border-neon-red bg-neon-red/10' : 'border-neon-green bg-neon-green/10'}`}>
                            <div className="font-bold flex items-center gap-2">
                                {result.data.verdict === 'BLOCKED' ? "PHISHING DETECTED" : "SAFE CONTENT"}
                            </div>
                            <p className="text-sm mt-1">{result.data.attackCategory !== 'None' ? result.data.attackCategory : "No obvious threats found."}</p>
                        </div>
                    ) : (
                        <div className={`p-4 rounded-lg border ${result.data.grade === 'A' || result.data.grade === 'B' ? 'border-neon-green bg-neon-green/10' : 'border-neon-red bg-neon-red/10'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Security Grade: {result.data.grade}</span>
                                <span className="text-sm font-mono">Score: {result.data.score}</span>
                            </div>
                            <div className="mt-2 text-xs opacity-75">
                                {result.data.vulnerabilities?.length} issues found.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
