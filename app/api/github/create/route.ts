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

  const { name, description, isPrivate, workspaceId } = await req.json();

  const token = await getGithubToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
      }),
    });

    if (!res.ok) {
        const errorData = await res.json();
      return NextResponse.json({ error: errorData.message || "Failed to create repository" }, { status: res.status });
    }

    const repo = await res.json();

    // Link to workspace if workspaceId is provided
    if (workspaceId) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { githubRepo: repo.full_name },
      });
    }

    return NextResponse.json({ repo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
