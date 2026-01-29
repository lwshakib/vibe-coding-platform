"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { Terminal as TerminalIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useWebContainerContext } from "@/context/WebContainerContext";

export default function TerminalUI() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const shellProcessRef = useRef<any>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const {
    instance,
    terminalRef: globalTerminalRef,
    state,
  } = useWebContainerContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !mounted) return;

    const isLight = resolvedTheme === "light" || theme === "light";

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: isLight ? "#ffffff" : "#0a0a0a",
        foreground: isLight ? "#000000" : "#ffffff",
        cursor: isLight ? "#000000" : "#ffffff",
        selectionBackground: isLight ? "#d6d6d6" : "#5c5c5c",
        black: "#000000",
        red: "#ff5555",
        green: "#50fa7b",
        yellow: "#f1fa8c",
        blue: "#bd93f9",
        magenta: "#ff79c6",
        cyan: "#8be9fd",
        white: isLight ? "#000000" : "#bfbfbf",
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
      // ...

      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            xtermRef.current?.write(data);
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
  }, [instance]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 h-9 border-b border-border bg-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Terminal
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 min-h-0 relative bg-background">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
}
