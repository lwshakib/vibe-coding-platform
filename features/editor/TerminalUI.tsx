"use client";

import React, { useEffect, useRef, useState } from "react";
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
  XCircle 
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

export default function TerminalUI() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const shellProcessRef = useRef<any>(null);
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

  useEffect(() => {
    if (!terminalRef.current || !mounted) return;

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

    term.open(terminalRef.current);

    // Set global ref so useWebContainer can write to it
    globalTerminalRef.current = term;

    const timer = setTimeout(() => {
      fitAddon.fit();
    }, 100);

    term.writeln("\x1b[32mWelcome to Vibe Terminal\x1b[0m");

    xtermRef.current = term;

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      term.dispose();
      globalTerminalRef.current = null;
    };
  }, [mounted, theme, resolvedTheme, globalTerminalRef]);

  // Handle shell interaction
  useEffect(() => {
    // Only spawn shell when ready, to ensure file system is prepared and clean path
    if (!instance || !xtermRef.current || state !== "ready") return;

    if (shellProcessRef.current) return;

    let shellProcess: any;

    const startShell = async () => {
      shellProcess = await instance.spawn("jsh", {
        terminal: {
          cols: xtermRef.current!.cols,
          rows: xtermRef.current!.rows,
        },
        cwd: "/home/project",
      });

      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            xtermRef.current?.write(data);
            
            // Ensure data is string for scanning
            const output = typeof data === "string" 
              ? data 
              : new TextDecoder().decode(data);
 
            // Scan for Expo links (exp:// or qr.expo.dev)
            const expoLinkRegex = /(exp:\/\/[^\s\x1b\x07]+|https:\/\/qr\.expo\.dev\/[^\s\x1b\x07]+)/g;
            const matches = output.match(expoLinkRegex);
            if (matches && matches.length > 0) {
              // Clean the captured URL from any terminal garbage
              const cleanUrl = matches[matches.length - 1]
                .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-m]/g, "") // remove remaining ansi
                .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // remove control characters
                .trim();
              
              if (cleanUrl) {
                setExpoQRData(cleanUrl);
              }
            }
          },
        })
      );

      const input = shellProcess.input.getWriter();

      const onData = xtermRef.current!.onData((data) => {
        input.write(data);
      });

      shellProcessRef.current = { shellProcess, onData };
    };

    startShell();

    return () => {
      if (shellProcessRef.current) {
        shellProcessRef.current.onData.dispose();
        shellProcessRef.current.shellProcess.kill();
      }
    };
  }, [instance, state, setExpoQRData]);

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
        <div className="flex items-center justify-between px-4 h-9 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Terminal
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
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
          <div ref={terminalRef} className="h-full w-full" />
        </div>
      </div>
    </TooltipProvider>
  );
}

// Utility function since I can't easily import it here if it's missing, but I'll assume cn is available in the project
import { cn } from "@/lib/utils";
