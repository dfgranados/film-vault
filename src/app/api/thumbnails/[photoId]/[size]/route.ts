import fs from "fs";
import { NextResponse } from "next/server";
import { getThumbnailPath } from "@/lib/library";

type Params = { params: Promise<{ photoId: string; size: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { photoId, size } = await params;

  if (size !== "sm" && size !== "lg") {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

  const thumbPath = getThumbnailPath(photoId, size);
  if (!thumbPath || !fs.existsSync(thumbPath)) {
    return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(thumbPath);
  const contentType = thumbPath.endsWith(".webp") ? "image/webp" : "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
