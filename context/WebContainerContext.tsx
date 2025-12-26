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
    | "error";
  url: string | null;
  port: number | null;
  error: string | null;
  instance: WebContainer | null;
  terminalRef: React.MutableRefObject<Terminal | null>;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(
  undefined
);

export function WebContainerProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspaceStore();
  const terminalRef = useRef<Terminal | null>(null);
  const wc = useWebContainer(currentWorkspace?.files || null, terminalRef);

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
