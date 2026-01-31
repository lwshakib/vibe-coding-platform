"use client";

import React, { createContext, useContext, ReactNode, useRef } from "react";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useWorkspaceStore } from "@/context";
import { Terminal } from "xterm";
import type { WebContainer } from "@webcontainer/api";

interface WebContainerContextType {
  state:
    | "idle"
    | "booting"
    | "mounting"
    | "installing"
    | "starting"
    | "ready"
    | "stopped"
    | "error";
  url: string | null;
  port: number | null;
  error: string | null;
  instance: WebContainer | null;
  terminalRef: React.MutableRefObject<Terminal | null>;
  setPort: (port: number | null) => void;
  setUrl: (url: string | null) => void;
  startDevServer: (wc: WebContainer) => Promise<void>;
  stopDevServer: () => Promise<void>;
  runInstall: (wc: WebContainer) => Promise<void>;
  stopInstall: () => Promise<void>;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(
  undefined
);

export function WebContainerProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace, streamingStatus } = useWorkspaceStore();
  const terminalRef = useRef<Terminal | null>(null);
  const wc = useWebContainer(
    currentWorkspace?.files || null,
    terminalRef,
    streamingStatus === "streaming",
    currentWorkspace?.id
  );

  return (
    <WebContainerContext.Provider value={{ ...wc, terminalRef }}>
      {children}
    </WebContainerContext.Provider>
  );
}

export function useWebContainerContext() {
  const context = useContext(WebContainerContext);
  if (context === undefined) {
    throw new Error(
      "useWebContainerContext must be used within a WebContainerProvider"
    );
  }
  return context;
}
