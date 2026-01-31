"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/context";
import { Smartphone, Download, QrCode, Copy, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ExpoQRDialog: React.FC = () => {
  const { showExpoQR, setShowExpoQR, expoQRData, currentWorkspace } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qrOrigin, setQrOrigin] = useState(0); // For forcing refresh

  useEffect(() => {
    if (showExpoQR) {
      setIsLoading(true);
    }
  }, [showExpoQR, expoQRData]);

  if (!expoQRData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(expoQRData);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Use our local proxy to bypass COEP restrictions
  const qrCodeImageUrl = `/api/qr-proxy?url=${encodeURIComponent(expoQRData)}&t=${qrOrigin}`;

  return (
    <Dialog open={showExpoQR} onOpenChange={setShowExpoQR}>
      <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl overflow-hidden p-0 dark">
        <div className="relative overflow-hidden pt-8 pb-6 px-6">
          {/* Background Decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />

          <DialogHeader className="relative items-center text-center space-y-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner shadow-primary/20 animate-in zoom-in-95 duration-500">
              <Smartphone className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {currentWorkspace?.name || "Mobile Preview"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Expo Go Preview Ready
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6 relative">
            {/* QR Code Section */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-primary/40 to-primary/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white p-4 rounded-2xl border border-border shadow-2xl flex items-center justify-center min-h-[232px] min-w-[232px] group-hover:scale-[1.02] transition-transform duration-500">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded-2xl z-10">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
                <img
                  src={qrCodeImageUrl}
                  alt="Expo QR Code"
                  className={`w-[200px] h-[200px] rounded-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    toast.error("Failed to load QR code. Please try manual copy.");
                  }}
                />
                
                {!isLoading && (
                    <button 
                        onClick={() => setQrOrigin(prev => prev + 1)}
                        className="absolute bottom-2 right-2 p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-black/40"
                        title="Refresh QR Code"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                )}
              </div>
            </div>

            {/* URL & Copy Section */}
            <div className="w-full bg-muted/40 border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-primary/70">Project URL</span>
                    <div className="flex items-center gap-1">
                         <span className="text-[9px] text-muted-foreground bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 font-mono">
                            {expoQRData.length > 30 ? "Long URL" : "Direct Link"}
                         </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 group/input">
                    <div className="flex-1 bg-background/50 border border-border rounded-lg px-2.5 py-2 flex items-center gap-2 overflow-hidden shadow-inner group-focus-within/input:border-primary/30 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <code className="text-[11px] text-foreground font-mono truncate select-all">
                            {expoQRData}
                        </code>
                    </div>
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-9 w-9 shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-all text-foreground"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-emerald-500 animate-in zoom-in" />
                        ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Instruction Steps */}
            <div className="w-full grid grid-cols-2 gap-3 pb-2">
              <div className="bg-muted/20 border border-border/50 rounded-xl p-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors group">
                  <Download className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold leading-none text-foreground">1. Open Expo Go</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Install on iOS/Android</p>
                  </div>
              </div>

              <div className="bg-muted/20 border border-border/50 rounded-xl p-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors group">
                  <QrCode className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold leading-none text-foreground">2. Scan or Paste</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Use camera or link</p>
                  </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowExpoQR(false)}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Done
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-muted/30 px-6 py-3 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Server Online</span>
           </div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Protocol: <span className="text-foreground">{expoQRData.includes("://") ? expoQRData.split("://")[0].toUpperCase() : "HTTPS"}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
