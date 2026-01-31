"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { 
  Terminal as TerminalIcon, 
  QrCode, 
  RefreshCw, 
  Play, 
  Square, 
  Download, 
  XCircle,
  Plus,
  X
} from "lucide-react";
import { useTheme } from "next-themes";
import { useWebContainerContext } from "@/context/WebContainerContext";
import { useWorkspaceStore } from "@/context";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function TerminalUI() {
  const [tabs, setTabs] = useState<{ id: string; name: string }[]>([
    { id: "1", name: "Main Terminal" },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  
  const terminalContainersRef = useRef<Record<string, HTMLDivElement | null>>({});
  const xtermsRef = useRef<Record<string, XTerm>>({});
  const shellProcessesRef = useRef<Record<string, { process: any, onData: any }>>({});
  const fitAddonsRef = useRef<Record<string, FitAddon>>({});
  
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setExpoQRData, expoQRData, setShowExpoQR } = useWorkspaceStore();
  const {
    instance,
    terminalRef: globalTerminalRef,
    state,
    startDevServer,
    stopDevServer,
    runInstall,
    stopInstall
  } = useWebContainerContext();

  const isRunning = state === "starting" || state === "ready";
  const isInstalling = state === "installing";
  const isTransitioning = state === "booting" || state === "mounting";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize terminal for a specific tab
  const initTerminal = useCallback((tabId: string) => {
    if (!terminalContainersRef.current[tabId] || xtermsRef.current[tabId]) return;

    const isLight = resolvedTheme === "light" || theme === "light";

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: isLight ? "#f8fafc" : "#0a0a0a",
        foreground: isLight ? "#334155" : "#ffffff",
        cursor: isLight ? "#64748b" : "#ffffff",
        selectionBackground: isLight ? "#cbd5e1" : "#5c5c5c",
        black: isLight ? "#1e293b" : "#000000",
        red: isLight ? "#dc2626" : "#ef4444",
        green: isLight ? "#16a34a" : "#22c55e",
        yellow: isLight ? "#d97706" : "#f59e0b",
        blue: isLight ? "#2563eb" : "#3b82f6",
        magenta: isLight ? "#c026d3" : "#d946ef",
        cyan: isLight ? "#0891b2" : "#06b6d4",
        white: isLight ? "#f1f5f9" : "#bfbfbf",
      },
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainersRef.current[tabId]!);
    
    xtermsRef.current[tabId] = term;
    fitAddonsRef.current[tabId] = fitAddon;

    // Set global ref if it's the first terminal
    if (tabId === "1") {
      globalTerminalRef.current = term;
      term.writeln("\x1b[32mWelcome to Vibe Terminal\x1b[0m");
    }

    const timer = setTimeout(() => {
      fitAddon.fit();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalContainersRef.current[tabId]!);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      term.dispose();
      delete xtermsRef.current[tabId];
      delete fitAddonsRef.current[tabId];
      if (tabId === "1") {
        globalTerminalRef.current = null;
      }
    };
  }, [theme, resolvedTheme, globalTerminalRef]);

  // Handle Tab changes and initial mount
  useEffect(() => {
    if (!mounted) return;
    
    tabs.forEach(tab => {
      if (!xtermsRef.current[tab.id]) {
        initTerminal(tab.id);
      }
    });
  }, [mounted, tabs, initTerminal]);

  // Handle shell interaction for each terminal
  useEffect(() => {
    if (!instance || state !== "ready") return;

    tabs.forEach(async (tab) => {
      const term = xtermsRef.current[tab.id];
      if (!term || shellProcessesRef.current[tab.id]) return;

      const shellProcess = await instance.spawn("jsh", {
        terminal: {
          cols: term.cols,
          rows: term.rows,
        },
        cwd: "/home/project",
      });

      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            term.write(data);
            
            // Expo QR Code detection (only on Terminal 1)
            if (tab.id === "1") {
              const output = typeof data === "string" 
                ? data 
                : new TextDecoder().decode(data);
              const expoLinkRegex = /(exp:\/\/[^\s\x1b\x07]+|https:\/\/qr\.expo\.dev\/[^\s\x1b\x07]+)/g;
              const matches = output.match(expoLinkRegex);
              if (matches && matches.length > 0) {
                const cleanUrl = matches[matches.length - 1]
                  .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-m]/g, "")
                  .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
                  .trim();
                if (cleanUrl) setExpoQRData(cleanUrl);
              }
            }
          },
        })
      );

      const input = shellProcess.input.getWriter();
      const onData = term.onData((data) => {
        input.write(data);
      });

      shellProcessesRef.current[tab.id] = { process: shellProcess, onData };
    });

    return () => {
      // We don't necessarily want to kill all shells on Every tab change, 
      // but if the instance or state changes we should.
      // Usually useEffect cleanup handles this.
    };
  }, [instance, state, tabs, setExpoQRData]);

  // Terminate shell processes on unmount or instance change
  useEffect(() => {
    return () => {
      Object.values(shellProcessesRef.current).forEach(({ process, onData }) => {
        onData.dispose();
        process.kill();
      });
      shellProcessesRef.current = {};
    };
  }, [instance]);

  const addTab = () => {
    if (tabs.length >= 3) return;
    const newId = String(Date.now());
    setTabs([...tabs, { id: newId, name: `Terminal ${tabs.length + 1}` }]);
    setActiveTabId(newId);
  };

  const removeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1 || id === "1") return;
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }

    // Cleanup terminal and process
    if (shellProcessesRef.current[id]) {
      shellProcessesRef.current[id].onData.dispose();
      shellProcessesRef.current[id].process.kill();
      delete shellProcessesRef.current[id];
    }
    if (xtermsRef.current[id]) {
      xtermsRef.current[id].dispose();
      delete xtermsRef.current[id];
    }
  };

  const HeaderButton = ({ 
    icon: Icon, 
    onClick, 
    tooltip, 
    className, 
    disabled, 
    iconClassName 
  }: { 
    icon: any, 
    onClick: () => void, 
    tooltip: string, 
    className?: string, 
    disabled?: boolean,
    iconClassName?: string
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost" 
          size="icon"
          className={cn("h-7 w-7 transition-all rounded-md", className)}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className={cn("w-3.5 h-3.5", iconClassName)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={400}>
      <div className="h-full w-full bg-background flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-2 h-9 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[70%]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 h-7 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                  activeTabId === tab.id 
                    ? "bg-background text-foreground shadow-sm border border-border" 
                    : "text-muted-foreground hover:bg-background/50"
                )}
              >
                <TerminalIcon className="w-3 h-3" />
                {tab.name}
                {tab.id !== "1" && (
                  <X
                    className="w-3 h-3 ml-1 hover:text-red-500 transition-colors"
                    onClick={(e: React.MouseEvent) => removeTab(tab.id, e)}
                  />
                )}
              </button>
            ))}
            {tabs.length < 3 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={addTab}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {instance && (
              <>
                {/* Installation Controls */}
                {!isInstalling ? (
                  <HeaderButton 
                    icon={Download}
                    onClick={() => runInstall(instance)}
                    tooltip="Install Dependencies"
                    className="text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                    disabled={isTransitioning || isRunning}
                  />
                ) : (
                  <HeaderButton 
                    icon={XCircle}
                    onClick={() => stopInstall()}
                    tooltip="Stop Installation"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  />
                )}

                <div className="w-px h-4 bg-border mx-0.5" />

                {/* Server Controls */}
                {!isRunning ? (
                  <HeaderButton 
                    icon={Play}
                    onClick={() => startDevServer(instance)}
                    tooltip="Start Server"
                    className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                    disabled={isTransitioning || isInstalling}
                    iconClassName="fill-current"
                  />
                ) : (
                  <>
                    <HeaderButton 
                      icon={RefreshCw}
                      onClick={() => startDevServer(instance)}
                      tooltip="Restart Server"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      iconClassName={state === "starting" ? "animate-spin" : ""}
                    />
                    <HeaderButton 
                      icon={Square}
                      onClick={() => stopDevServer()}
                      tooltip="Stop Server"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      iconClassName="fill-current"
                    />
                  </>
                )}
              </>
            )}

            {expoQRData && (
              <>
                <div className="w-px h-4 bg-border mx-0.5" />
                <HeaderButton 
                  icon={QrCode}
                  onClick={() => setShowExpoQR(true)}
                  tooltip="Show Expo QR"
                  className="text-primary hover:text-primary hover:bg-primary/10"
                />
              </>
            )}
          </div>
        </div>
        <div className="flex-1 p-2 min-h-0 relative bg-background">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              ref={(el) => { terminalContainersRef.current[tab.id] = el }}
              className={cn(
                "h-full w-full",
                activeTabId === tab.id ? "block" : "hidden"
              )}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

