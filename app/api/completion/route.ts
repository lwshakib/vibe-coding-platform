import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getModelName, getSingleApiKey } from "@/llm/model";
import { consumeCredits } from "@/lib/credits";

export async function POST(req: NextRequest) {
  try {
    const userHeader = req.headers.get("x-user");
    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(userHeader);
    const userId = sessionUser.id;

    // Consume credits before generating response
    try {
      await consumeCredits(userId, 100);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Insufficient credits" }, { status: 403 });
    }

    const { prefix, suffix, language, fileName } = await req.json();

    const apiKey = getSingleApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: getModelName(),
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Prefix:\n${prefix}\n---\nSuffix:\n${suffix}\n---\nTarget Completion:`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: `You are an AI code completion assistant.
Your task is to provide the next line or block of code based on the provided prefix and suffix.
Respond ONLY with the code to be inserted at the cursor position. 
DO NOT repeat any part of the prefix or suffix.
Do not include any explanations, markdown formatting (like triple backticks), or other text.
If no completion is appropriate, respond with an empty string.
Language: ${language}
File: ${fileName}`,
        maxOutputTokens: 256,
        temperature: 0.1,
      },
    });

    let completion = (result.text as string) || "";

    // Clean up completion if LLM adds backticks anyway
    if (completion.startsWith("```")) {
      const lines = completion.split("\n");
      if (lines[0].startsWith("```")) lines.shift();
      if (lines[lines.length - 1].startsWith("```")) lines.pop();
      completion = lines.join("\n");
    }

    return NextResponse.json({ completion });
  } catch (error: any) {
    console.error("Completion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
