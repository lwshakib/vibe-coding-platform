"use client";

import React from "react";

const CodeEditor: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-background/50 animate-in fade-in duration-500">
      <div className="flex-1 flex items-center justify-center border-t border-border">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Editor placeholder</p>
          <p className="text-xs text-muted-foreground/50">
            Ready to edit your code
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
