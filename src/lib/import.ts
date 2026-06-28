import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { photos, photoVariants, rolls } from "@/db/schema";
import {
  computeChecksum,
  computeChecksumFromBuffer,
  copyToLibrary,
  ensureFileIsLocal,
  generateThumbnails,
  getImageDimensions,
  isImageFileName,
  listImageFilesInDirectory,
  writeBufferToLibrary,
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

export interface ImportResult {
  imported: number;
  skipped: number;
  photos: Array<{ id: string; frameNumber: number; fileName: string }>;
  errors: string[];
}

export interface UploadFileInput {
  fileName: string;
  data: Buffer;
}

interface PreparedImportFile {
  label: string;
  fileName: string;
  checksum: string;
  destPath: string;
}

type Roll = typeof rolls.$inferSelect;

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

async function prepareFromPath(
  sourceFile: string,
  roll: Roll,
  kind: VariantKind,
  frameNumber: number,
): Promise<PreparedImportFile> {
  ensureFileIsLocal(sourceFile);
  const checksum = await computeChecksum(sourceFile);
  const destPath = copyToLibrary(sourceFile, roll.slug, kind, frameNumber);
  return {
    label: sourceFile,
    fileName: path.basename(sourceFile),
    checksum,
    destPath,
  };
}

function prepareFromBuffer(
  file: UploadFileInput,
  roll: Roll,
  kind: VariantKind,
  frameNumber: number,
): PreparedImportFile {
  if (file.data.length === 0) {
    throw new Error(`File is empty: ${file.fileName}`);
  }
  const checksum = computeChecksumFromBuffer(file.data);
  const destPath = writeBufferToLibrary(
    file.data,
    file.fileName,
    roll.slug,
    kind,
    frameNumber,
  );
  return {
    label: file.fileName,
    fileName: file.fileName,
    checksum,
    destPath,
  };
}

async function importPreparedFiles(
  rollId: string,
  roll: Roll,
  kind: VariantKind,
  preparedFiles: PreparedImportFile[],
): Promise<ImportResult> {
  const db = await getDb();

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

  for (const file of preparedFiles) {
    try {
      if (existingChecksums.has(file.checksum)) {
        if (fs.existsSync(file.destPath)) {
          fs.unlinkSync(file.destPath);
        }
        result.skipped += 1;
        continue;
      }

      let photo = existingPhotos.find((p) => p.frameNumber === nextFrame);

      if (kind === "lightroom_edit") {
        const frameForEdit = result.imported + 1;
        photo = existingPhotos.find((p) => p.frameNumber === frameForEdit);
        if (!photo) {
          if (fs.existsSync(file.destPath)) {
            fs.unlinkSync(file.destPath);
          }
          result.errors.push(
            `No existing frame ${frameForEdit} for edit: ${file.label}`,
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

      const dimensions = await getImageDimensions(file.destPath);

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
        filePath: file.destPath,
        checksum: file.checksum,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        isPrimary,
      });

      await generateThumbnails(photo.id, file.destPath);

      existingChecksums.add(file.checksum);
      result.imported += 1;
      result.photos.push({
        id: photo.id,
        frameNumber: photo.frameNumber,
        fileName: file.fileName,
      });
    } catch (err) {
      if (fs.existsSync(file.destPath)) {
        fs.unlinkSync(file.destPath);
      }
      result.errors.push(
        `${file.label}: ${err instanceof Error ? err.message : String(err)}`,
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

  const nextFrame =
    existingPhotos.length > 0
      ? Math.max(...existingPhotos.map((p) => p.frameNumber)) + 1
      : 1;

  const prepared: PreparedImportFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const frameNumber = kind === "lightroom_edit" ? i + 1 : nextFrame + i;
    prepared.push(await prepareFromPath(files[i], roll, kind, frameNumber));
  }

  return importPreparedFiles(rollId, roll, kind, prepared);
}

export async function importUploadedFilesToRoll(
  rollId: string,
  uploads: UploadFileInput[],
  kind: VariantKind,
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

  const imageFiles = uploads
    .filter((f) => isImageFileName(f.fileName))
    .sort((a, b) =>
      a.fileName.localeCompare(b.fileName, undefined, { numeric: true }),
    );

  if (imageFiles.length === 0) {
    throw new Error("No supported image files found");
  }

  const existingPhotos = (
    await db.select().from(photos).where(eq(photos.rollId, rollId))
  ).sort((a, b) => a.frameNumber - b.frameNumber);

  const nextFrame =
    existingPhotos.length > 0
      ? Math.max(...existingPhotos.map((p) => p.frameNumber)) + 1
      : 1;

  const prepared = imageFiles.map((file, index) => {
    const frameNumber =
      kind === "lightroom_edit" ? index + 1 : nextFrame + index;
    return prepareFromBuffer(file, roll, kind, frameNumber);
  });

  return importPreparedFiles(rollId, roll, kind, prepared);
}
