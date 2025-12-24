import fs from "fs";
import path from "path";

export function getInitialFiles(
  starterDir: string
): Record<string, { content: string }> {
  const baseDir = path.join(process.cwd(), "starters", starterDir);
  const files: Record<string, { content: string }> = {};

  function traverse(currentDir: string, relativePath: string = "") {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath, relPath);
      } else {
        // Read file content
        const content = fs.readFileSync(fullPath, "utf-8");
        // Normalize path to use forward slashes for the DB
        const normalizedPath = relPath.replace(/\\/g, "/");
        files[normalizedPath] = { content };
      }
    }
  }

  if (fs.existsSync(baseDir)) {
    traverse(baseDir);
  } else {
    console.error(`Starter directory not found: ${baseDir}`);
  }

  return files;
}
