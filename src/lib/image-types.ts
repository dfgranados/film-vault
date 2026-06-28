const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff",
  ".dng",
  ".webp",
  ".heic",
]);

export function isImageFileName(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(fileName.slice(dot).toLowerCase());
}
