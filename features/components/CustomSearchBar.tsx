"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, RotateCcw, Lock, Globe, Search, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "motion/react";

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
  files?: any;
}

const extractPathsFromFiles = (files: any): string[] => {
  if (!files) return ["/"];

  const paths = new Set<string>();
  paths.add("/");

  const entries = Object.entries(files);

  entries.forEach(([filePath, fileData]: [string, any]) => {
    // 1. App Router: app/**/page.tsx
    const appMatch = filePath.match(/(?:^|src\/)app\/(.*)\/page\.[jt]sx?$/);
    if (appMatch) {
      const route = "/" + appMatch[1]
        .split('/')
        .filter(part => !part.startsWith('(') && !part.endsWith(')'))
        .join('/');
      paths.add(route.replace(/\/+$/, "") || "/");
    } else if (filePath.match(/(?:^|src\/)app\/page\.[jt]sx?$/)) {
      paths.add("/");
    }

    // 2. Pages Router: pages/**/index.tsx
    const pagesMatch = filePath.match(/(?:^|src\/)pages\/(.*)\.[jt]sx?$/);
    if (pagesMatch) {
      let route = "/" + pagesMatch[1];
      if (!route.includes("_app") && !route.includes("_document") && !route.includes("/api/")) {
        route = route.replace(/\/index$/, "") || "/";
        paths.add(route);
      }
    }

    // 3. Simple content parsing for links
    if (fileData && typeof fileData.content === 'string') {
      const content = fileData.content;
      const hrefRegex = /href=["'](\/[^"'\s>{]+)["']/g;
      const toRegex = /to=["'](\/[^"'\s>{]+)["']/g;

      let match;
      while ((match = hrefRegex.exec(content)) !== null) {
        const p = match[1];
        if (p && !p.includes('.') && !p.startsWith('//') && p.length > 1) {
          paths.add(p);
        }
      }
      while ((match = toRegex.exec(content)) !== null) {
        const p = match[1];
        if (p && !p.includes('.') && !p.startsWith('//') && p.length > 1) {
          paths.add(p);
        }
      }
    }
  });

  return Array.from(paths).sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });
};

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
  files,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [localPort, setLocalPort] = useState(port.toString());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  useEffect(() => {
    setLocalPort(port.toString());
  }, [port]);

  const allPaths = useMemo(() => extractPathsFromFiles(files), [files]);

  const filteredSuggestions = useMemo(() => {
    if (!localValue || localValue === "/") return allPaths;
    const filter = localValue.toLowerCase();
    return allPaths.filter(p => p.toLowerCase().includes(filter));
  }, [allPaths, localValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(localValue);
      onChange(localValue);
      setShowSuggestions(false);
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
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

  const handleSelectPath = (path: string) => {
    setLocalValue(path);
    onChange(path);
    onSubmit(path);
    setShowSuggestions(false);
  };

  // Handle click outside for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
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
      <div className="flex-1 flex items-center h-full px-4 overflow-hidden relative">
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
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              // Delay blur to allow suggestion clicking if not handled by click-outside
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

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-3 py-2 bg-background/98 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="px-3 pb-1 mb-1 border-b border-border/40 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Project Paths
              </span>
              <span className="text-[10px] text-muted-foreground/40">
                {filteredSuggestions.length} found
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {filteredSuggestions.map((path) => (
                <button
                  key={path}
                  onClick={() => handleSelectPath(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted/80 transition-all group relative"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/5 text-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate text-foreground/90 group-hover:text-foreground">
                      {path}
                    </span>
                    {path === "/" && (
                      <span className="text-[10px] text-muted-foreground/60">
                        Home Page
                      </span>
                    )}
                  </div>
                  <ChevronRight className="ml-auto w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary/60 transition-colors" />
                  
                  {path === value && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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