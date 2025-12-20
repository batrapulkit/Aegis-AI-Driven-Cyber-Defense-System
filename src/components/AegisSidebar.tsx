import { Shield, Activity, AlertTriangle, Settings, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  active?: boolean;
}

interface AegisSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export const AegisSidebar = ({
  activeSection,
  onSectionChange,
  collapsed,
  onCollapsedChange
}: AegisSidebarProps) => {
  const { playHover, playClick } = useSoundEffects();

  const navItems: NavItem[] = [
    { icon: Activity, label: "System Status", id: "overview" },
    { icon: AlertTriangle, label: "Threat Intel", id: "threats" },
    { icon: Settings, label: "Configuration", id: "settings" },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-[#050a14]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 border-b border-white/5 flex items-center gap-4">
        <div
          className="relative group cursor-pointer"
          onClick={() => {
            onCollapsedChange(!collapsed);
            playClick();
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,255,163,0.3)]">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display font-bold text-xl tracking-wider text-white">
              AEGIS
            </h1>
            <p className="text-[10px] text-neon-green tracking-[0.2em] uppercase">
              Security Hub
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 py-8 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onSectionChange(item.id);
              playClick();
            }}
            onMouseEnter={() => playHover()}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
              activeSection === item.id
                ? "bg-white/5 text-neon-green border border-neon-green/20 shadow-[0_0_10px_rgba(0,255,163,0.1)]"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            {activeSection === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neon-green shadow-[0_0_10px_#00ffa3]" />
            )}

            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-300",
              activeSection === item.id ? "scale-110" : "group-hover:scale-110"
            )} />

            {!collapsed && (
              <span className="font-medium tracking-wide text-sm animate-fade-in">
                {item.label}
              </span>
            )}

            {collapsed && activeSection === item.id && (
              <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => {
            onCollapsedChange(!collapsed);
            playClick();
          }}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all",
            !collapsed && "justify-end"
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
