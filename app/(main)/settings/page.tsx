"use client";

import React, { useEffect } from "react";
import { useWorkspaceStore } from "@/context";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Monitor, 
  Cpu, 
  Zap, 
  CreditCard, 
  RefreshCw,
  Clock,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { credits, fetchCredits } = useWorkspaceStore();

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center gap-3">
          <Logo className="text-foreground" />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden text-[11px] sm:inline">
            {credits !== null ? `${(credits / 1000).toFixed(1)}k credits remaining` : "Limited credits"}
          </span>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 w-full pb-20 font-inter">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8 border-b border-border/10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings & Credits</h1>
            <p className="text-muted-foreground">Manage your preferences and workspace resources.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 space-y-20 mt-12">
          
          {/* Credits Section */}
          <section className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-2">
                <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Resources
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">Daily token allocation and usage breakdown.</p>
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchCredits()}
                    className="h-9 px-4 rounded-xl border-border bg-muted/20 hover:bg-muted text-foreground transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Sync
                  </Button>
                </div>
            </div>

            <div className="md:col-span-2 space-y-12">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Available Credits</p>
                  <p className="text-6xl font-black text-foreground tracking-tighter">
                    {credits !== null ? `${(credits / 1000).toFixed(1)}K` : "---"}
                    <span className="text-2xl font-bold text-muted-foreground/40 ml-4">/ 150K</span>
                  </p>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Daily Consumption</span>
                    <span className="text-primary">{credits !== null ? Math.round(( (150000 - credits) / 150000 ) * 100) : 0}% used</span>
                  </div>
                  <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                      style={{ width: `${credits !== null ? (credits / 150000) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Chat</p>
                    <p className="text-sm font-bold">1k / msg</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Editor</p>
                    <p className="text-sm font-bold">500 / edit</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Hints</p>
                    <p className="text-sm font-bold">100 / hint</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/10 flex flex-col sm:flex-row gap-6 justify-between items-center">
                <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Clock className="size-3.5 text-primary/60" />
                  Auto-Refresh at 12:00 AM
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      <Button size="sm" disabled className="rounded-xl font-black uppercase tracking-widest text-[11px] bg-primary text-primary-foreground shadow-xl opacity-50 grayscale h-10 px-8">
                        Upgrade Plans
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-foreground text-background font-bold text-xs px-4 py-2 rounded-lg">
                    COMING SOON
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="grid md:grid-cols-3 gap-8 border-t border-border/10 pt-20">
            <div className="md:col-span-1 space-y-2">
              <h2 className="text-xl font-black flex items-center gap-2 tracking-tight text-foreground">
                <Sun className="w-5 h-5" />
                Interface
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Customize the visual mode of Vibe.</p>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { id: "light", label: "Light", icon: Sun, color: "text-orange-500", bg: "bg-orange-500/10" },
                { id: "dark", label: "Dark", icon: Moon, color: "text-blue-500", bg: "bg-blue-500/10" },
                { id: "system", label: "System", icon: Monitor, color: "text-foreground", bg: "bg-muted/40" }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-5 p-8 rounded-3xl border-2 transition-all group relative overflow-hidden",
                      isActive 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-lg" 
                        : "border-border/30 hover:border-primary/20 hover:bg-muted/20"
                    )}
                  >
                    <div className={cn(
                      "size-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm duration-500",
                      isActive ? "bg-primary text-primary-foreground" : cn(item.bg, item.color)
                    )}>
                      <Icon size={32} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                    {isActive && (
                        <div className="absolute top-2 right-2">
                             <CheckCircle2 className="size-4 text-primary" />
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
