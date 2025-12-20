import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AegisSidebar } from "@/components/AegisSidebar";
import { HeroStats } from "@/components/HeroStats";
import { LiveInterceptConsole } from "@/components/LiveInterceptConsole";
import { LiveFeed } from "@/components/LiveFeed";
import { ThreatAnalyticsChart } from "@/components/ThreatAnalyticsChart";
import { FileScanner } from "@/components/FileScanner";
import { GlobalThreatMap } from "@/components/GlobalThreatMap";
import { ThreatsSection } from "@/components/ThreatsSection";
import { SettingsSection } from "@/components/SettingsSection";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { VoiceControl } from "@/components/VoiceControl";
import { toast } from "sonner";
import { StartupSequence } from "@/components/StartupSequence";

import { useSoundEffects } from "@/hooks/useSoundEffects";

const Index = () => {
  const [totalScans, setTotalScans] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [voiceScanTrigger, setVoiceScanTrigger] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const { playHover, playClick, playScan, playAlert } = useSoundEffects();

  const fetchStats = async () => {
    const { count: total } = await supabase
      .from("scan_logs")
      .select("*", { count: "exact", head: true });

    const { count: blocked } = await supabase
      .from("scan_logs")
      .select("*", { count: "exact", head: true })
      .eq("verdict", "BLOCKED");

    setTotalScans(total || 0);
    setThreatsBlocked(blocked || 0);
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_logs" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleScanComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchStats();
    playClick(); // Sound confirmation
  };

  const handleVoiceCommand = (command: string) => {
    if (command.includes("scan") || command.includes("system")) {
      setVoiceScanTrigger(prev => prev + 1);
      playScan(); // Audio feedback for scan
      toast.info("Voice Command: Initiating System Scan...");
    } else if (command.includes("show threats") || command.includes("threats")) {
      setActiveSection("threats");
      playClick();
      toast.success("Voice Command: Navigating to Threats");
    } else if (command.includes("overview") || command.includes("home")) {
      setActiveSection("overview");
      playClick();
      toast.success("Voice Command: Navigating to Overview");
    } else if (command.includes("settings")) {
      setActiveSection("settings");
      playClick();
      toast.success("Voice Command: Navigating to Settings");
    }
  };

  if (isBooting) {
    return <StartupSequence onComplete={() => {
      setIsBooting(false);
      playScan(); // Boot up sound
    }} />;
  }

  return (
    <>
      <Helmet>
        <title>Aegis Security Dashboard | AI-Powered Threat Detection</title>
        <meta
          name="description"
          content="Aegis is a Zero-Trust AI Security Sentinel that detects and neutralizes prompt injection attacks, jailbreaks, and hidden malicious intent in real-time."
        />
      </Helmet>

      {/* Voice Control Overlay */}
      <VoiceControl onCommand={handleVoiceCommand} />

      <div className="flex min-h-screen w-full bg-background cyber-grid">
        <AegisSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <main
          className={cn(
            "flex-1 p-6 lg:p-8 overflow-auto transition-all duration-300",
            sidebarCollapsed ? "ml-20" : "ml-64"
          )}
        >
          {activeSection === "overview" && (
            <>
              <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-neon-green to-neon-cyan rounded-full" />
                  <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
                    Security <span className="text-gradient-primary">Overview</span>
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm ml-5">
                  Real-time AI prompt monitoring and threat neutralization
                </p>
              </header>

              <section className="mb-6">
                <HeroStats totalScans={totalScans} threatsBlocked={threatsBlocked} />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <LiveInterceptConsole
                    onScanComplete={handleScanComplete}
                    autoRunTrigger={voiceScanTrigger}
                  />
                </div>
                <div className="h-full">
                  <FileScanner />
                </div>
              </div>

              {/* Global Threat Map - Compact but full width */}
              <section className="mb-6 animate-fade-in">
                <GlobalThreatMap scanningTrigger={voiceScanTrigger} />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LiveFeed refreshTrigger={refreshTrigger} />
                <ThreatAnalyticsChart />
              </div>
            </>
          )}

          {activeSection === "threats" && <ThreatsSection />}
          {activeSection === "settings" && <SettingsSection />}

          <footer className="mt-8 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex flex-col gap-1">
                <p className="font-display tracking-wider">Aegis by Securityella — Microsoft Imagine Cup 2026</p>
                <p className="text-xs text-neon-blue">Powered by Microsoft Azure • Azure OpenAI • Static Web Apps</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-green pulse-green" />
                <span>All systems operational</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Index;
