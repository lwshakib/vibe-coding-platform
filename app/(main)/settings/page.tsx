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
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings & Credits</h1>
            <p className="text-muted-foreground">Manage your preferences and workspace resources.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 space-y-8">
          
          {/* Credits Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Resources
            </h2>
            <div className="border border-primary/20 bg-primary/[0.02] overflow-hidden rounded-2xl relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={120} className="text-primary" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold">Daily Tokens</h3>
                <p className="text-sm text-muted-foreground">Your credits refresh every 24 hours at 12 AM.</p>
              </div>
              <div className="px-6 pb-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Remaining Balance</p>
                    <p className="text-5xl font-black text-foreground">
                      {credits !== null ? `${(credits / 1000).toFixed(1)}K` : "---"}
                      <span className="text-lg font-bold text-muted-foreground ml-2">/ 150K</span>
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-muted-foreground">Daily Usage</span>
                      <span className="text-primary">{credits !== null ? Math.round(( (150000 - credits) / 150000 ) * 100) : 0}% used</span>
                    </div>
                    <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(158,127,255,0.4)]" 
                        style={{ width: `${credits !== null ? (credits / 150000) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchCredits()}
                    className="shrink-0 h-10 px-4 rounded-xl border-primary/20 bg-background hover:bg-primary/5 text-primary"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-primary/10">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                      <Zap size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground/60">Chat</p>
                      <p className="text-sm font-semibold">1,000 credits/msg</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                      <Cpu size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground/60">Quick Edit</p>
                      <p className="text-sm font-semibold">500 credits/edit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground/60">Completion</p>
                      <p className="text-sm font-semibold">100 credits/hint</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  Next refresh: 12:00 AM local time
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Button size="sm" disabled className="rounded-xl font-bold bg-primary text-primary-foreground shadow-lg opacity-50 grayscale cursor-not-allowed">
                        <CreditCard className="size-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-foreground text-background font-medium">
                    This feature has not been built yet.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <Sun className="w-5 h-5" />
              Appearance
            </h2>
            <div className="rounded-2xl overflow-hidden border border-border/40">
              <div className="bg-muted/30 p-6 border-b border-border/40">
                <h3 className="text-lg font-semibold">Theme Preferences</h3>
                <p className="text-sm text-muted-foreground">Customize the interface mode for your eyes.</p>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                    theme === "light" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border/40 hover:bg-muted/50"
                  )}
                >
                  <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Sun size={24} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wide">Light</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                    theme === "dark" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border/40 hover:bg-muted/50"
                  )}
                >
                  <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Moon size={24} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wide">Dark</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                    theme === "system" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border/40 hover:bg-muted/50"
                  )}
                >
                  <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Monitor size={24} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wide">System</span>
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
