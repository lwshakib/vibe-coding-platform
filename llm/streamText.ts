import { GeminiModel } from "./model";
import { getFineTunedPrompt } from "./prompts";
import {
  streamText as _streamText,
  convertToModelMessages,
  ModelMessage,
  UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { AppType } from "@/generated/prisma/enums";

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], "model">;

import prisma from "@/lib/prisma";

export async function streamText(
  messages: Messages,
  files: any,
  workspaceId?: string
) {
  return _streamText({
    model: GeminiModel(),
    system: getFineTunedPrompt(JSON.stringify(files)),
    maxOutputTokens: 65535,
    messages: await convertToModelMessages(
      messages.map((m) => ({
        ...m,
        role: m.role.toLowerCase() as "user" | "assistant",
      })) as unknown as UIMessage[]
    ),
    tools: {
      google_search: google.tools.googleSearch({}),
      url_context: google.tools.urlContext({}),
    },
    onFinish: async ({ text, toolCalls }) => {
      if (workspaceId) {
        try {
          // Save assistant message
          await prisma.message.create({
            data: {
              workspaceId,
              role: "ASSISTANT",
              parts: [{ type: "text", text }] as any,
            },
          });

          // Check for file updates if any tool changed them
          // (This logic might depend on how tools work, but for now we just save the message)
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
    },
  });
}
