"use client";

import React, { createContext, useContext, useState } from "react";

interface SingleStackContextType {
  messages: any[];
  setMessages: (messages: any[]) => void;
  onResponseFinish: () => void;
  setOnResponseFinish: (fn: () => void) => void;
  stackDetails: any;
  sendMessage: (content: string) => Promise<void>;
  streamingStatus: "idle" | "streaming" | "finished";
  stopStreaming: () => void;
}

const SingleStackContext = createContext<SingleStackContextType | undefined>(
  undefined
);

export const SingleStackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [streamingStatus, setStreamingStatus] = useState<
    "idle" | "streaming" | "finished"
  >("idle");

  const sendMessage = async (content: string) => {
    const newUserMessage = {
      role: "user",
      parts: [{ type: "text", text: content }],
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Mock response
    setStreamingStatus("streaming");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "This is a mock response to your message: " + content,
            },
          ],
        },
      ]);
      setStreamingStatus("idle");
    }, 1500);
  };

  return (
    <SingleStackContext.Provider
      value={{
        messages,
        setMessages,
        onResponseFinish: () => {},
        setOnResponseFinish: () => {},
        stackDetails: { stack: { name: "Mock Project" } },
        sendMessage,
        streamingStatus,
        stopStreaming: () => setStreamingStatus("idle"),
      }}
    >
      {children}
    </SingleStackContext.Provider>
  );
};

export const useSingleStack = () => {
  const context = useContext(SingleStackContext);
  if (!context) {
    throw new Error("useSingleStack must be used within a SingleStackProvider");
  }
  return context;
};
