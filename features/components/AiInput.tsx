"use client";

import React, { useState } from "react";
import { Paperclip, Sparkles, StopCircle } from "lucide-react";

const AiInput: React.FC = () => {
  const [input, setInput] = useState("");
  const streamingStatus = "idle"; // Mock

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      setInput("");
    }
  };

  return (
    <div className="py-6 bg-background">
      <div className="mx-auto w-full max-w-lg">
        {/* Token Counter Badge */}
        <div className="relative h-6.5">
          <div className="bg-secondary/50 absolute top-0 left-2 flex w-[calc(100%-1rem)] justify-between items-center rounded-t-lg border border-border px-2 py-1 text-xs opacity-100 backdrop-blur transition-opacity duration-350">
            <span className="text-muted-foreground">
              150K daily tokens remaining.
            </span>
            <button className="text-primary font-semibold hover:underline">
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Input Box */}
        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col bg-secondary/50 rounded-lg border border-border p-4 shadow-xs backdrop-blur"
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can Vibe help you today?"
            className="mb-4 w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none py-1 scrollbar-hide min-h-24 max-h-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <div className="mt-auto flex gap-4">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Attach Files"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="AI Tools"
            >
              <Sparkles size={20} />
            </button>

            {streamingStatus === "idle" && (
              <button
                type="button"
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <StopCircle size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiInput;
