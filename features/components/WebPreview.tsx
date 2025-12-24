"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Package, Rocket, Zap } from "lucide-react";
import { useState } from "react";

type ResponsiveMode = "desktop" | "tablet" | "mobile";
type WebContainerState = "booting" | "installing" | "starting" | "ready";

interface WebPreviewProps {
  url: string;
  setUrl: (url: string) => void;
  responsiveMode: ResponsiveMode;
  webPreviewUrl: string | null;
  webContainerPort: number | null;
  reloadKey: number;
}

export default function WebPreview({
  url,
  setUrl,
  responsiveMode,
  webPreviewUrl,
  webContainerPort,
  reloadKey,
}: WebPreviewProps) {
  // Environment status - Mocked
  const [isBootingWebContainer, setIsBootingWebContainer] = useState(false);
  const [isInstallingDependencies, setIsInstallingDependencies] =
    useState(true);
  const [isDevServerRunning, setIsDevServerRunning] = useState(false);

  const getCurrentWebContainerState = (): WebContainerState => {
    if (isBootingWebContainer) return "booting";
    if (isInstallingDependencies) return "installing";
    if (isDevServerRunning && !webPreviewUrl) return "starting";
    if (webPreviewUrl) return "ready";
    return "booting";
  };

  const webContainerState = getCurrentWebContainerState();

  const getStateIcon = (state: WebContainerState) => {
    switch (state) {
      case "booting":
        return <Rocket className="h-12 w-12 text-primary/40" />;
      case "installing":
        return <Package className="h-12 w-12 text-primary/40" />;
      case "starting":
        return <Zap className="h-12 w-12 text-primary/40" />;
      case "ready":
        return <CheckCircle className="h-12 w-12 text-green-500/40" />;
    }
  };

  const getStateTitle = (state: WebContainerState) => {
    switch (state) {
      case "booting":
        return "WebContainer is Booting";
      case "installing":
        return "Installing Dependencies";
      case "starting":
        return "Starting Dev Server";
      case "ready":
        return "Development Server Ready";
    }
  };

  const getStateDescription = (state: WebContainerState) => {
    switch (state) {
      case "booting":
        return "Initializing environment...";
      case "installing":
        return "Downloading project dependencies...";
      case "starting":
        return "Launching the development server...";
      case "ready":
        return "Your preview is ready!";
    }
  };

  const getProgressValue = (state: WebContainerState) => {
    switch (state) {
      case "booting":
        return 25;
      case "installing":
        return 60;
      case "starting":
        return 90;
      case "ready":
        return 100;
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
    if (!webPreviewUrl) return "";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${webPreviewUrl}${cleanPath}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden animate-in fade-in duration-500">
      {!webPreviewUrl ? (
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-muted/10">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative text-center max-w-sm w-full flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 shadow-sm">
              {getStateIcon(webContainerState)}
            </div>

            <div className="space-y-4 w-full">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {getStateTitle(webContainerState)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getStateDescription(webContainerState)}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Progress
                  value={getProgressValue(webContainerState)}
                  className="h-1.5 bg-secondary"
                />
                <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  <span>Progress</span>
                  <span>{getProgressValue(webContainerState)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-border bg-card/50 text-left">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                    Status
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-medium lowercase">
                      {webContainerState}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-border bg-card/50 text-left">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                    Port
                  </span>
                  <span className="text-xs font-mono font-medium">
                    {webContainerPort || "---"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={getContainerStyles()}>
          <div key={reloadKey} className={getIframeStyles()}>
            <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-sm">
              Iframe Preview (URL: {getFullUrl(url)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
