import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    // We'll use QuickChart or Google Charts to generate the QR code
    const qrApiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300&margin=1`;
    
    const response = await fetch(qrApiUrl);
    
    if (!response.ok) {
        throw new Error("Failed to fetch QR code from upstream");
    }

    const blob = await response.blob();
    const headers = new Headers();
    
    // Crucial headers for COEP compatibility
    headers.set("Content-Type", "image/png");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("QR Proxy error:", error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
