import fs from "fs";
import os from "os";
import path from "path";

export const DEFAULT_LIBRARY_ROOT = path.join(os.homedir(), "FilmVault");

export function getLibraryRoot(): string {
  return process.env.FILM_VAULT_ROOT ?? DEFAULT_LIBRARY_ROOT;
}

export function getDbPath(libraryRoot = getLibraryRoot()): string {
  return path.join(libraryRoot, "data", "filmvault.db");
}

export function getLibraryPaths(libraryRoot = getLibraryRoot()) {
  return {
    root: libraryRoot,
    library: path.join(libraryRoot, "library"),
    rolls: path.join(libraryRoot, "library", "rolls"),
    thumbnails: path.join(libraryRoot, "thumbnails"),
    exports: path.join(libraryRoot, "exports"),
    data: path.join(libraryRoot, "data"),
    db: getDbPath(libraryRoot),
  };
}

export function ensureLibraryStructure(libraryRoot = getLibraryRoot()): void {
  const paths = getLibraryPaths(libraryRoot);
  for (const dir of [
    paths.library,
    paths.rolls,
    paths.thumbnails,
    paths.exports,
    paths.data,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
