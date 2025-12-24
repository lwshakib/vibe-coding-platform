"use client";

import React, { useState } from "react";
import AiInput from "./AiInput";

const LeftSideView: React.FC = () => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("My Project");

  const currentName = nameInput;

  const startEditing = () => {
    setIsEditingName(true);
  };

  const submitName = () => {
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden">
      {/* Header with Project Name */}
      <header className="h-14  px-6 flex items-center shrink-0">
        <div className="flex items-center">
          {isEditingName ? (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={submitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitName();
                if (e.key === "Escape") setIsEditingName(false);
              }}
              autoFocus
              className="bg-transparent border-none outline-none p-0 text-foreground text-sm font-medium w-fit focus:ring-0"
              style={{ width: `${Math.max(currentName.length + 1, 5)}ch` }}
            />
          ) : (
            <h2
              className="text-foreground/90 text-sm font-medium cursor-text hover:text-foreground transition-colors"
              onDoubleClick={startEditing}
              title="Double click to rename"
            >
              {currentName}
            </h2>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 min-h-full flex flex-col items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground">
              What do you want to build?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Prompt, run, edit, and deploy full-stack{" "}
              <span className="text-foreground font-medium">web</span> and{" "}
              <span className="text-foreground font-medium">mobile</span> apps.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4">
        <AiInput />
      </div>
    </div>
  );
};

export default LeftSideView;
