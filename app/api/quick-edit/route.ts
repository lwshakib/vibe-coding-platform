import { GeminiModel } from "@/llm/model";
import { streamText } from "ai";
import axios from "axios";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { instructions, selectedText, fileName, fullContent, fromLine, toLine } = await req.json();

  const prompt = `
    You are an expert code editor. Your task is to perform a "Quick Edit" on a specific selection of code.
    
    FILE: ${fileName}
    SELECTION (Line ${fromLine} to ${toLine}):
    \`\`\`
    ${selectedText}
    \`\`\`
    
    INSTRUCTIONS: ${instructions}
    
    FULL CONTEXT:
    \`\`\`
    ${fullContent}
    \`\`\`
    
    RESPONSE RULES:
    1. Respond ONLY with the NEW code for the selected area.
    2. Do NOT include any explanations, markdown code blocks, or file headers.
    3. Maintain the same indentation as the surrounding code.
    4. If the instruction implies adding code after or before, include the original selection plus the new code as needed to match the selection replacement logic.
  `;

  const result = await streamText({
    model: GeminiModel(),
    prompt,
    tools: {
      scrape: {
        description: "Scrape content from a URL to get context for editing code.",
        inputSchema: z.object({
          url: z.string().describe("The URL to scrape content from"),
        }),
        execute: async ({ url }) => {
          try {
            const response = await axios.get(url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
              timeout: 10000,
            });
            
            const html = response.data;
            if (typeof html !== "string") return "Error: Response is not a string";

            const text = html
              .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
              .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
              .replace(/<[^>]*>?/gm, " ")
              .replace(/\s+/g, " ")
              .trim();

            return {
              content: text.slice(0, 15000),
              url,
            };
          } catch (error: any) {
            return {
              error: `Failed to scrape ${url}: ${error.message}`,
            };
          }
        },
      },
    },
    maxSteps: 5,
  });

  return result.toTextStreamResponse();
}
