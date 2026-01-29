"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, RotateCcw, Lock, Globe, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

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
  onPortChange?: (port: number) => void;
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
  onPortChange,
  disabled,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [localPort, setLocalPort] = useState(port.toString());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  useEffect(() => {
    setLocalPort(port.toString());
  }, [port]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(localValue);
      onChange(localValue);
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPort = parseInt(localPort);
    if (!isNaN(newPort) && newPort > 0 && newPort <= 65535 && onPortChange) {
      onPortChange(newPort);
    }
    setIsPopoverOpen(false);
  };

  return (
    <div
      className={cn(
        "relative flex items-center w-full max-w-4xl h-11 rounded-lg border bg-background/95 backdrop-blur-sm shadow-sm transition-all duration-200",
        isFocused 
          ? "border-primary/60 ring-2 ring-primary/10 shadow-md" 
          : "border-border/60 hover:border-border/80",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Left Area: Port Indicator */}
      <div className="flex items-center shrink-0 h-full pl-3 pr-2 border-r border-border/40">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              disabled={disabled}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all hover:bg-muted/60 active:bg-muted group/port cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title="Click to change port"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-muted-foreground transition-colors group-hover/port:text-foreground">
                :{port}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4" align="start" sideOffset={12}>
            <form onSubmit={handlePortSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="port-input" className="text-xs font-semibold">
                  Development Port
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Valid range: 1-65535
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  id="port-input"
                  type="number"
                  min="1"
                  max="65535"
                  value={localPort}
                  onChange={(e) => setLocalPort(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                  placeholder="3000"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Apply
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {/* Center Area: Editable Path */}
      <div className="flex-1 flex items-center h-full px-4 overflow-hidden">
        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
          <Globe className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isFocused ? "text-primary/70" : "text-muted-foreground/50"
          )} />
          <input
            value={localValue}
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith("/")) {
                val = "/" + val;
              }
              setLocalValue(val);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (!localValue.trim() || localValue === "/") {
                setLocalValue("/");
                onChange("/");
              } else {
                onChange(localValue);
              }
            }}
            disabled={disabled}
            className={cn(
              "flex-1 h-full text-sm bg-transparent border-none focus:outline-none transition-all font-medium",
              isFocused 
                ? "text-foreground placeholder:text-muted-foreground/40" 
                : "text-muted-foreground/80 placeholder:text-muted-foreground/30",
              "disabled:cursor-not-allowed"
            )}
            spellCheck={false}
            autoComplete="off"
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* Right Area: Action Buttons */}
      <div className="flex items-center gap-1 pr-2 shrink-0 h-full border-l border-border/40 pl-2">
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-md"
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
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-md"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}

        {onToggleResponsive && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleResponsive}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-md"
            title="Toggle responsive mode"
          >
            {responsiveIcon}
          </Button>
        )}
      </div>
    </div>
  );
};