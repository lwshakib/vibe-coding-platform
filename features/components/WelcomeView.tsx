"use client";

import React, { useState } from "react";
import { Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeViewProps {
  sendMessage: (content: string) => Promise<void>;
}

export default function WelcomeView({ sendMessage }: WelcomeViewProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-20 animate-in fade-in duration-700">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            What do you want to build?
          </h1>
          <p className="text-base md:text-lg text-white/40 max-w-md mx-auto leading-relaxed">
            Prompt, run, edit, and deploy full-stack{" "}
            <span className="text-white font-medium">web</span> and{" "}
            <span className="text-white font-medium">mobile</span> apps.
          </p>
        </div>

        <div className="mx-auto w-full max-w-lg relative group">
          {/* Token Counter Badge */}
          <div className="absolute -top-6 left-4 right-4 h-7 z-10">
            <div className="bg-[#16161e]/80 border border-white/5 backdrop-blur-md px-3 py-1 rounded-t-xl text-[10px] text-white/40 flex justify-between items-center transition-all group-focus-within:border-white/10 group-focus-within:text-white/60">
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                150K daily tokens remaining
              </span>
              <button className="text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Input Box */}
          <div className="relative bg-[#16161e] border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 group-focus-within:border-white/20 group-focus-within:shadow-white/2">
            <div className="p-4 flex flex-col min-h-40">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="How can Vibe help you today?"
                className="flex-1 w-full bg-transparent border-none outline-none text-white text-sm md:text-base placeholder:text-white/20 resize-none py-2 scrollbar-hide"
                autoFocus
              />

              <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className="bg-white text-black hover:bg-white/90 rounded-full px-5 py-0.5 h-8 text-xs font-semibold shadow-lg disabled:opacity-30 disabled:hover:bg-white"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
