import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GeminiModel } from "./model";

export async function analyzeProjectPaths(files: Record<string, any>) {
  const fileList = Object.keys(files).join("\n");
  
  const prompt = `
    You are an expert web developer analyzer. I will provide you with a list of files in a project.
    Your task is to identify all the possible web routes (paths) that this application exposes.
    
    Consider the following project structures:
    - Next.js (App Router): Look for app/**/page.tsx or app/**/route.ts
    - Next.js (Pages Router): Look for pages/**/*.tsx
    - React (Vite): Look for main components, routes defined in App.tsx or similar.
    - Express: Look for app.get(), router.get() in index.js or routes/ files.
    
    Here is the list of files in the project:
    ${fileList}
    
    Return ONLY a JSON array of strings representing the paths (e.g., ["/", "/about", "/dashboard/settings"]).
    Do not include any other text, markdown formatting, or explanation.
    If you cannot determine any paths, return ["/"].
  `;

  try {
    const { text } = await generateText({
      model: GeminiModel(),
      prompt: prompt,
    });

    try {
      // Clean up the response in case the model adds markdown code blocks
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const paths = JSON.parse(cleanedText);
      if (Array.isArray(paths)) {
        // Ensure starting with / and unique
        return Array.from(new Set(paths.map(p => p.startsWith("/") ? p : `/${p}`)));
      }
    } catch (e) {
      console.error("Failed to parse AI response for paths:", text);
    }
  } catch (err) {
    console.error("AI analysis failed:", err);
  }

  return ["/"];
}
