import { AppType } from "@/generated/prisma/enums";

export interface WorkspaceAppTemplate {
  type: AppType;
  label: string;
  description: string;
  logo: string;
  folder: string;
  category: "frontend" | "backend" | "fullstack" | "mobile";
  framework: string;
  logoStyling?: string;
}

export const WORKSPACE_REGISTRY: WorkspaceAppTemplate[] = [
  {
    type: AppType.VITE_APP,
    label: "Vite - React",
    description: "Vite + React with TypeScript and Tailwind CSS.",
    logo: "/logos/react.svg",
    folder: "vite-app",
    category: "frontend",
    framework: "React",
  },
  {
    type: AppType.NEXT_APP,
    label: "Next.js",
    description: "The React Framework for the Web with App Router.",
    logo: "/logos/nextjs.svg",
    folder: "next-app",
    category: "frontend",
    framework: "Next.js",
    logoStyling: "rounded-full bg-white p-1",
  },
];

export function getTemplateByType(
  type: AppType
): WorkspaceAppTemplate | undefined {
  return WORKSPACE_REGISTRY.find((template) => template.type === type);
}
