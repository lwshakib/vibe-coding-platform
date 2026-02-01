import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppType } from "@/generated/prisma/enums";
import { getTemplateByType } from "@/lib/workspace-registry";
import { getInitialFiles } from "@/lib/starters";

export async function GET(request: NextRequest) {
  try {
    const userHeader = request.headers.get("x-user");
    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userHeader);
    const userId = user.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "12");
    const cursor = request.nextUrl.searchParams.get("cursor");

    const workspaces = await prisma.workspace.findMany({
      where: {
        userId: userId,
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: {
        updatedAt: "desc",
      },
    });

    const nextCursor = workspaces.length === limit ? workspaces[workspaces.length - 1].id : null;

    return NextResponse.json({ workspaces, nextCursor });
  } catch (error) {
    console.error("[WORKSPACES_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userHeader = request.headers.get("x-user");
    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userHeader);
    const userId = user.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const body = await request.json();
    const { name, app_type, files } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    // Default values if not provided
    const type = (app_type || AppType.VITE_APP) as AppType;

    // Get template from registry
    const template = getTemplateByType(type);
    if (!template) {
      return NextResponse.json({ error: "Invalid app type" }, { status: 400 });
    }

    // If files are not provided (e.g. normal creation), get defaults
    let initialFiles = files;
    if (!initialFiles) {
      initialFiles = getInitialFiles(template.folder);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        userId,
        app_type: type,
        files: initialFiles,
      },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("[WORKSPACES_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
