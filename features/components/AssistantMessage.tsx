"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface AssistantMessageProps {
  content: string;
  lastMessage?: boolean;
  reasoningText?: string;
  isStreaming?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  lastMessage,
  reasoningText,
  isStreaming,
}) => {
  return (
    <div className="flex justify-start mb-8 group">
      <div className="flex gap-3 max-w-[90%]">
        <div className="shrink-0 mt-1">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {reasoningText && (
            <div className="text-xs text-white/40 italic bg-white/2 border-l border-white/10 pl-3 py-1 my-1">
              {reasoningText}
            </div>
          )}
          <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && lastMessage && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-white/50 animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;
