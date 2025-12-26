import { create } from "zustand";
import { AppType } from "@/generated/prisma/enums";
import { debounce } from "lodash";

// Helper for API calls
const saveToDb = async (id: string, files: any) => {
  try {
    await fetch(`/api/workspaces/${id}/files`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    });
  } catch (error) {
    console.error("Failed to update files:", error);
  }
};

const debouncedSave = debounce(saveToDb, 2000);

export type Workspace = {
  id: string;
  name: string;
  userId: string;
  app_type: AppType;
  files: any;
  updatedAt: string;
  createdAt: string;
};

export type TabType = "code-editor" | "web-preview";
export type StreamingStatus = "idle" | "streaming" | "finished";

interface WorkspaceStore {
  workspaces: Workspace[];
  setWorkspaces: (
    workspaces: Workspace[] | ((workspaces: Workspace[]) => Workspace[])
  ) => void;

  // SingleStack State
  messages: any[];
  setMessages: (messages: any[] | ((messages: any[]) => any[])) => void;
  stackDetails: any;
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  sendMessage: (content: string) => Promise<void>;
  streamingStatus: StreamingStatus;
  stopStreaming: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
  openFiles: string[];
  setOpenFiles: (files: string[]) => void;
  addOpenFile: (path: string) => void;
  closeFile: (path: string) => void;
  updateFiles: (files: any, immediate?: boolean) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  setWorkspaces: (workspaces) =>
    set((state) => ({
      workspaces:
        typeof workspaces === "function"
          ? workspaces(state.workspaces)
          : workspaces,
    })),

  // SingleStack Implementation
  messages: [],
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function" ? messages(state.messages) : messages,
    })),
  stackDetails: { stack: { name: "Mock Project" } },
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  streamingStatus: "idle",
  stopStreaming: () => set({ streamingStatus: "idle" }),
  activeTab: "code-editor",
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeFile: null,
  setActiveFile: (path: string | null) => set({ activeFile: path }),
  openFiles: [],
  setOpenFiles: (files) => set({ openFiles: files }),
  addOpenFile: (path: string) =>
    set((state) => {
      // If already open, just switch focus
      if (state.openFiles.includes(path)) {
        return { activeFile: path };
      }

      // Add new file and keep only the last 5 (FIFO)
      const newOpenFiles = [...state.openFiles, path].slice(-5);

      return {
        openFiles: newOpenFiles,
        activeFile: path,
      };
    }),
  closeFile: (path: string) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f !== path);
      let newActiveFile = state.activeFile;

      // If we closed the active file, switch to the last remaining tab or null
      if (state.activeFile === path) {
        newActiveFile =
          newOpenFiles.length > 0
            ? newOpenFiles[newOpenFiles.length - 1]
            : null;
      }

      return {
        openFiles: newOpenFiles,
        activeFile: newActiveFile,
      };
    }),
  updateFiles: async (files, immediate = false) => {
    const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
    if (!currentWorkspace) return;

    // 1. Optimistic update (Immediate local state change)
    set((state) => ({
      currentWorkspace: state.currentWorkspace
        ? { ...state.currentWorkspace, files }
        : null,
    }));

    // 2. Save to DB (Immediate or Debounced)
    if (immediate) {
      debouncedSave.cancel(); // Cancel any pending debounced calls
      await saveToDb(currentWorkspace.id, files);
    } else {
      debouncedSave(currentWorkspace.id, files);
    }
  },
  sendMessage: async (content) => {
    // Add user message
    const newUserMessage = {
      role: "user",
      parts: [{ type: "text", text: content }],
    };
    set((state) => ({
      messages: [...state.messages, newUserMessage],
      streamingStatus: "streaming",
    }));

    // Mock response
    setTimeout(() => {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: "assistant",
            parts: [
              {
                type: "text",
                text: "This is a mock response to your message: " + content,
              },
            ],
          },
        ],
        streamingStatus: "idle",
      }));
    }, 1500);
  },
}));
