"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeView from "./CodeView";
import FileExplorer from "./FileExplorer";
import TerminalUI from "./TerminalUI";

export default function CodeEditor() {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
      <ResizablePanel defaultSize={20} minSize={20} maxSize={40}>
        <div className="h-full min-h-0">
          <FileExplorer />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
          <ResizablePanel defaultSize={80} minSize={0} maxSize={100}>
            <div className="h-full min-h-0">
              <CodeView />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={0} maxSize={50}>
            <div className="h-full min-h-0">
              <TerminalUI />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
