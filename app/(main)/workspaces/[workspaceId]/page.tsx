"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TopView from "@/features/components/TopView";
import LeftSideView from "@/features/components/LeftSideView";
import RightSideView from "@/features/components/RightSideView";

import { SingleStackProvider } from "@/context/SingleStackProvider";

export default function WorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SingleStackProvider>
      <div className="w-full h-screen relative flex flex-col bg-[#0c0c12] text-white">
        {/* Header */}
        <div className="shrink-0">
          <TopView />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex h-full">
            {/* Left Side: Chat & File Tree */}
            <div className="w-full md:w-112.5 shrink-0 border-r border-white/10">
              <div className="h-full w-full overflow-hidden">
                <LeftSideView />
              </div>
            </div>

            {/* Right Side: Preview / Editor */}
            <div className="flex-1 min-w-0 hidden md:block">
              <div className="h-full w-full overflow-hidden">
                <RightSideView />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SingleStackProvider>
  );
}
