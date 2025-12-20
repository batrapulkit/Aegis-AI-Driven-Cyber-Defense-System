import { Settings, Bell, Shield, Zap } from "lucide-react";
import { useState } from "react";

export function SettingsSection() {
  const [notifications, setNotifications] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(70);

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
          Configure Aegis security parameters
        </p>
      </header>

      <div className="grid gap-6 max-w-2xl">
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
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-0.5"
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
              onClick={() => setAutoBlock(!autoBlock)}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoBlock ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  autoBlock ? "translate-x-6" : "translate-x-0.5"
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
              <span className="text-foreground">Aegis v2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-neon-green">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Model</span>
              <span className="text-foreground">Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
