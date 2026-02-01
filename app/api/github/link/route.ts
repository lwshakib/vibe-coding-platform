import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { full_name, workspaceId } = await req.json();

  if (full_name === undefined || !workspaceId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const githubRepo = full_name === "" ? null : full_name;

  try {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { githubRepo },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
