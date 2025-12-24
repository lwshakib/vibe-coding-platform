"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, RotateCcw } from "lucide-react";
import React from "react";

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
  placeholder,
  port,
  disabled,
}) => {
  return (
    <div className="relative flex items-center w-full h-9 group">
      <div className="absolute left-3 flex items-center pointer-events-none z-10 text-muted-foreground/50 select-none">
        /
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit(value)}
        disabled={disabled}
        className="h-9 pl-6 pr-24 text-xs bg-secondary/20 border-border/50 hover:bg-secondary/40 focus:bg-secondary/10 transition-all rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30"
        placeholder={placeholder}
      />

      {/* Action Buttons on the Right */}
      <div className="absolute right-1.5 flex items-center gap-0.5 z-10">
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={disabled}
            className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors rounded-md"
            title="Refresh preview"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}

        {onExternalLink && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExternalLink}
            disabled={disabled}
            className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors rounded-md"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        {onToggleResponsive && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleResponsive}
            disabled={disabled}
            className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors rounded-md"
            title="Toggle responsive mode"
          >
            {responsiveIcon}
          </Button>
        )}
      </div>
    </div>
  );
};
