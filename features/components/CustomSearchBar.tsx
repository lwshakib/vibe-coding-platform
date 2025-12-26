"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, RotateCcw, Lock, Globe, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CustomSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onRefresh?: () => void;
  onExternalLink?: () => void;
  onToggleResponsive?: () => void;
  responsiveIcon?: React.ReactNode;
  placeholder?: string;
  port?: number;
  disabled?: boolean;
}

export const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onRefresh,
  onExternalLink,
  onToggleResponsive,
  responsiveIcon,
  placeholder = "Search or enter path...",
  port = 3000,
  disabled,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(localValue);
      onChange(localValue);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center w-full max-w-xl h-10 group transition-all duration-300"
      )}
    >
      {/* Background with Glow */}
      <div
        className={cn(
          "absolute inset-0 bg-background/50 backdrop-blur-md rounded-xl border transition-all duration-300",
          isFocused
            ? "border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
            : "border-border/50 shadow-sm"
        )}
      />



      {/* Editable Path Input */}
      <div className="flex-1 relative z-10 flex items-center min-w-0 w-20" >
        <Input
          value={localValue}
          onChange={(e) => {
            let val = e.target.value;
            // Ensure path always starts with / for better UX, but allow empty for editing
            setLocalValue(val);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // If empty on blur, reset to /
            if (!localValue.trim()) {
              setLocalValue("/");
              onChange("/");
            }
          }}
          disabled={disabled}
          className={cn(
            "h-10 w-full px-1.5 text-sm bg-transparent border-none  focus-visible:ring-0 focus-visible:ring-offset-0 transition-all font-medium",
            isFocused ? "text-foreground" : "text-muted-foreground"
          )}
          placeholder="/"
        />
      </div>

      {/* Action Buttons on the Right */}
      <div className="relative flex items-center gap-1 pr-2 shrink-0 z-10">
        <div className="h-4 w-px bg-border/50 mx-1" />

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={disabled}
            className="h-7 w-7 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
            title="Refresh preview"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}

        {onExternalLink && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExternalLink}
            disabled={disabled}
            className="h-7 w-7 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}

        {onToggleResponsive && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleResponsive}
            disabled={disabled}
            className="h-7 w-7 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
            title="Toggle responsive mode"
          >
            {responsiveIcon}
          </Button>
        )}
      </div>
    </div>
  );
};
