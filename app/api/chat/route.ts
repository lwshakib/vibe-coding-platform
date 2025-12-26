import { getModelName } from "@/llm/model";
import { streamText } from "@/llm/streamText";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, files, app_type } = await req.json();

    const response = await streamText(messages, app_type, files);

    return response.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
