import { AppType } from "@/generated/prisma/enums";

export interface WorkspaceAppTemplate {
  type: AppType;
  label: string;
  description: string;
  logo: string;
  folder: string;
  category: "frontend" | "backend" | "fullstack" | "mobile";
  framework: string;
}

export const WORKSPACE_REGISTRY: WorkspaceAppTemplate[] = [
  {
    type: AppType.,
    label: "Vite - React",
    description: "Vite + React with TypeScript and Tailwind CSS.",
    logo: "/logos/react.svg",
    folder: "react-ts",
    category: "frontend",
    framework: "React",
  },
  {
    type: AppType.NEXT_TS,
    label: "Next.js",
    description: "The React Framework for the Web with App Router.",
    logo: "/logos/nextjs.svg",
    folder: "next-ts",
    category: "frontend",
    framework: "Next.js",
  },
];

export function getTemplateByType(
  type: AppType
): WorkspaceAppTemplate | undefined {
  return WORKSPACE_REGISTRY.find((template) => template.type === type);
}
