"use client";

import { useState, useCallback } from "react";

interface SendMessageOptions {
  body?: object;
  headers?: object;
}

export const useChat = ({
  transportPath = "/api/chat",
  onFinish,
}: {
  transportPath?: string;
  onFinish?: () => void;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<
    "loading" | "streaming" | "error" | "success" | null
  >(null);

  const sendMessage = useCallback(
    ({ message }: { message: string }, options?: SendMessageOptions) => {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setStatus("loading");

      // You can now use options.body and options.headers
      console.log("Body:", options?.body);
      console.log("Headers:", options?.headers);

      onFinish?.();
    },
    [transportPath, onFinish]
  );

  return {
    messages,
    sendMessage,
    status,
    setMessages,
    transportPath,
  };
};
