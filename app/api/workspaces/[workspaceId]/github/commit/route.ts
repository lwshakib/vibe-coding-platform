import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGithubToken } from "@/lib/github";
import prisma from "@/lib/prisma";
import { generateCommitMessage } from "@/llm/commit-message";
import { Octokit } from "octokit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const { commitMessage: customMessage, changedFile } = await req.json();

  const token = await getGithubToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: token });

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.userId !== session.user.id || !workspace.githubRepo) {
      return NextResponse.json({ error: "Workspace not found or not linked to GitHub" }, { status: 404 });
    }

    const [ownerName, repoName] = workspace.githubRepo.split("/");
    const commitMessage = customMessage || (await generateCommitMessage(workspace.files, changedFile));

    // Get repo details to get the actual owner, name, and default branch
    const { data: repo } = await octokit.rest.repos.get({
      owner: ownerName,
      repo: repoName,
    });

    const owner = repo.owner.login;
    const name = repo.name;
    const defaultBranch = repo.default_branch;

    // Get workspace files
    const files = workspace.files as Record<string, any>;
    const fileEntries = Object.entries(files).filter(
      ([path]) => !(path.endsWith(".keep") && path.includes("/"))
    );

    if (fileEntries.length === 0) {
      return NextResponse.json({ error: "No files to commit" }, { status: 400 });
    }

    let baseSha: string | undefined;
    let baseTreeSha: string | undefined;
    
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo: name,
        ref: `heads/${defaultBranch}`,
      });
      baseSha = ref.object.sha;

      const { data: commit } = await octokit.rest.git.getCommit({
        owner,
        repo: name,
        commit_sha: baseSha,
      });
      baseTreeSha = commit.tree.sha;
    } catch (e: any) {
      if (e.status !== 404 && e.status !== 409) throw e;
      // Repository is empty
    }

    if (!baseSha) {
        // Handle empty repo using the Contents API for the first file to initialize it
        const [firstPath, firstFileData] = fileEntries[0];
        const firstContent = typeof firstFileData === 'string' ? firstFileData : firstFileData.content;
        
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo: name,
          path: firstPath,
          message: commitMessage,
          content: Buffer.from(firstContent).toString('base64'),
          branch: defaultBranch,
        });

        // Initialize baseSha after the first file
        const { data: ref } = await octokit.rest.git.getRef({
          owner,
          repo: name,
          ref: `heads/${defaultBranch}`,
        });
        baseSha = ref.object.sha;
        
        const { data: commit } = await octokit.rest.git.getCommit({
          owner,
          repo: name,
          commit_sha: baseSha,
        });
        baseTreeSha = commit.tree.sha;

        // Filter out the first file as it's already committed
        const remainingFiles = fileEntries.slice(1);
        if (remainingFiles.length === 0) {
            return NextResponse.json({ success: true, message: "Initial file created" });
        }

        // Build the tree with remaining files
        const tree = remainingFiles.map(([path, fileData]) => ({
          path,
          mode: "100644" as const,
          type: "blob" as const,
          content: typeof fileData === 'string' ? fileData : fileData.content,
        }));

        const { data: createdTree } = await octokit.rest.git.createTree({
          owner,
          repo: name,
          base_tree: baseTreeSha,
          tree,
        });

        const { data: newCommit } = await octokit.rest.git.createCommit({
          owner,
          repo: name,
          message: "feat: add remaining project files",
          tree: createdTree.sha,
          parents: [baseSha],
        });

        await octokit.rest.git.updateRef({
          owner,
          repo: name,
          ref: `heads/${defaultBranch}`,
          sha: newCommit.sha,
        });

        return NextResponse.json({ success: true, commitSha: newCommit.sha });
    }

    // Standard tree-based commit for non-empty repos
    const tree = fileEntries.map(([path, fileData]) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      content: typeof fileData === 'string' ? fileData : fileData.content,
    }));

    const { data: createdTree } = await octokit.rest.git.createTree({
      owner,
      repo: name,
      base_tree: baseTreeSha,
      tree,
    });

    const { data: commit } = await octokit.rest.git.createCommit({
      owner,
      repo: name,
      message: commitMessage,
      tree: createdTree.sha,
      parents: [baseSha],
    });

    await octokit.rest.git.updateRef({
      owner,
      repo: name,
      ref: `heads/${defaultBranch}`,
      sha: commit.sha,
    });

    return NextResponse.json({ success: true, commitSha: commit.sha });
  } catch (error: any) {
    console.error("GitHub Commit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to commit to GitHub" }, { status: 500 });
  }
}


