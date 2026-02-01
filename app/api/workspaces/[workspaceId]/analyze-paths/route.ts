import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { analyzeProjectPaths } from "@/llm/path-analysis";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = params;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.userId !== session.user.id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Perform analysis
    const paths = await analyzeProjectPaths(workspace.files as Record<string, any>);

    // Save to database
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        detectedPaths: paths,
      },
    });

    return NextResponse.json({ paths: updatedWorkspace.detectedPaths });
  } catch (error) {
    console.error("Failed to analyze workspace paths:", error);
    return NextResponse.json(
      { error: "Failed to analyze workspace paths" },
      { status: 500 }
    );
  }
}
