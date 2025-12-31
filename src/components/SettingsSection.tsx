import { Settings, Bell, Shield, Zap, Cloud, Server, ChevronRight, Loader2, Key, Lock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsSection() {
  const [notifications, setNotifications] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(70);

  // Modal State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]); // Track simulated connections

  const { playClick } = useSoundEffects();

  const initiateConnect = (platform: string) => {
    if (connectedPlatforms.includes(platform)) return; // Already connected
    playClick();
    setSelectedPlatform(platform);
    setApiKey("");
    setSecretKey("");
    setShowConnectModal(true);
  };

  const handleSaveCredentials = () => {
    if (!apiKey) {
      toast.error("Access Key is required");
      return;
    }

    setIsConnecting(true);

    // Simulate API Verification Delay
    setTimeout(() => {
      setIsConnecting(false);
      setShowConnectModal(false);
      setConnectedPlatforms(prev => [...prev, selectedPlatform]);
      playClick();
      toast.success(`Connected to ${selectedPlatform}`, {
        description: "Credentials verified. Beginning cloud infrastructure scan...",
      });
    }, 1500);
  };

  const handleCopyAgent = () => {
    playClick();
    navigator.clipboard.writeText("curl -sL aegis.sh/install | bash");
    toast.success("Agent Install Command Copied", {
      description: "Paste this into your Linux Server terminal."
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-neon-cyan rounded-full" />
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
            System <span className="text-primary">Settings</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm ml-5">
          Configure Aegis security parameters and Integrations
        </p>
      </header>

      <div className="grid gap-6 max-w-2xl">

        {/* Integrations (The Setup Story) */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-blue/10 rounded-lg">
              <Cloud className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Cloud Integrations</h3>
              <p className="text-sm text-muted-foreground">Authorize Aegis to manage your infrastructure</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => initiateConnect('Azure Cloud')}
              disabled={connectedPlatforms.includes('Azure Cloud')}
              className={cn("w-full flex items-center justify-between p-3 rounded-lg border border-border/50 transition-all group",
                connectedPlatforms.includes('Azure Cloud') ? "bg-neon-green/10 border-neon-green/30" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <img src="https://simpleicons.org/icons/microsoftazure.svg" className={cn("w-6 h-6", connectedPlatforms.includes('Azure Cloud') ? "invert-0 filter-none" : "invert")} alt="Azure" />
                <span className="font-medium">Connect Azure Account</span>
              </div>
              {connectedPlatforms.includes('Azure Cloud') ? (
                <div className="flex items-center gap-2 text-neon-green">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs font-mono">SCANNING</span>
                </div>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              )}
            </button>
            <button
              onClick={() => initiateConnect('AWS Cloud')}
              disabled={connectedPlatforms.includes('AWS Cloud')}
              className={cn("w-full flex items-center justify-between p-3 rounded-lg border border-border/50 transition-all group",
                connectedPlatforms.includes('AWS Cloud') ? "bg-orange-500/10 border-orange-500/30" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <img src="https://simpleicons.org/icons/amazonwebservices.svg" className={cn("w-6 h-6", connectedPlatforms.includes('AWS Cloud') ? "invert-0 filter-none" : "invert")} alt="AWS" />
                <span className="font-medium">Connect AWS Account</span>
              </div>
              {connectedPlatforms.includes('AWS Cloud') ? (
                <div className="flex items-center gap-2 text-orange-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs font-mono">SCANNING</span>
                </div>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              )}
            </button>
            <div className="border-t border-border/50 my-2"></div>
            <button onClick={handleCopyAgent} className="w-full flex items-center justify-between p-3 rounded-lg border border-neon-green/30 bg-neon-green/5 hover:bg-neon-green/10 transition-all group text-left">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-neon-green" />
                <div>
                  <span className="font-medium block text-neon-green">Install On-Prem Agent</span>
                  <span className="text-xs text-muted-foreground">For Linux Servers & Firewalls</span>
                </div>
              </div>
              <span className="text-xs font-mono bg-background/50 px-2 py-1 rounded text-muted-foreground group-hover:text-foreground">Copy Curl</span>
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Threat Notifications</h3>
                  <p className="text-sm text-muted-foreground">Get alerts when threats are detected</p>
                </div>
              </div>
              <button
                onClick={() => { setNotifications(!notifications); playClick(); }}
                className={`w-12 h-6 rounded-full transition-colors ${notifications ? "bg-primary" : "bg-muted"
                  }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${notifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Auto Block */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Auto-Block Threats</h3>
                  <p className="text-sm text-muted-foreground">Automatically block high-risk prompts</p>
                </div>
              </div>
              <button
                onClick={() => { setAutoBlock(!autoBlock); playClick(); }}
                className={`w-12 h-6 rounded-full transition-colors ${autoBlock ? "bg-primary" : "bg-muted"
                  }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${autoBlock ? "translate-x-6" : "translate-x-0.5"
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Risk Threshold */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Risk Threshold</h3>
                <p className="text-sm text-muted-foreground">Block prompts above this risk score</p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">0%</span>
                <span className="text-primary font-semibold">{riskThreshold}%</span>
                <span className="text-muted-foreground">100%</span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-neon-green/10 rounded-lg">
                <Settings className="w-5 h-5 text-neon-green" />
              </div>
              <h3 className="font-semibold text-foreground">System Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-foreground">Aegis v2.0 (Stable)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-neon-green">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Backend</span>
                <span className="text-primary font-mono">Azure OpenAI (GPT-4o)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voice Service</span>
                <span className="text-neon-blue font-mono">Azure Cognitive Speech</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Modal */}
        <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
          <DialogContent className="sm:max-w-[425px] bg-[#050a14] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-neon-blue" />
                Connect {selectedPlatform}
              </DialogTitle>
              <DialogDescription>
                Enter your credentials to authorize Aegis.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="apiKey" className="text-white/80 flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  Access Key / Client ID
                </Label>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Ex: AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secretKey" className="text-white/80 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Secret Key
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="••••••••••••••••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConnectModal(false)} className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">
                Cancel
              </Button>
              <Button onClick={handleSaveCredentials} disabled={isConnecting} className="bg-neon-blue hover:bg-neon-blue/80 text-white">
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Connect Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
