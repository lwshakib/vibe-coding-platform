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

export async function streamText(messages: Messages, app_type: AppType, files: any) {
  return _streamText({
    model: GeminiModel(),
    system: getFineTunedPrompt(app_type, files),
    maxOutputTokens: 65535,
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
    tools: {
      google_search: google.tools.googleSearch({}),
      url_context: google.tools.urlContext({}),
    },
  });
}
