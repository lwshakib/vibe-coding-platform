import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGithubToken } from "@/lib/github";
import { Octokit } from "octokit";

export async function GET(
  req: NextRequest,
) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGithubToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 1. Get repo data for default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    
    const defaultBranch = repoData.default_branch || "main";

    // 2. Get the recursive tree
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "1",
    });

    const files: Record<string, any> = {};

    // 3. Smart Filter
    // We want to make sure we get package.json and configs even if they are deep or late in the tree
    const tree = treeData.tree;
    
    const importantFiles = tree.filter((item: any) => 
      item.type === "blob" && (
        item.path === "package.json" ||
        item.path.startsWith("next.config") ||
        item.path.startsWith("vite.config") ||
        item.path === "app.json" ||
        item.path === "tsconfig.json" ||
        item.path === "jsconfig.json"
      )
    );

    const otherBlobs = tree.filter((item: any) => 
        item.type === "blob" && 
        !importantFiles.find(i => i.path === item.path) &&
        !item.path.includes("node_modules/") && 
        !item.path.includes(".next/") &&
        !item.path.includes(".git/") &&
        !item.path.includes("dist/") &&
        !item.path.includes("build/") &&
        !item.path.includes("public/") &&
        !item.path.includes(".lock") &&
        !item.path.endsWith(".png") &&
        !item.path.endsWith(".jpg") &&
        !item.path.endsWith(".jpeg") &&
        !item.path.endsWith(".svg") &&
        !item.path.endsWith(".ico") &&
         (item.size || 0) < 100000 // 100kb limit
    );

    // Combine and limit
    const blobsToFetch = [...importantFiles, ...otherBlobs].slice(0, 150);

    console.log(`[GitHub Import] Fetching ${blobsToFetch.length} files for ${owner}/${repo}`);

    await Promise.all(
        blobsToFetch.map(async (blob: any) => {
            try {
                const { data: contentData } = await octokit.rest.git.getBlob({
                    owner,
                    repo,
                    file_sha: blob.sha,
                });
                
                let content = "";
                if (contentData.encoding === "base64") {
                    content = Buffer.from(contentData.content, "base64").toString("utf-8");
                } else {
                    content = contentData.content;
                }
                
                files[blob.path] = { content };
            } catch (err) {
                console.error(`Failed to fetch blob ${blob.path}:`, err);
            }
        })
    );

    console.log(`[GitHub Import] Successfully imported ${Object.keys(files).length} files`);
    
    return NextResponse.json({ files, name: repoData.name });
  } catch (error: any) {
    console.error("[GitHub Import Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
