"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";
import React from "react";

export default function TerminalUI() {
  return (
    <div className="h-full w-full bg-black/95 text-slate-300 font-mono text-sm flex flex-col">
      <div className="flex items-center justify-between px-4 h-9 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Terminal</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="text-green-500">➜</span>
            <span className="text-cyan-500">vibe-project</span>
            <span className="text-slate-500">git:(main)</span>
            <span>npm run dev</span>
          </div>
          <div className="text-slate-400 pl-4">
            <p> vibe-coding-platform@0.1.0 dev</p>
            <p> next dev</p>
            <p className="mt-2 text-green-400">
              Ready in 1234ms on http://localhost:3000
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <span className="text-green-500">➜</span>
            <span className="text-cyan-500">vibe-project</span>
            <span className="text-slate-500">git:(main)</span>
            <span className="animate-pulse">_</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
