import { create } from "zustand";

export type Workspace = {
  id: string;
  name: string;
  documentData: Record<string, unknown> | null;
  canvasData: Record<string, unknown> | null;
  kanbanBoard: Record<string, unknown> | null;
  updatedAt: string;
  createdAt: string;
};

interface WorkspaceStore {
  workspaces: Workspace[];
  setWorkspaces: (
    workspaces: Workspace[] | ((workspaces: Workspace[]) => Workspace[])
  ) => void;
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
}));
