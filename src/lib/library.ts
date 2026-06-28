import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getLibraryPaths } from "@/lib/config";
import { isImageFileName } from "@/lib/image-types";

export function isImageFile(filePath: string): boolean {
  return isImageFileName(path.basename(filePath));
}

export { isImageFileName } from "@/lib/image-types";

export function computeChecksumFromBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function computeChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export function listImageFilesInDirectory(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function ensureFileIsLocal(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error(
      `File appears empty or is an iCloud placeholder: ${filePath}. Download it locally first.`,
    );
  }
}

export async function getImageDimensions(
  filePath: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateThumbnails(
  photoId: string,
  sourcePath: string,
): Promise<void> {
  const { thumbnails } = getLibraryPaths();
  const photoThumbDir = path.join(thumbnails, photoId);
  fs.mkdirSync(photoThumbDir, { recursive: true });

  const smPath = path.join(photoThumbDir, "sm.webp");
  const lgPath = path.join(photoThumbDir, "lg.webp");

  try {
    await sharp(sourcePath)
      .rotate()
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(smPath);

    await sharp(sourcePath)
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(lgPath);
  } catch {
    fs.copyFileSync(
      sourcePath,
      smPath.replace(".webp", path.extname(sourcePath)),
    );
  }
}

export function getThumbnailPath(
  photoId: string,
  size: "sm" | "lg",
): string | null {
  const { thumbnails } = getLibraryPaths();
  const webpPath = path.join(thumbnails, photoId, `${size}.webp`);
  if (fs.existsSync(webpPath)) return webpPath;

  const dir = path.join(thumbnails, photoId);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => f.startsWith(size));
  return files.length > 0 ? path.join(dir, files[0]) : null;
}

export type VariantKind = "original_scan" | "lightroom_edit" | "social_export";

export function getVariantSubdir(kind: VariantKind): string {
  switch (kind) {
    case "original_scan":
      return "originals";
    case "lightroom_edit":
      return "edits";
    case "social_export":
      return "exports";
  }
}

export function copyToLibrary(
  sourcePath: string,
  rollSlug: string,
  kind: VariantKind,
  frameNumber: number,
): string {
  const { rolls } = getLibraryPaths();
  const subdir = getVariantSubdir(kind);
  const ext = path.extname(sourcePath).toLowerCase();
  const suffix = kind === "lightroom_edit" ? "-edit" : "";
  const destDir = path.join(rolls, rollSlug, subdir);
  fs.mkdirSync(destDir, { recursive: true });

  const destFileName = `${String(frameNumber).padStart(3, "0")}${suffix}${ext}`;
  const destPath = path.join(destDir, destFileName);

  fs.copyFileSync(sourcePath, destPath);
  return destPath;
}

export function getLibraryDestPath(
  fileName: string,
  rollSlug: string,
  kind: VariantKind,
  frameNumber: number,
): string {
  const { rolls } = getLibraryPaths();
  const subdir = getVariantSubdir(kind);
  const ext = path.extname(fileName).toLowerCase() || ".jpg";
  const suffix = kind === "lightroom_edit" ? "-edit" : "";
  const destDir = path.join(rolls, rollSlug, subdir);
  fs.mkdirSync(destDir, { recursive: true });
  const destFileName = `${String(frameNumber).padStart(3, "0")}${suffix}${ext}`;
  return path.join(destDir, destFileName);
}

export function writeBufferToLibrary(
  buffer: Buffer,
  fileName: string,
  rollSlug: string,
  kind: VariantKind,
  frameNumber: number,
): string {
  const destPath = getLibraryDestPath(fileName, rollSlug, kind, frameNumber);
  fs.writeFileSync(destPath, buffer);
  return destPath;
}
