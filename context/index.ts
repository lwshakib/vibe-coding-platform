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
