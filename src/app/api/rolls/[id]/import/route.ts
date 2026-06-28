import { NextResponse } from "next/server";
import { importFilesToRoll, previewImport } from "@/lib/import";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body.sourcePath) {
    return NextResponse.json(
      { error: "sourcePath is required" },
      { status: 400 },
    );
  }

  try {
    const result = await importFilesToRoll(
      id,
      body.sourcePath,
      body.kind ?? "original_scan",
      body.selectedFiles,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}

export async function GET(request: Request, { params }: Params) {
  await params;
  const { searchParams } = new URL(request.url);
  const sourcePath = searchParams.get("sourcePath");

  if (!sourcePath) {
    return NextResponse.json(
      { error: "sourcePath query param required" },
      { status: 400 },
    );
  }

  try {
    const preview = previewImport(sourcePath);
    return NextResponse.json(preview);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
