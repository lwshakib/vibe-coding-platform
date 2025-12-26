"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Package, Rocket, Zap, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useWebContainerContext } from "@/context/WebContainerContext";
import { useWorkspaceStore } from "@/context";

type ResponsiveMode = "desktop" | "tablet" | "mobile";

interface WebPreviewProps {
  url: string;
  setUrl: (url: string) => void;
  responsiveMode: ResponsiveMode;
  reloadKey: number;
}

export default function WebPreview({
  url,
  setUrl,
  responsiveMode,
  reloadKey,
}: WebPreviewProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { state, url: webPreviewUrl, error } = useWebContainerContext();

  const getStateIcon = (state: string) => {
    switch (state) {
      case "booting":
        return <Rocket className="h-12 w-12 text-primary/40 animate-pulse" />;
      case "mounting":
        return <Rocket className="h-12 w-12 text-blue-400/40" />;
      case "installing":
        return <Package className="h-12 w-12 text-primary/40 animate-bounce" />;
      case "starting":
        return <Zap className="h-12 w-12 text-primary/40 animate-pulse" />;
      case "ready":
        return <CheckCircle className="h-12 w-12 text-green-500/40" />;
      case "error":
        return <AlertCircle className="h-12 w-12 text-destructive/40" />;
      default:
        return <Rocket className="h-12 w-12 text-primary/40" />;
    }
  };

  const getStateTitle = (state: string) => {
    switch (state) {
      case "booting":
        return "Booting System";
      case "mounting":
        return "Mounting Files";
      case "installing":
        return "Installing Dependencies";
      case "starting":
        return "Starting Dev Server";
      case "ready":
        return "Preview Ready";
      case "error":
        return "System Error";
      default:
        return "Initializing...";
    }
  };

  const getStateDescription = (state: string) => {
    switch (state) {
      case "booting":
        return "Initializing in-browser Node.js environment...";
      case "mounting":
        return "Transferring project files...";
      case "installing":
        return "Installing project dependencies (npm install)...";
      case "starting":
        return "Launching your application server...";
      case "ready":
        return "Your live preview is active!";
      case "error":
        return error || "An unexpected error occurred.";
      default:
        return "Please wait...";
    }
  };

  const getProgressValue = (state: string) => {
    switch (state) {
      case "idle":
        return 0;
      case "booting":
        return 15;
      case "mounting":
        return 30;
      case "installing":
        return 60;
      case "starting":
        return 90;
      case "ready":
        return 100;
      case "error":
        return 100;
      default:
        return 0;
    }
  };

  const getIframeStyles = () => {
    switch (responsiveMode) {
      case "desktop":
        return "w-full h-full border-none";
      case "tablet":
        return "w-full max-w-[820px] h-full mx-auto border border-border rounded-lg shadow-2xl bg-white transition-all duration-300";
      case "mobile":
        return "w-full max-w-[320px] h-full mx-auto border border-border rounded-lg shadow-2xl bg-white transition-all duration-300";
    }
  };

  const getContainerStyles = () => {
    switch (responsiveMode) {
      case "desktop":
        return "flex-1 bg-white overflow-hidden";
      case "tablet":
      case "mobile":
        return "flex-1 bg-muted/30 flex items-center justify-center p-4 md:p-8 overflow-auto transition-colors duration-300";
    }
  };

  const getFullUrl = (path: string) => {
    if (!webPreviewUrl) return "about:blank";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${webPreviewUrl}${cleanPath}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      {state !== "ready" || !webPreviewUrl ? (
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-muted/10">
          <div className="relative text-center max-w-sm w-full flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700">
            <div
              className={`mb-8 p-6 rounded-3xl ${
                state === "error" ? "bg-destructive/5" : "bg-primary/5"
              } border border-primary/10 shadow-sm`}
            >
              {getStateIcon(state)}
            </div>

            <div className="space-y-4 w-full">
              <div className="space-y-1">
                <h3
                  className={`text-lg font-semibold tracking-tight ${
                    state === "error" ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {getStateTitle(state)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getStateDescription(state)}
                </p>
              </div>

              {state !== "error" && (
                <div className="space-y-3 pt-2">
                  <Progress
                    value={getProgressValue(state)}
                    className="h-1.5 bg-secondary"
                  />
                  <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    <span>Progress</span>
                    <span>{getProgressValue(state)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={getContainerStyles()}>
          <iframe
            key={reloadKey}
            src={getFullUrl(url)}
            className={getIframeStyles()}
            title="Project Preview"
            allow="cross-origin-isolated"
          />
        </div>
      )}
    </div>
  );
}
