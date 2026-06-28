import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { photoVariants, photos, postSetItems, postSets } from "@/db/schema";
import { getLibraryPaths } from "@/lib/config";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();

  const setRows = await db
    .select()
    .from(postSets)
    .where(eq(postSets.id, id))
    .limit(1);
  const set = setRows[0];
  if (!set) {
    return NextResponse.json({ error: "Post set not found" }, { status: 404 });
  }

  const items = (
    await db
      .select({ item: postSetItems, photo: photos })
      .from(postSetItems)
      .innerJoin(photos, eq(postSetItems.photoId, photos.id))
      .where(eq(postSetItems.postSetId, id))
  ).sort((a, b) => a.item.sortOrder - b.item.sortOrder);

  const { exports: exportsRoot } = getLibraryPaths();
  const destDir = path.join(exportsRoot, "post-sets", id);
  fs.mkdirSync(destDir, { recursive: true });

  const exported: string[] = [];

  for (const { item, photo } of items) {
    const variants = await db
      .select()
      .from(photoVariants)
      .where(eq(photoVariants.photoId, photo.id));
    const primary = variants.find((v) => v.isPrimary) ?? variants[0] ?? null;
    if (!primary || !fs.existsSync(primary.filePath)) continue;

    const ext = path.extname(primary.filePath);
    const destName = `${String(item.sortOrder + 1).padStart(2, "0")}-frame-${photo.frameNumber}${ext}`;
    const destPath = path.join(destDir, destName);
    fs.copyFileSync(primary.filePath, destPath);
    exported.push(destPath);
  }

  return NextResponse.json({
    exportDir: destDir,
    exported: exported.length,
    files: exported,
  });
}
