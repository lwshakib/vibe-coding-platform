"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LeftSideView from "@/features/components/LeftSideView";
import RightSideView from "@/features/components/RightSideView";

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
    <div className="w-full h-screen relative flex text-white overflow-hidden">
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
  );
}
