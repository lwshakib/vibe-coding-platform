"use client";

import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Search,
  Files,
  FilePlus,
  FolderPlus,
  RefreshCw,
  ListCollapse,
} from "lucide-react";
import { useWorkspaceStore } from "@/context";
import React, { useState, useMemo } from "react";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  isOpen?: boolean;
};

const transformFilesToTree = (files: Record<string, any>): FileNode[] => {
  const root: FileNode[] = [];

  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          id: parts.slice(0, index + 1).join("/"),
          name: part,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(existingNode);
      }

      if (!isFile) {
        currentLevel = existingNode.children!;
      }
    });
  });

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });

    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
};

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (filename === ".gitignore")
    return <span className="text-gray-400 text-[10px] font-bold">git</span>; // Simple placeholder

  switch (ext) {
    case "ts":
    case "tsx":
      return (
        <div className="flex items-center justify-center w-4 h-4 rounded-[2px] bg-blue-500/10 text-blue-500 font-bold text-[8px] leading-none shrink-0">
          TS
        </div>
      );
    case "js":
    case "jsx":
    case "mjs":
      return (
        <div className="flex items-center justify-center w-4 h-4 rounded-[2px] bg-yellow-400/10 text-yellow-400 font-bold text-[8px] leading-none shrink-0">
          JS
        </div>
      );
    case "json":
      return (
        <div className="flex items-center justify-center w-4 h-4 text-yellow-200 font-bold text-[10px] leading-none shrink-0">
          {"{}"}
        </div>
      );
    case "md":
      return (
        <div className="flex items-center justify-center w-4 h-4 text-blue-300 font-bold text-[10px] leading-none shrink-0">
          i
        </div>
      );
    case "css":
      return (
        <div className="flex items-center justify-center w-4 h-4 text-blue-400 font-bold text-[8px] leading-none shrink-0">
          #
        </div>
      );
    default:
      return (
        <FileIcon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      );
  }
};

const FileTreeItem = ({
  node,
  depth = 0,
}: {
  node: FileNode;
  depth?: number;
}) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "group flex items-center gap-1.5 py-0.5 px-2 cursor-pointer hover:bg-[#2a2d2e] text-sm select-none transition-colors min-w-0"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={toggleOpen}
      >
        {/* Indentation guide lines could go here, but simple padding is cleaner for now as per image */}

        <span className="text-muted-foreground shrink-0 flex items-center justify-center w-4">
          {node.type === "folder" &&
            (isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/80" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/80" />
            ))}
        </span>

        {node.type === "file" && getFileIcon(node.name)}

        <span
          className={cn(
            "truncate font-normal",
            node.type === "folder" ? "text-[#cccccc]" : "text-[#cccccc]",
            // Creating slight difference or matching the image style
            node.id === "src" && "text-white"
          )}
        >
          {node.name}
        </span>
      </div>

      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer() {
  const { currentWorkspace } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<"files" | "search">("files");
  const [searchQuery, setSearchQuery] = useState("");

  const files = useMemo(() => {
    if (!currentWorkspace?.files) return [];
    return transformFilesToTree(currentWorkspace.files);
  }, [currentWorkspace?.files]);

  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === "file") {
        result.push(node);
      }
      if (node.children) {
        result = result.concat(flattenFiles(node.children));
      }
    }
    return result;
  };

  const allFiles = useMemo(() => flattenFiles(files), [files]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return allFiles.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allFiles]);

  return (
    <div className="h-full w-full bg-[#18181b] flex flex-col font-sans text-[13px]">
      <div className="flex items-center gap-1 p-2 border-b border-[#2a2d2e] bg-[#18181b]">
        <button
          onClick={() => setActiveTab("files")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition-colors",
            activeTab === "files"
              ? "bg-[#2a2d2e] text-white"
              : "text-muted-foreground hover:bg-[#2a2d2e]/50 hover:text-[#cccccc]"
          )}
        >
          <Files className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition-colors",
            activeTab === "search"
              ? "bg-[#2a2d2e] text-white"
              : "text-muted-foreground hover:bg-[#2a2d2e]/50 hover:text-[#cccccc]"
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "files" ? (
          <>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-[#cccccc] font-medium uppercase tracking-wider hover:text-white cursor-pointer group shrink-0">
              <span className="font-bold">Explorer</span>
              <div className="flex items-center gap-1 transition-opacity">
                <button
                  className="p-0.5 hover:bg-[#3f3f46] rounded text-[#cccccc] hover:text-white transition-colors"
                  title="New File"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
                <button
                  className="p-0.5 hover:bg-[#3f3f46] rounded text-[#cccccc] hover:text-white transition-colors"
                  title="New Folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  className="p-0.5 hover:bg-[#3f3f46] rounded text-[#cccccc] hover:text-white transition-colors"
                  title="Refresh Explorer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-0.5 hover:bg-[#3f3f46] rounded text-[#cccccc] hover:text-white transition-colors"
                  title="Collapse Folders"
                >
                  <ListCollapse className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto overflow-x-hidden">
              {files.map((node) => (
                <FileTreeItem key={node.id} node={node} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  autoFocus
                  className="w-full bg-[#2a2d2e] text-[#cccccc] text-xs pl-8 pr-2 py-1.5 rounded border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto overflow-x-hidden">
              {searchQuery && (
                <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {searchResults.length} results
                </div>
              )}
              {searchResults.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-[#2a2d2e] text-sm select-none"
                >
                  {getFileIcon(file.name)}
                  <span className="text-[#cccccc] truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs ml-auto truncate opacity-50">
                    {/* Simplified path display */}
                    ...
                  </span>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  No matches found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
