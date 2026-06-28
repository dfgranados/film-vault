import { NextResponse } from "next/server";
import { importUploadedFilesToRoll } from "@/lib/import";
import type { VariantKind } from "@/lib/library";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const kind = (formData.get("kind") as VariantKind) ?? "original_scan";
    const fileEntries = formData.getAll("files");

    const uploads = await Promise.all(
      fileEntries
        .filter((entry): entry is File => entry instanceof File)
        .map(async (file) => ({
          fileName: file.name,
          data: Buffer.from(await file.arrayBuffer()),
        })),
    );

    if (uploads.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const result = await importUploadedFilesToRoll(id, uploads, kind);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
