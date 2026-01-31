"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LeftSideView from "@/features/components/LeftSideView";
import RightSideView from "@/features/components/RightSideView";
import { useWorkspaceStore } from "@/context";
import { WebContainerProvider } from "@/context/WebContainerContext";

import { ExpoQRDialog } from "@/features/components/ExpoQRDialog";

export default function WorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const { currentWorkspace, setCurrentWorkspace, setMessages } =
    useWorkspaceStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch workspace");
        }
        const data = await response.json();
        if (data.workspace) {
          setCurrentWorkspace(data.workspace);
          if (data.workspace.messages) {
            setMessages(data.workspace.messages);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch workspace:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId, setCurrentWorkspace, setMessages]);

  if (!mounted || loading) return null;

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-foreground bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <WebContainerProvider>
      <div className="w-full h-screen relative flex text-foreground overflow-hidden">
        {/* Left Side: Chat & File Tree */}
        <div className="w-full md:w-112.5 shrink-0">
          <div className="h-full w-full overflow-hidden">
            <LeftSideView />
          </div>
        </div>

        {/* Right Side: Preview/Editor */}
        <div className="flex-1 min-w-0">
          <RightSideView />
        </div>
      </div>
      <ExpoQRDialog />
    </WebContainerProvider>
  );
}
