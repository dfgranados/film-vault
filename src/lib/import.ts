import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { photos, photoVariants, rolls } from "@/db/schema";
import {
  computeChecksum,
  copyToLibrary,
  ensureFileIsLocal,
  generateThumbnails,
  getImageDimensions,
  listImageFilesInDirectory,
  type VariantKind,
} from "@/lib/library";

export interface ImportPreviewFile {
  path: string;
  name: string;
  size: number;
}

export interface ImportPreviewResult {
  files: ImportPreviewFile[];
  totalCount: number;
}

export function previewImport(sourcePath: string): ImportPreviewResult {
  const files = listImageFilesInDirectory(sourcePath);
  return {
    files: files.map((filePath) => {
      const stat = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stat.size,
      };
    }),
    totalCount: files.length,
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  photos: Array<{ id: string; frameNumber: number; fileName: string }>;
  errors: string[];
}

export async function importFilesToRoll(
  rollId: string,
  sourcePath: string,
  kind: VariantKind,
  selectedFiles?: string[],
): Promise<ImportResult> {
  const db = await getDb();
  const rollRows = await db
    .select()
    .from(rolls)
    .where(eq(rolls.id, rollId))
    .limit(1);
  const roll = rollRows[0];
  if (!roll) {
    throw new Error("Roll not found");
  }

  let files = listImageFilesInDirectory(sourcePath);
  if (selectedFiles && selectedFiles.length > 0) {
    const selected = new Set(selectedFiles);
    files = files.filter((f) => selected.has(f));
  }

  const existingPhotos = (
    await db.select().from(photos).where(eq(photos.rollId, rollId))
  ).sort((a, b) => a.frameNumber - b.frameNumber);

  const checksumRows = await db
    .select({ checksum: photoVariants.checksum })
    .from(photoVariants);
  const existingChecksums = new Set(checksumRows.map((v) => v.checksum));

  let nextFrame =
    existingPhotos.length > 0
      ? Math.max(...existingPhotos.map((p) => p.frameNumber)) + 1
      : 1;

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    photos: [],
    errors: [],
  };

  for (const sourceFile of files) {
    try {
      ensureFileIsLocal(sourceFile);
      const checksum = await computeChecksum(sourceFile);

      if (existingChecksums.has(checksum)) {
        result.skipped += 1;
        continue;
      }

      let photo = existingPhotos.find((p) => p.frameNumber === nextFrame);

      if (kind === "lightroom_edit") {
        const frameForEdit = result.imported + 1;
        photo = existingPhotos.find((p) => p.frameNumber === frameForEdit);
        if (!photo) {
          result.errors.push(
            `No existing frame ${frameForEdit} for edit: ${sourceFile}`,
          );
          continue;
        }
      } else if (!photo) {
        const photoId = uuidv4();
        photo = {
          id: photoId,
          rollId,
          frameNumber: nextFrame,
          caption: null,
          isFavorite: false,
          rating: null,
          createdAt: new Date().toISOString(),
        };
        await db.insert(photos).values(photo);
        existingPhotos.push(photo);
        nextFrame += 1;
      }

      const destPath = copyToLibrary(
        sourceFile,
        roll.slug,
        kind,
        photo.frameNumber,
      );
      const dimensions = await getImageDimensions(destPath);

      const existingVariants = await db
        .select()
        .from(photoVariants)
        .where(eq(photoVariants.photoId, photo.id));

      const isPrimary =
        kind === "lightroom_edit" || !existingVariants.some((v) => v.isPrimary);

      if (kind === "lightroom_edit") {
        await db
          .update(photoVariants)
          .set({ isPrimary: false })
          .where(eq(photoVariants.photoId, photo.id));
      }

      await db.insert(photoVariants).values({
        id: uuidv4(),
        photoId: photo.id,
        kind,
        filePath: destPath,
        checksum,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        isPrimary,
      });

      await generateThumbnails(photo.id, destPath);

      existingChecksums.add(checksum);
      result.imported += 1;
      result.photos.push({
        id: photo.id,
        frameNumber: photo.frameNumber,
        fileName: path.basename(sourceFile),
      });
    } catch (err) {
      result.errors.push(
        `${sourceFile}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (result.imported > 0 && roll.status !== "complete") {
    await db
      .update(rolls)
      .set({ status: "scanned", updatedAt: new Date().toISOString() })
      .where(eq(rolls.id, rollId));
  }

  return result;
}
