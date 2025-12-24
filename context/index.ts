import { create } from "zustand";
import { AppType } from "@/generated/prisma/enums";

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
  sendMessage: (content: string) => Promise<void>;
  streamingStatus: StreamingStatus;
  stopStreaming: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
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
  streamingStatus: "idle",
  stopStreaming: () => set({ streamingStatus: "idle" }),
  activeTab: "code-editor",
  setActiveTab: (tab) => set({ activeTab: tab }),
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
