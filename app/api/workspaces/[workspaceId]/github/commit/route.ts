import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGithubToken } from "@/lib/github";
import prisma from "@/lib/prisma";
import { generateCommitMessage } from "@/llm/commit-message";

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
  const { commitMessage: customMessage, changedFile } = await req.json();

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
    const commitMessage = customMessage || (await generateCommitMessage(workspace.files, changedFile));

    // 1. Get the latest commit SHA from the main/master branch
    let baseSha = "";
    let branch = "main";
    
    let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/main`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
        // Try master
        res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/master`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) branch = "master";
    }

    if (res.ok) {
        const branchData = await res.json();
        baseSha = branchData.commit.sha;
    }

    // 2. Create blobs for each file
    const files = workspace.files as Record<string, any>;
    const treeItems = [];

    for (const [path, fileData] of Object.entries(files)) {
        const content = typeof fileData === 'string' ? fileData : fileData.content;
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                encoding: "utf-8",
            }),
        });
        
        if (!blobRes.ok) continue;
        const blob = await blobRes.json();
        
        treeItems.push({
            path,
            mode: "100644",
            type: "blob",
            sha: blob.sha,
        });
    }

    // 3. Create a new tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            base_tree: baseSha || undefined,
            tree: treeItems,
        }),
    });

    if (!treeRes.ok) {
        throw new Error("Failed to create tree");
    }
    const tree = await treeRes.json();

    // 4. Create the commit
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: commitMessage,
            tree: tree.sha,
            parents: baseSha ? [baseSha] : [],
        }),
    });

    if (!commitRes.ok) {
        throw new Error("Failed to create commit");
    }
    const commit = await commitRes.json();

    // 5. Update or create the reference
    if (baseSha) {
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sha: commit.sha,
            }),
        });
    } else {
        // Create the branch
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ref: `refs/heads/${branch}`,
                sha: commit.sha,
            }),
        });
    }

    return NextResponse.json({ success: true, commit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
