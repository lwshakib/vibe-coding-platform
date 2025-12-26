"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReasoningProps {
  children: React.ReactNode;
  isStreaming?: boolean;
  className?: string;
}

export const Reasoning: React.FC<ReasoningProps> = ({
  children,
  isStreaming = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return <div className={cn("w-full mb-4", className)}>{children}</div>;
};

export const ReasoningTrigger: React.FC<{
  label?: string;
  onClick?: () => void;
}> = ({ label = "Thinking", onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 border border-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors w-fit group"
    >
      <div className="relative">
        <Sparkles className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full animate-pulse" />
      </div>
      <span className="text-xs font-medium text-foreground/80">{label}...</span>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
    </div>
  );
};

export const ReasoningContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden mt-2"
    >
      <div className="p-3 pl-4 border-l-2 border-primary/20 bg-muted/20 rounded-r-xl text-xs text-muted-foreground italic leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </motion.div>
  );
};
