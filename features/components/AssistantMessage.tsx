"use client";
import React, { useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import HtmlContent from "@/components/ui/html-content";
import { useWorkspaceStore } from "@/context";
import { parseVibeArtifact } from "@/lib/parseVibeArtifact";
import { Bot, CheckCircle, Clock, Loader2 } from "lucide-react";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  isStreaming = false,
}) => {
  const { currentWorkspace, updateFiles } = useWorkspaceStore();

  const parsedContent = useMemo(() => parseVibeArtifact(content), [content]);

  // useEffect(() => {
  //   console.log("Parsed Content:", parsedContent);
  // }, [parsedContent]);

  useEffect(() => {
    // Only sync if not streaming and we actually have files
    if (
      !isStreaming &&
      parsedContent.files.files &&
      Object.keys(parsedContent.files.files).length > 0
    ) {
      const mergeFiles = (current: any, incoming: any) => {
        const result = { ...current };
        for (const key in incoming) {
          if (incoming[key].directory) {
            result[key] = {
              directory: mergeFiles(
                current[key]?.directory || {},
                incoming[key].directory
              ),
            };
          } else {
            result[key] = incoming[key];
          }
        }
        return result;
      };

      if (currentWorkspace) {
        const newFiles = mergeFiles(
          currentWorkspace.files || {},
          parsedContent.files.files
        );
        updateFiles(newFiles, true);
      }
    }
  }, [isStreaming, parsedContent.files.files, currentWorkspace]);

  const hasProcessingFiles = parsedContent.progress.files.some(
    (file) => file.status === "PROCESSING"
  );
  const hasFiles = parsedContent.progress.files.length > 0;

  return (
    <div className="flex justify-start mb-6 group animate-in fade-in slide-in-from-left-4 duration-500 min-w-0">
      <div className="flex items-start gap-3 w-full min-w-0">
        <Avatar className="h-9 w-9 shrink-0 border border-secondary/20 shadow-sm ring-1 ring-secondary/10">
          <AvatarImage src="/ai-avatar.png" alt="AI" />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <Bot className="h-4.5 w-4.5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-[90%]">
          {/* Main Content Area */}
          {parsedContent.introduction ||
          hasFiles ||
          (parsedContent.conclusion && !isStreaming) ? (
            <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 shadow-sm backdrop-blur-md">
              <div className="space-y-4">
                {/* Introduction Text */}
                {parsedContent.introduction && (
                  <HtmlContent
                    content={parsedContent.introduction}
                    className="text-sm leading-relaxed prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0"
                  />
                )}

                {/* File Generation Progress */}
                {hasFiles && (
                  <div className="rounded-xl border border-primary/20 bg-background/40 overflow-hidden my-2 shadow-inner">
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="files"
                      className="w-full"
                    >
                      <AccordionItem value="files" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-2.5 px-4 text-xs font-semibold transition-colors hover:bg-muted/30">
                          <div className="flex items-center gap-3 w-full">
                            <div className="relative flex items-center justify-center">
                              {hasProcessingFiles ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </div>
                            <span className="text-foreground/90">
                              {parsedContent.files.title ||
                                "Vibe is working..."}
                            </span>
                            <div className="flex-1" />
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4.5 px-2 bg-primary/10 text-primary border-none font-bold"
                            >
                              {parsedContent.progress.files.length}{" "}
                              {parsedContent.progress.files.length === 1
                                ? "File"
                                : "Files"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-3 pb-3 space-y-1 mt-1">
                            {parsedContent.progress.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg hover:bg-muted/20 transition-colors group/file"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {file.status === "COMPLETED" ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                                  )}
                                  <span className="text-muted-foreground font-mono truncate text-[11px] group-hover/file:text-foreground transition-colors">
                                    {file.fullPath}
                                  </span>
                                </div>
                                {file.status !== "COMPLETED" && (
                                  <span className="text-[10px] text-primary/70 font-medium animate-pulse shrink-0 ml-4">
                                    Writing...
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* Conclusion Text */}
                {parsedContent.conclusion && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-700">
                    <HtmlContent
                      content={parsedContent.conclusion}
                      className="text-sm leading-relaxed border-t border-border/20 pt-4"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Fallback for plain text messages OR initial state */
            <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 shadow-sm backdrop-blur-md">
              <div className="flex flex-col gap-2">
                {isStreaming && content === "" && (
                  <div className="flex gap-1.5 p-1">
                    <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce"></div>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm prose-invert max-w-none wrap-break-word">
                  {content}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;
