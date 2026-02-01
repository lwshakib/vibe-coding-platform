import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GeminiModel } from "./model";

export async function generateCommitMessage(files: any, changedFile?: any) {
  const fileNames = Object.keys(files).join(", ");
  
  let prompt = `
    You are an expert developer. I am about to commit changes to a GitHub repository.
    The following files are in the project:
    ${fileNames}
  `;

  if (changedFile) {
    const changes = Array.isArray(changedFile) ? changedFile : [changedFile];
    
    prompt += `
    The following specific changes were made:
    ${changes.map(c => `
    FILE: "${c.path}"
    PREVIOUS CONTENT:
    ---
    ${(c.oldContent || "").substring(0, 500)}
    ---
    NEW CONTENT:
    ---
    ${(c.newContent || "").substring(0, 500)}
    ---
    `).join('\n')}
    
    Please generate a concise, professional commit message based on these specific changes.
    Example format: "feat: add user authentication" or "fix: resolve layout issue in header".
    `;
  } else {
    prompt += `
    Please generate a generic but professional commit message summarizing a project update.
    `;
  }

  prompt += `
    Return ONLY the commit message text. No quotes, no markdown, no explanation.
  `;

  try {
    const { text } = await generateText({
      model: GeminiModel(),
      prompt: prompt,
    });
    return text.trim() || "update: project files";
  } catch (error) {
    console.error("AI commit message generation failed:", error);
    return "update: project files";
  }
}
