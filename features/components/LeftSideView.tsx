"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/context";
import AiInput from "./AiInput";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import { useChat } from "@ai-sdk/react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { parseVibeArtifact } from "@/lib/parseVibeArtifact";
import { LogoIcon } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

const LeftSideView: React.FC = () => {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: session } = authClient.useSession();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    setMessages: setChatMessages,
    status,
  } = useChat({});

  const { updateFiles, setStreamingStatus, setPendingPreviewRoute, selectedContexts, removeSelectedContext } =
    useWorkspaceStore();

  // Sync messages when workspace changes (e.g. navigating between workspaces)
  useEffect(() => {
    if (currentWorkspace?.messages) {
      setChatMessages(currentWorkspace.messages as any);
    }
  }, [currentWorkspace?.id, setChatMessages]);

  useEffect(() => {
    setStreamingStatus(
      status === "streaming" || status === "submitted" ? "streaming" : "idle"
    );
  }, [status, setStreamingStatus]);

  // Parse artifacts from streaming messages and update workspace files
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const content = getMessageText(lastMessage);
      if (content.includes("<vibeArtifact")) {
        const parsed = parseVibeArtifact(content);
        const artifactFiles = parsed.files.flatFiles;

        if (parsed.activeRoute) {
          setPendingPreviewRoute(parsed.activeRoute);
        }

        if (artifactFiles && Object.keys(artifactFiles).length > 0) {
          const currentFiles = currentWorkspace?.files || {};
          const mergedFiles = { ...currentFiles, ...artifactFiles };
          updateFiles(mergedFiles);
        }
      }
    }
  }, [messages, updateFiles, setPendingPreviewRoute]);

  const currentName = currentWorkspace?.name || nameInput || "My Project";

  const startEditing = () => {
    setIsEditingName(true);
  };

  const submitName = () => {
    setIsEditingName(false);
  };

  // Helper to extract text from UIMessage parts
  const getMessageText = (m: any) => {
    if (m.content) return m.content;
    if (m.parts && Array.isArray(m.parts)) {
      return m.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
    }
    return "";
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden border-r border-border/40 font-inter">
      {/* Header with Project Name */}
      <header className="h-14 px-4 flex items-center shrink-0 border-b border-border/10 bg-background/50 backdrop-blur-md z-10 transition-all">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/workspaces")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-px h-4 bg-border/20 mx-1" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(158,127,255,0.6)] animate-pulse" />
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
                className="text-foreground/90 text-sm font-medium cursor-text hover:text-foreground transition-colors line-clamp-1"
                onDoubleClick={startEditing}
                title="Double click to rename"
              >
                {currentName}
              </h2>
            )}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth [scrollbar-gutter:stable]"
      >
        <div className="p-2 pr-4 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="text-center max-w-md px-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/20">
                  <LogoIcon size={32} className="rotate-12 text-primary drop-shadow-sm" />
                </div>
                <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  What do you <span className="text-primary italic">want</span>{" "}
                  to build?
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Prompt, run, edit, and deploy full-stack{" "}
                  <span className="text-foreground font-medium">web</span> and{" "}
                  <span className="text-foreground font-medium">mobile</span>{" "}
                  apps.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-4 w-full max-w-2xl mx-auto">
              {messages.map((m, idx) =>
                m.role === "user" ? (
                  <UserMessage
                    key={m.id || idx}
                    content={getMessageText(m)}
                    user={session?.user}
                  />
                ) : (
                  <AssistantMessage
                    key={m.id || idx}
                    content={getMessageText(m)}
                    isStreaming={idx === messages.length - 1}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-2 bg-linear-to-t from-background via-background to-transparent">
        <AiInput
          onSend={async (text, files) => {
            // Helper to convert file to base64
            const toBase64 = (file: File): Promise<string> =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
              });

            const processedFiles = await Promise.all(
              files.map(async (file) => ({
                type: "file" as const,
                mediaType: file.type,
                filename: file.name,
                data: (await toBase64(file)).split(",")[1],
              }))
            );

            // Build the message with selected contexts
            let fullText = text.trim();
            if (selectedContexts.length > 0) {
              const contextBlock = selectedContexts
                .map((ctx) => {
                  const ext = ctx.path.split('.').pop() || 'text';
                  return `Selected code from \`${ctx.path}\` (lines ${ctx.fromLine}-${ctx.toLine}):\n\`\`\`${ext}\n${ctx.content}\n\`\`\``;
                })
                .join('\n\n');
              fullText = fullText ? `${contextBlock}\n\n${fullText}` : contextBlock;
            }

            sendMessage(
              {
                text: fullText,
                files: processedFiles as any,
              },
              {
                body: {
                  files: currentWorkspace?.files,
                  workspaceId: currentWorkspace?.id,
                },
              }
            );

            // Clear selected contexts after sending
            selectedContexts.forEach((ctx) => removeSelectedContext(ctx.id));
          }}
        />
      </div>
    </div>
  );
};

export default LeftSideView;
