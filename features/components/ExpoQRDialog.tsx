"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/context";
import { Smartphone, Download, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ExpoQRDialog: React.FC = () => {
  const { showExpoQR, setShowExpoQR, expoQRData, currentWorkspace } = useWorkspaceStore();

  if (!expoQRData) return null;

  // Use a public QR code API to generate the image
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    expoQRData
  )}`;

  return (
    <Dialog open={showExpoQR} onOpenChange={setShowExpoQR}>
      <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl overflow-hidden p-0">
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => setShowExpoQR(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative overflow-hidden pt-8 pb-6 px-6">
          {/* Background Decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />

          <DialogHeader className="relative items-center text-center space-y-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner shadow-primary/20 animate-in zoom-in-95 duration-500">
              <Smartphone className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {currentWorkspace?.name || "Mobile Preview"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Expo Go Preview Ready
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-8 relative">
            {/* QR Code Section */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-primary/40 to-primary/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-card p-5 rounded-2xl border border-border shadow-2xl flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={qrCodeImageUrl}
                  alt="Expo QR Code"
                  className="w-[220px] h-[220px] rounded-lg"
                  onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                  style={{ opacity: 0, transition: "opacity 0.5s ease-in-out" }}
                />
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="w-full space-y-4 pt-2">
              <div className="flex gap-4 items-start group">
                <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1 pt-0.5">
                  <p className="text-sm font-semibold text-foreground leading-none">Install Expo Go</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Download the app from the App Store or Google Play Store.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <QrCode className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1 pt-0.5">
                  <p className="text-sm font-semibold text-foreground leading-none">Scan QR Code</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Open your camera (iOS) or Expo Go scan tool (Android).
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowExpoQR(false)}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 group transition-all duration-300"
            >
              Done
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-muted/30 px-6 py-3 border-t border-border flex items-center justify-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Protocol: <span className="text-foreground">{expoQRData.split(':')[0]}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            Port: <span className="text-foreground">{expoQRData.split(':').pop()}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
