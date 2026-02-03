import { generateObject } from "ai";
import { z } from "zod";
import { GeminiModel } from "./model";

/**
 * Analyzes project files to identify web routes/paths.
 * Uses file contents to trace complex routing (e.g., Express router mounts).
 */
export async function analyzeProjectPaths(files: Record<string, { content: string } | string>) {
  // Filter for relevant files to avoid overwhelming the model with assets/configs
  const relevantExtensions = [".js", ".ts", ".jsx", ".tsx", ".yaml", ".yml", ".json"];
  const fileDetails = Object.entries(files)
    .filter(([path]) => relevantExtensions.some(ext => path.endsWith(ext)) && !path.includes("node_modules"))
    .map(([path, file]) => `File: ${path}\nContent:\n${typeof file === 'string' ? file : file.content}\n---`)
    .join("\n");
  
  const prompt = `
    You are an expert web developer analyzer. I will provide you with a list of files and their contents from a project.
    Your task is to identify all possible web routes (paths) that this application exposes for a preview.
    
    ANALYSIS GUIDELINES:
    1. Express.js: Trace router chain. If app.js mounts \`app.use('/api', apiRouter)\` and apiRouter mounts \`router.use('/users', userRouters)\`, the path is \`/api/users\`.
    2. Next.js (App Router): \`app/dashboard/page.tsx\` -> \`/dashboard\`. \`app/api/hello/route.ts\` -> \`/api/hello\`.
    3. Next.js (Pages Router): \`pages/about.tsx\` -> \`/about\`. \`pages/index.tsx\` -> \`/\`.
    4. React Router: Look for \`<Route path="/profile" ... />\` and similar definitions.
    
    PROJECT FILES:
    ${fileDetails}
    
    Identify all unique routes. Always include "/" if it's a web app.
    Return the paths in a structured object.
  `;

  try {
    const { object } = await generateObject({
      model: GeminiModel(),
      schema: z.object({
        paths: z.array(z.string().describe("A web route path, starting with /")),
      }),
      prompt: prompt,
    });

    if (object.paths && Array.isArray(object.paths)) {
      const sanitizedPaths = Array.from(new Set(
        object.paths
          .map(p => {
            let clean = p.trim().split("?")[0].split("#")[0]; // Remove query/hash
            if (!clean.startsWith("/")) clean = "/" + clean;
            return clean;
          })
          .filter(p => p !== "/favicon.ico" && !p.includes("*"))
      ));
      
      return sanitizedPaths.length > 0 ? sanitizedPaths : ["/"];
    }
  } catch (err) {
    console.error("AI path analysis failed:", err);
  }

  return ["/"];
}

