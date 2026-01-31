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
  Scissors,
  Copy,
  FileText,
  Link,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useWorkspaceStore } from "@/context";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { getFileIcon } from "./utils";
import { useWebContainerContext } from "@/context/WebContainerContext";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  isOpen?: boolean;
};

type ClipboardItem = {
  type: "cut" | "copy";
  path: string;
};

const transformFilesToTree = (files: Record<string, any>): FileNode[] => {
  const root: FileNode[] = [];

  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;
    const isKeepFile = parts[parts.length - 1] === ".keep";

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      
      // We skip the actual .keep file node, but we don't skip the iterations for its parents
      if (isLastPart && isKeepFile) return;

      const isFile = isLastPart;
      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          id: parts.slice(0, index + 1).join("/"),
          name: part,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(existingNode);
      } else if (!isFile && existingNode.type === "file") {
        // Upgrade file to folder if it's acting as a directory in a subsequent path
        existingNode.type = "folder";
        existingNode.children = [];
      }

      if (existingNode.type === "folder") {
        currentLevel = existingNode.children || [];
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

const FileTreeItem = ({
  node,
  depth = 0,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
  onCopyRelativePath,
  onCut,
  onCopy,
  onPaste,
  renamingPath,
  newItemName,
  setNewItemName,
  onRenameSubmit,
  setRenamingPath,
  clipboard,
  onFileClick,
}: {
  node: FileNode;
  depth?: number;
  onNewFile: (parentId: string) => void;
  onNewFolder: (parentId: string) => void;
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  onCopyPath: (path: string) => void;
  onCopyRelativePath: (path: string) => void;
  onCut: (path: string) => void;
  onCopy: (path: string) => void;
  onPaste: (parentId: string) => void;
  renamingPath: string | null;
  newItemName: string;
  setNewItemName: (name: string) => void;
  onRenameSubmit: () => void;
  setRenamingPath: (path: string | null) => void;
  clipboard: ClipboardItem | null;
  onFileClick: (path: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (renamingPath === node.id && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select filename without extension if possible, or just all
          const lastDot = node.name.lastIndexOf(".");
          if (lastDot > 0 && node.type === "file") {
            inputRef.current.setSelectionRange(0, lastDot);
          } else {
            inputRef.current.select();
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [renamingPath, node.id, node.name, node.type]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="relative">
          <div
            className={cn(
              "group flex items-center gap-2 py-0.5 px-2 cursor-pointer hover:bg-accent text-sm select-none transition-colors min-w-0"
            )}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={(e) => {
              toggleOpen(e);
              if (node.type === "file") onFileClick(node.id);
            }}
          >
            <span className="text-muted-foreground shrink-0 flex items-center justify-center w-4 h-4">
              {node.type === "folder" ? (
                isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/80" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/80" />
                )
              ) : (
                getFileIcon(node.name)
              )}
            </span>

            {renamingPath === node.id ? (
              <div className="flex-1 bg-background border-[0.5px] border-primary px-1 ml-1 rounded-none">
                <input
                  ref={inputRef}
                  className="w-full bg-transparent border-none outline-none text-foreground text-sm p-0 focus:ring-0"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameSubmit();
                    if (e.key === "Escape") setRenamingPath(null);
                  }}
                  onBlur={() => setRenamingPath(null)}
                />
              </div>
            ) : (
              <span
                className={cn(
                  "truncate font-normal",
                  node.type === "folder"
                    ? "text-muted-foreground"
                    : "text-muted-foreground",
                  node.id === "src" && "text-foreground"
                )}
              >
                {node.name}
              </span>
            )}
          </div>

          {isOpen && node.children && (
            <div>
              {node.children.map((child) => (
                <FileTreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  onNewFile={onNewFile}
                  onNewFolder={onNewFolder}
                  onRename={onRename}
                  onDelete={onDelete}
                  onCopyPath={onCopyPath}
                  onCopyRelativePath={onCopyRelativePath}
                  onCut={onCut}
                  onCopy={onCopy}
                  onPaste={onPaste}
                  renamingPath={renamingPath}
                  newItemName={newItemName}
                  setNewItemName={setNewItemName}
                  onRenameSubmit={onRenameSubmit}
                  setRenamingPath={setRenamingPath}
                  clipboard={clipboard}
                  onFileClick={onFileClick}
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-popover border-border text-popover-foreground">
        <ContextMenuItem
          onClick={() =>
            onNewFile(
              node.type === "folder"
                ? node.id
                : node.id.split("/").slice(0, -1).join("/")
            )
          }
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <FilePlus className="w-4 h-4 mr-2" />
          <span>New File</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            onNewFolder(
              node.type === "folder"
                ? node.id
                : node.id.split("/").slice(0, -1).join("/")
            )
          }
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          <span>New Folder</span>
        </ContextMenuItem>
        <ContextMenuSeparator className="border-border" />
        {clipboard && node.type === "folder" && (
          <>
            <ContextMenuItem
              onClick={() => onPaste(node.id)}
              className="focus:bg-accent focus:text-accent-foreground"
            >
              <FilePlus className="w-4 h-4 mr-2 rotate-180" />
              <span>Paste</span>
            </ContextMenuItem>
            <ContextMenuSeparator className="border-border" />
          </>
        )}
        <ContextMenuItem
          onClick={() => onCut(node.id)}
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <Scissors className="w-4 h-4 mr-2" />
          <span>Cut</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onCopy(node.id)}
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <Copy className="w-4 h-4 mr-2" />
          <span>Copy</span>
        </ContextMenuItem>
        <ContextMenuSeparator className="border-border" />
        <ContextMenuItem
          onClick={() => onCopyPath(node.id)}
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <FileText className="w-4 h-4 mr-2" />
          <span>Copy Path</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onCopyRelativePath(node.id)}
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <Link className="w-4 h-4 mr-2" />
          <span>Copy Relative Path</span>
        </ContextMenuItem>
        <ContextMenuSeparator className="border-border" />
        <ContextMenuItem
          onClick={() => onRename(node.id)}
          className="focus:bg-accent focus:text-accent-foreground"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onDelete(node.id)}
          className="focus:bg-accent focus:text-destructive text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default function FileExplorer() {
  const {
    currentWorkspace,
    updateFiles,
    activeFile,
    setActiveFile,
    addOpenFile,
    openFiles,
    setOpenFiles,
  } = useWorkspaceStore();
  const { instance } = useWebContainerContext();
  const [activeTab, setActiveTab] = useState<"files" | "search">("files");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const createInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isCreating && createInputRef.current) {
      const timer = setTimeout(() => {
        createInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isCreating]);

  React.useEffect(() => {
    if (activeTab === "search" && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const files = useMemo(() => {
    if (!currentWorkspace?.files) return [];
    return transformFilesToTree(currentWorkspace.files);
  }, [currentWorkspace?.files]);

  const folders = useMemo(
    () => files.filter((f) => f.type === "folder"),
    [files]
  );
  const rootFiles = useMemo(
    () => files.filter((f) => f.type === "file"),
    [files]
  );

  const handleCreateSubmit = async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName || !currentWorkspace) {
      setIsCreating(null);
      setParentPath(null);
      setNewItemName("");
      return;
    }

    const newFiles = { ...currentWorkspace.files };
    const fullPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    if (isCreating === "file") {
      newFiles[fullPath] = { content: "" };
    } else {
      newFiles[`${fullPath}/.keep`] = { content: "" };
    }

    await updateFiles(newFiles, true);
    if (isCreating === "file") {
      addOpenFile(fullPath);
    }
    setIsCreating(null);
    setParentPath(null);
    setNewItemName("");
  };

  const handleRenameSubmit = async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName || !currentWorkspace || !renamingPath) {
      setRenamingPath(null);
      setNewItemName("");
      return;
    }

    const newFiles = { ...currentWorkspace.files };
    const pathParts = renamingPath.split("/");
    const oldName = pathParts[pathParts.length - 1];
    if (trimmedName === oldName) {
      setRenamingPath(null);
      setNewItemName("");
      return;
    }
    pathParts[pathParts.length - 1] = trimmedName;
    const newPath = pathParts.join("/");

    // Prevent overwriting existing files
    if (newFiles[newPath]) {
      alert("A file or folder with this name already exists.");
      setRenamingPath(null);
      setNewItemName("");
      return;
    }

    Object.keys(newFiles).forEach((path) => {
      if (path === renamingPath) {
        newFiles[newPath] = newFiles[path];
        delete newFiles[path];
      } else if (path.startsWith(`${renamingPath}/`)) {
        const updatedPath = path.replace(renamingPath, newPath);
        newFiles[updatedPath] = newFiles[path];
        delete newFiles[path];
      }
    });

    if (activeFile === renamingPath) {
      setActiveFile(newPath);
    } else if (activeFile?.startsWith(`${renamingPath}/`)) {
      setActiveFile(activeFile.replace(renamingPath, newPath));
    }

    // Sync openFiles
    const updatedOpenFiles = openFiles.map((path) => {
      if (path === renamingPath) return newPath;
      if (path.startsWith(`${renamingPath}/`)) {
        return path.replace(renamingPath, newPath);
      }
      return path;
    });
    setOpenFiles(updatedOpenFiles);

    await updateFiles(newFiles, true);
    setRenamingPath(null);
    setNewItemName("");
  };

  const handlePaste = async (targetDir: string) => {
    if (!clipboard || !currentWorkspace) return;

    const newFiles = { ...currentWorkspace.files };
    const sourcePath = clipboard.path;
    const sourceName = sourcePath.split("/").pop()!;
    const targetPath = targetDir ? `${targetDir}/${sourceName}` : sourceName;

    if (newFiles[sourcePath]) {
      newFiles[targetPath] = JSON.parse(JSON.stringify(newFiles[sourcePath]));
    }

    Object.keys(newFiles).forEach((p) => {
      if (p.startsWith(`${sourcePath}/`)) {
        const relativePath = p.replace(sourcePath, "");
        const newPath = `${targetPath}${relativePath}`;
        newFiles[newPath] = JSON.parse(JSON.stringify(newFiles[p]));
      }
    });

    if (clipboard.type === "cut") {
      Object.keys(newFiles).forEach((p) => {
        if (p === sourcePath || p.startsWith(`${sourcePath}/`)) {
          if (!p.startsWith(targetPath)) {
            delete newFiles[p];
          }
        }
      });
      setClipboard(null);
    }

    await updateFiles(newFiles, true);
  };

  const handleDelete = async (path: string) => {
    if (!currentWorkspace) return;
    const newFiles = { ...currentWorkspace.files };

    Object.keys(newFiles).forEach((p) => {
      if (p === path || p.startsWith(`${path}/`)) {
        delete newFiles[p];
      }
    });

    if (activeFile === path || activeFile?.startsWith(`${path}/`)) {
      setActiveFile(null);
    }

    // Sync openFiles
    const updatedOpenFiles = openFiles.filter(
      (p) => p !== path && !p.startsWith(`${path}/`)
    );
    setOpenFiles(updatedOpenFiles);

    await updateFiles(newFiles, true);

    // Sync deletion to WebContainer
    if (instance) {
      try {
        await instance.fs.rm(`project/${path}`, { recursive: true });
      } catch (e) {
        // Already deleted or not found
      }
    }
  };

  const handleCopy = (path: string) => {
    setClipboard({ type: "copy", path });
  };

  const handleCut = (path: string) => {
    setClipboard({ type: "cut", path });
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

  const handleCopyRelativePath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

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
    <div className="h-full w-full bg-background flex flex-col font-sans text-[13px]">
      <div className="flex items-center gap-1 p-2 border-b border-border bg-background">
        <button
          onClick={() => setActiveTab("files")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition-colors",
            activeTab === "files"
              ? "bg-secondary-foreground/10 text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary-foreground/5 hover:text-secondary-foreground"
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
              ? "bg-secondary-foreground/10 text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary-foreground/5 hover:text-secondary-foreground"
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "files" ? (
          <ContextMenu>
            <ContextMenuTrigger className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider hover:text-foreground cursor-pointer group shrink-0">
                <span className="font-bold">Explorer</span>
                <div className="flex items-center gap-1 transition-opacity">
                  <button
                    className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="New File"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating("file");
                      setParentPath(null);
                      setNewItemName("");
                    }}
                  >
                    <FilePlus className="w-4 h-4" />
                  </button>
                  <button
                    className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="New Folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating("folder");
                      setParentPath(null);
                      setNewItemName("");
                    }}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
                    <ListCollapse className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto overflow-x-hidden">
                {isCreating === "folder" && !parentPath && (
                  <div
                    className="flex items-center gap-2 py-0.5 px-2 bg-accent"
                    style={{ paddingLeft: "12px" }}
                  >
                    <span className="text-muted-foreground shrink-0 flex items-center justify-center w-4 h-4">
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/80" />
                    </span>
                    <div className="flex-1 bg-background border-[0.5px] border-primary px-1 ml-1 rounded-none">
                      <input
                        ref={createInputRef}
                        className="w-full bg-transparent border-none outline-none text-foreground text-sm p-0 focus:ring-0"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateSubmit();
                          if (e.key === "Escape") {
                            setIsCreating(null);
                            setParentPath(null);
                          }
                        }}
                        onBlur={() => {
                          setIsCreating(null);
                          setParentPath(null);
                        }}
                        placeholder="folder name"
                      />
                    </div>
                  </div>
                )}

                {folders.length === 0 && rootFiles.length === 0 && !isCreating && (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50 px-4 text-center">
                    <Files className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-xs">No files found. Create one to get started.</p>
                  </div>
                )}

                {folders.map((node) => (
                  <React.Fragment key={node.id}>
                    <FileTreeItem
                      node={node}
                      onNewFile={(id) => {
                        setIsCreating("file");
                        setParentPath(id);
                        setNewItemName("");
                      }}
                      onNewFolder={(id) => {
                        setIsCreating("folder");
                        setParentPath(id);
                        setNewItemName("");
                      }}
                      onRename={(id) => {
                        setRenamingPath(id);
                        setNewItemName(id.split("/").pop() || "");
                      }}
                      onDelete={handleDelete}
                      onCopyPath={handleCopyPath}
                      onCopyRelativePath={handleCopyRelativePath}
                      onCut={handleCut}
                      onCopy={handleCopy}
                      onPaste={handlePaste}
                      renamingPath={renamingPath}
                      newItemName={newItemName}
                      setNewItemName={setNewItemName}
                      onRenameSubmit={handleRenameSubmit}
                      setRenamingPath={setRenamingPath}
                      clipboard={clipboard}
                      onFileClick={addOpenFile}
                    />
                    {isCreating && parentPath === node.id && (
                      <div
                        className="flex items-center gap-2 py-0.5 px-2 bg-accent"
                        style={{
                          paddingLeft: `${
                            node.id.split("/").length * 12 + 12
                          }px`,
                        }}
                      >
                        <span className="text-muted-foreground shrink-0 flex items-center justify-center w-4 h-4">
                          {isCreating === "folder" ? (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/80" />
                          ) : (
                            getFileIcon(newItemName)
                          )}
                        </span>
                        <div className="flex-1 bg-background border-[0.5px] border-primary px-1 ml-1 rounded-none">
                          <input
                            ref={createInputRef}
                            className="w-full bg-transparent border-none outline-none text-foreground text-sm p-0 focus:ring-0"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateSubmit();
                              if (e.key === "Escape") {
                                setIsCreating(null);
                                setParentPath(null);
                              }
                            }}
                            onBlur={() => {
                              setIsCreating(null);
                              setParentPath(null);
                            }}
                            placeholder={
                              isCreating === "file"
                                ? "file name"
                                : "folder name"
                            }
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {isCreating === "file" && !parentPath && (
                  <div
                    className="flex items-center gap-2 py-0.5 px-2 bg-accent"
                    style={{ paddingLeft: "12px" }}
                  >
                    <span className="text-muted-foreground shrink-0 flex items-center justify-center w-4 h-4">
                      {getFileIcon(newItemName)}
                    </span>
                    <div className="flex-1 bg-background border-[0.5px] border-primary px-1 ml-1 rounded-none">
                      <input
                        ref={createInputRef}
                        className="w-full bg-transparent border-none outline-none text-foreground text-sm p-0 focus:ring-0"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateSubmit();
                          if (e.key === "Escape") {
                            setIsCreating(null);
                            setParentPath(null);
                          }
                        }}
                        onBlur={() => {
                          setIsCreating(null);
                          setParentPath(null);
                        }}
                        placeholder="file name"
                      />
                    </div>
                  </div>
                )}

                {rootFiles.map((node) => (
                  <FileTreeItem
                    key={node.id}
                    node={node}
                    onNewFile={(id) => {
                      setIsCreating("file");
                      setParentPath(id);
                      setNewItemName("");
                    }}
                    onNewFolder={(id) => {
                      setIsCreating("folder");
                      setParentPath(id);
                      setNewItemName("");
                    }}
                    onRename={(id) => {
                      setRenamingPath(id);
                      setNewItemName(id.split("/").pop() || "");
                    }}
                    onDelete={handleDelete}
                    onCopyPath={handleCopyPath}
                    onCopyRelativePath={handleCopyRelativePath}
                    onCut={handleCut}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    renamingPath={renamingPath}
                    newItemName={newItemName}
                    setNewItemName={setNewItemName}
                    onRenameSubmit={handleRenameSubmit}
                    setRenamingPath={setRenamingPath}
                    clipboard={clipboard}
                    onFileClick={addOpenFile}
                  />
                ))}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56 bg-popover border-border text-popover-foreground">
              <ContextMenuItem
                onClick={() => {
                  setIsCreating("file");
                  setParentPath(null);
                  setNewItemName("");
                }}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <FilePlus className="w-4 h-4 mr-2" />
                <span>New File</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setIsCreating("folder");
                  setParentPath(null);
                  setNewItemName("");
                }}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                <span>New Folder</span>
              </ContextMenuItem>
              <ContextMenuSeparator className="border-border" />
              {clipboard && (
                <>
                  <ContextMenuItem
                    onClick={() => handlePaste("")}
                    className="focus:bg-accent focus:text-accent-foreground"
                  >
                    <FilePlus className="w-4 h-4 mr-2 rotate-180" />
                    <span>Paste</span>
                  </ContextMenuItem>
                  <ContextMenuSeparator className="border-border" />
                </>
              )}
              <ContextMenuItem
                onClick={() => navigator.clipboard.writeText("/")}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>Copy Path</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => navigator.clipboard.writeText("/")}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <Link className="w-4 h-4 mr-2" />
                <span>Copy Relative Path</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full bg-accent text-foreground text-xs pl-8 pr-2 py-1.5 rounded border border-transparent focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
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
                  className="flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-accent text-sm select-none"
                  onClick={() => addOpenFile(file.id)}
                >
                  {getFileIcon(file.name)}
                  <span className="text-foreground truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs ml-auto truncate opacity-50">
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
