import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "missing url param" }, { status: 400 });
  }

  const body = await req.text();

  const token = req.nextUrl.searchParams.get("token");
  const headers: Record<string, string> = { "Content-Type": "application/sdp" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(target, {
    method: "POST",
    headers,
    body,
  });

  const sdp = await res.text();
  return new NextResponse(sdp, {
    status: res.status,
    headers: { "Content-Type": "application/sdp" },
  });
}
