import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const { files } = body;

    if (!files) {
      return NextResponse.json({ error: "Missing files" }, { status: 400 });
    }

    const workspace = await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        files: files,
      },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("[WORKSPACE_FILES_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
