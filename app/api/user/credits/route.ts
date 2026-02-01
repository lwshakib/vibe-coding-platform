import { NextRequest, NextResponse } from "next/server";
import { getAndUpdateUserCredits } from "@/lib/credits";

export async function GET(req: NextRequest) {
  try {
    const userHeader = req.headers.get("x-user");
    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(userHeader);
    const userId = sessionUser.id;

    const credits = await getAndUpdateUserCredits(userId);

    return NextResponse.json({ credits });
  } catch (error: any) {
    console.error("Credits lookup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
