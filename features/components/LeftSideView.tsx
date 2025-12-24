"use client";

import AiInput from "./AiInput";
import { useSingleStack } from "@/context/SingleStackProvider";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import AssistantMessage from "./AssistantMessage";
import UserMessage from "./UserMessage";
// Using loose types here to avoid deep UIMessage generics from @ai-sdk/react

const MessageSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* User message skeleton */}
    <div className="flex justify-end mb-4">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="flex flex-col items-end">
          <div className="bg-secondary rounded-lg p-3 w-48">
            <div className="h-4 bg-muted-foreground/30 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-8 w-8 bg-secondary rounded-full animate-pulse"></div>
      </div>
    </div>

    {/* Assistant message skeleton */}
    <div className="flex justify-start mb-4">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="h-8 w-8 bg-secondary rounded-full animate-pulse"></div>
        <div className="flex flex-col">
          <div className="bg-secondary rounded-lg p-3 w-64">
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/30 rounded animate-pulse"></div>
              <div className="h-4 bg-muted-foreground/30 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted-foreground/30 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Another user message skeleton */}
    <div className="flex justify-end mb-4">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="flex flex-col items-end">
          <div className="bg-secondary rounded-lg p-3 w-32">
            <div className="h-4 bg-muted-foreground/30 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-8 w-8 bg-secondary rounded-full animate-pulse"></div>
      </div>
    </div>

    {/* Another assistant message skeleton */}
    <div className="flex justify-start mb-4">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="h-8 w-8 bg-secondary rounded-full animate-pulse"></div>
        <div className="flex flex-col">
          <div className="bg-secondary rounded-lg p-3 w-56">
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/30 rounded animate-pulse"></div>
              <div className="h-4 bg-muted-foreground/30 rounded w-4/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LeftSideView: React.FC = () => {
  const params = useParams();
  const {
    messages,
    setMessages,
    onResponseFinish,
    setOnResponseFinish,
    stackDetails,
    sendMessage,
    streamingStatus,
    stopStreaming,
  } = useSingleStack();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: previousMessages, isLoading: messagesLoading } =
    trpc.getMessages.useQuery({
      stackId: params?.id as string,
    });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (previousMessages && previousMessages.data.length > 0) {
      setMessages(previousMessages.data);
    }
  }, [previousMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const hasMessages = messages && messages.length > 0;

  return (
    <div className="flex flex-col w-full h-full bg-background">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 min-h-full flex flex-col">
          {messagesLoading ? (
            <MessageSkeleton />
          ) : hasMessages ? (
            messages.map((message: any, index: number) => {
              if (message.role === "user") {
                const userText =
                  message.parts.find((p: any) => p.type === "text")?.text ?? "";
                return <UserMessage key={index} content={userText} />;
              }
              const reasoningText = message.parts.find(
                (p: any) => p.type === "reasoning"
              )?.text;
              const contentText = message.parts
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("\n\n");
              return (
                <AssistantMessage
                  key={index}
                  content={contentText}
                  lastMessage={index === messages.length - 1}
                  reasoningText={reasoningText}
                  isStreaming={streamingStatus === "streaming"}
                />
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
              <div className="text-center max-w-md">
                <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground">
                  What do you want to build?
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Prompt, run, edit, and deploy full-stack{" "}
                  <span className="text-foreground font-medium">web</span> and{" "}
                  <span className="text-foreground font-medium">mobile</span>{" "}
                  apps.
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="shrink-0 px-4">
        <AiInput
          stackDetails={stackDetails}
          sendMessage={sendMessage}
          stopStreaming={stopStreaming}
          streamingStatus={streamingStatus}
        />
      </div>
    </div>
  );
};

export default LeftSideView;
