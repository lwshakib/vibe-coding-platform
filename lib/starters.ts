import fs from "fs";
import path from "path";

export function getInitialFiles(
  starterDir: string
): Record<string, { content: string }> {
  const baseDir = path.join(process.cwd(), "features/apps", starterDir);
  const files: Record<string, { content: string }> = {};

  // Files and directories to ignore (similar to .gitignore)
  const ignoredItems = new Set([
    'node_modules',
    '.next',
    '.git',
    'build',
    'out',
    'coverage',
    '.vercel',
    '.DS_Store',
    'generated'
  ]);

  const ignoredExtensions = new Set([
    '.pem',
    '.tsbuildinfo'
  ]);

  const ignoredPatterns = [
    /^\.env/,
    /^npm-debug\.log/,
    /^yarn-debug\.log/,
    /^yarn-error\.log/,
    /^\.pnpm-debug\.log/,
    /package-lock\.json$/,
    /bun\.lock$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/
  ];

  function shouldIgnore(itemName: string): boolean {
    // Check ignored items
    if (ignoredItems.has(itemName)) return true;
    
    // Check ignored extensions
    const ext = path.extname(itemName);
    if (ignoredExtensions.has(ext)) return true;
    
    // Check ignored patterns
    return ignoredPatterns.some(pattern => pattern.test(itemName));
  }

  function traverse(currentDir: string, relativePath: string = "") {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      // Skip ignored items
      if (shouldIgnore(item)) continue;

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
