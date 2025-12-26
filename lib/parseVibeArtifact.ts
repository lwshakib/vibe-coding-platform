interface FileLeaf {
  file: { contents: string };
}
interface DirectoryNode {
  directory: Record<string, FileNode>;
}
type FileNode = FileLeaf | DirectoryNode;

interface FileProgress {
  fullPath: string;
  status: "PROCESSING" | "COMPLETED";
}

export interface ParsedVibeArtifact {
  introduction: string;
  files: {
    title: string;
    files: Record<string, FileNode>;
    flatFiles: Record<string, { content: string }>;
  };
  progress: {
    files: FileProgress[];
  };
  conclusion: string;
}

function isDirectoryNode(node: FileNode): node is DirectoryNode {
  return (node as DirectoryNode).directory !== undefined;
}

export function parseVibeArtifact(input: string): ParsedVibeArtifact {
  const result: ParsedVibeArtifact = {
    introduction: "",
    files: {
      title: "",
      files: {},
      flatFiles: {},
    },
    progress: {
      files: [],
    },
    conclusion: "",
  };

  // Extract introduction (text before <vibeArtifact>)
  const introMatch = input.match(/^[\s\S]*?(?=<vibeArtifact)/);
  result.introduction = introMatch ? introMatch[0].trim() : "";

  // Extract artifact title
  const titleMatch = input.match(/<vibeArtifact[^>]*title="([^"]+)"/);
  const artifactTitle = titleMatch ? titleMatch[1] : "";

  // Extract conclusion (text after </vibeArtifact>)
  const conclusionMatch = input.match(/(?<=<\/vibeArtifact>)[\s\S]*$/);
  const rawConclusion = conclusionMatch ? conclusionMatch[0].trim() : "";
  // If there's no closing tag, there's no conclusion yet
  if (input.includes("</vibeArtifact>")) {
    result.conclusion = rawConclusion;
  } else {
    // If we haven't seen the artifact at all, the whole thing is intro
    if (!input.includes("<vibeArtifact")) {
      result.introduction = input.trim();
    }
    result.conclusion = "";
  }

  result.files.title = artifactTitle;

  const fileProgressMap = new Map<string, FileProgress>();

  // Regex to match vibeAction blocks
  const fileRegex =
    /<vibeAction[^>]*filePath="([^"]+)"[^>]*>([\s\S]*?)(?=<vibeAction|<\/vibeAction>|$)/g;
  let match: RegExpExecArray | null;

  while ((match = fileRegex.exec(input)) !== null) {
    const filePath = match[1];
    let fileContent = match[2];

    const fileStartIndex = match.index;
    const fileEndIndex = fileStartIndex + match[0].length;
    const remainingText = input.substring(fileEndIndex);
    const hasEndTag = remainingText.includes("</vibeAction>");

    const isComplete = hasEndTag && fileContent.length > 0;

    fileProgressMap.set(filePath, {
      fullPath: filePath,
      status: isComplete ? "COMPLETED" : "PROCESSING",
    });

    // Clean up content (remove trailing incomplete tags)
    fileContent = fileContent.replace(/<[^>]*$/, "").trim();

    // Add to flatFiles
    result.files.flatFiles[filePath] = { content: fileContent };

    const parts = filePath.split("/");
    let current: Record<string, FileNode> = result.files.files;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current[part] = { file: { contents: fileContent } };
      } else {
        if (!current[part]) current[part] = { directory: {} };
        let next = current[part];
        if (!isDirectoryNode(next)) {
          next = current[part] = { directory: {} };
        }
        current = next.directory;
      }
    }
  }

  result.progress.files = Array.from(fileProgressMap.values());

  return result;
}
