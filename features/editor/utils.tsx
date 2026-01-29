import { File as FileIcon } from "lucide-react";

export const getFileIcon = (filename: string, isFolder?: boolean) => {
  if (isFolder) return null;

  const ext = filename.split(".").pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    "ts": "typescript",
    "tsx": "react",
    "js": "javascript",
    "jsx": "react",
    "json": "json",
    "md": "markdown",
    "css": "css",
    "html": "html",
    "svg": "svg",
    "png": "image",
    "jpg": "image",
    "jpeg": "image",
    "gif": "image",
    "pdf": "pdf",
    "zip": "zip",
    "gitignore": "git",
    "package.json": "npm",
    "tsconfig.json": "tsconfig",
    "vite.config.ts": "vite",
    "next.config.js": "next",
    "next.config.ts": "next",
    "tailwind.config.js": "javascript",
    "postcss.config.js": "javascript",
    "npm": "npm",
    "yarn.lock": "yarn",
    "bun.lock": "zip", 
    "dockerfile": "docker",
    "yml": "yml",
    "yaml": "yml",
    "prisma": "prisma",
  };

  let iconName = "default";
  
  const lowerName = filename.toLowerCase();
  if (lowerName === "package.json") {
    iconName = "npm";
  } else if (lowerName === ".gitignore") {
    iconName = "git";
  } else if (lowerName === "tsconfig.json") {
    iconName = "tsconfig";
  } else if (ext && iconMap[ext]) {
    iconName = iconMap[ext];
  }

  return (
    <img 
      src={`/seti-icons/${iconName}.svg`} 
      className="w-4 h-4 shrink-0" 
      alt={iconName}
    />
  );
};
