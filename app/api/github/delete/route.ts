import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGithubToken } from "@/lib/github";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await req.json();

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  const token = await getGithubToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.userId !== session.user.id || !workspace.githubRepo) {
      return NextResponse.json({ error: "Workspace not found or not linked to GitHub" }, { status: 404 });
    }

    const [owner, repo] = workspace.githubRepo.split("/");

    // Delete the repository on GitHub
    const deleteRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!deleteRes.ok && deleteRes.status !== 404) {
      const errorData = await deleteRes.json();
      return NextResponse.json({ error: errorData.message || "Failed to delete repository on GitHub" }, { status: deleteRes.status });
    }

    // Unlink in DB
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { githubRepo: null },
    });

    return NextResponse.json({ success: true, workspace: updatedWorkspace });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
