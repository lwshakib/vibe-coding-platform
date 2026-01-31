import { getModelName } from "@/llm/model";
import { streamText } from "@/llm/streamText";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { messages, files, workspaceId } = await req.json();

    // Save user message if workspaceId is provided
    if (workspaceId) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role.toLowerCase() === "user") {
        await prisma.message.create({
          data: {
            workspaceId,
            role: "user",
            parts: lastMessage.parts || [
              { type: "text", text: lastMessage.content },
            ],
          },
        });
      }
    }

    const response = await streamText(messages, files, workspaceId);

    return response.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
