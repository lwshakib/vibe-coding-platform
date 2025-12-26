"use client";

import React, { useState, useRef } from "react";
import { Paperclip, Sparkles, SendHorizontal } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { useWorkspaceStore } from "@/context";

interface AiInputProps {
  onSend: (text: string, files: File[]) => void;
}

const AiInput: React.FC<AiInputProps> = ({ onSend }) => {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspaceStore();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() || files.length > 0) {
      onSend(input, files);
      setInput("");
      setFiles([]);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="py-6 bg-background">
      <div className="mx-auto w-full max-w-lg">
        {/* Token Counter Badge */}
        <div className="relative h-6.5">
          <div className="bg-muted absolute top-0 left-2 flex w-[calc(100%-1rem)] justify-between items-center rounded-t-lg border border-border px-2 py-1 text-xs opacity-100 backdrop-blur transition-opacity duration-350">
            <span className="text-muted-foreground">
              150K daily tokens remaining.
            </span>
            <button className="text-primary font-semibold hover:underline">
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Input Box */}
        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col bg-muted/50 dark:bg-secondary/50 rounded-lg border border-border p-4 shadow-sm backdrop-blur"
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can Vibe help you today?"
            className="mb-4 w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none py-1 scrollbar-hide min-h-24 max-h-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {files.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border"
                >
                  <Paperclip size={12} />
                  <span className="truncate max-w-25">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles(files.filter((_, index) => index !== i))
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto flex gap-4 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={handleFileClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Attach Files"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="AI Tools"
            >
              <Sparkles size={20} />
            </button>

            <button
              type="submit"
              disabled={!input.trim() && files.length === 0}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send Message"
            >
              <SendHorizontal size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiInput;
