"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const codeContent = `import React from 'react';
import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Hello World</h1>
      <p className="mb-4 text-muted-foreground">
        Welcome to your new React application.
      </p>
      <Button variant="default">Click me</Button>
    </div>
  );
}
`;

export default function CodeView() {
  const lines = codeContent.split("\n");

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <div className="flex items-center h-9 px-4 border-b border-border bg-muted/20">
        <span className="text-sm text-foreground/80 font-medium">App.tsx</span>
      </div>
      <div className="flex-1 relative font-mono text-sm leading-6 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex min-h-full">
            {/* Line Numbers */}
            <div className="flex flex-col items-end px-3 py-4 text-muted-foreground/50 bg-muted/10 select-none min-w-12 text-right border-r border-border/50">
              {lines.map((_, i) => (
                <div key={i + 1} className="h-6 leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 py-4 px-4 whitespace-pre">
              {lines.map((line, i) => (
                <div key={i} className="h-6 leading-6 text-foreground/90">
                  {line}
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
