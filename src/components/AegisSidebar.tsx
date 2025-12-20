import { Shield, Activity, AlertTriangle, Settings, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { icon: Activity, label: "Overview", id: "overview" },
  { icon: AlertTriangle, label: "Threats", id: "threats" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface AegisSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AegisSidebar({ activeSection, onSectionChange, collapsed, onCollapsedChange }: AegisSidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="relative">
          <img src="/Aegis.png" alt="Aegis Logo" className="w-10 h-10 object-contain" />
          <Zap className="w-4 h-4 text-neon-green absolute -bottom-1 -right-1 animate-glow-pulse" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display font-bold text-xl text-primary text-glow-green tracking-wider">
              AEGIS
            </h1>
            <p className="text-[10px] text-neon-blue uppercase tracking-widest font-mono">
              by Securityella
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                "hover:bg-secondary hover:border-glow-green",
                isActive
                  ? "bg-secondary border border-primary box-glow-green text-primary"
                  : "text-muted-foreground border border-transparent"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-glow-green")} />
              {!collapsed && (
                <span className={cn("font-medium", isActive && "text-primary")}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-3 h-3 rounded-full bg-neon-green pulse-green" />
          {!collapsed && (
            <span className="text-sm text-muted-foreground">System Online</span>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary hover:box-glow-green transition-all"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-primary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-primary" />
        )}
      </button>
    </aside>
  );
}
