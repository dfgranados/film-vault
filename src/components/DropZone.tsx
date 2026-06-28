"use client";

import { useRef, useState } from "react";
import { isImageFileName } from "@/lib/image-types";

interface DropZoneProps {
  rollId: string;
  kind?: "original_scan" | "lightroom_edit";
  onComplete?: () => void;
  compact?: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

async function collectImageFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];

  if (dataTransfer.items?.length) {
    const entries = Array.from(dataTransfer.items)
      .map((item) => item.webkitGetAsEntry?.())
      .filter((entry): entry is FileSystemEntry => Boolean(entry));

    if (entries.length > 0) {
      async function readDirectory(
        directory: FileSystemDirectoryEntry,
      ): Promise<void> {
        const reader = directory.createReader();
        const readBatch = (): Promise<FileSystemEntry[]> =>
          new Promise((resolve, reject) => {
            reader.readEntries(resolve, reject);
          });

        let batch = await readBatch();
        while (batch.length > 0) {
          for (const entry of batch) {
            await traverse(entry);
          }
          batch = await readBatch();
        }
      }

      async function traverse(entry: FileSystemEntry): Promise<void> {
        if (entry.isFile) {
          const file = await new Promise<File>((resolve, reject) => {
            (entry as FileSystemFileEntry).file(resolve, reject);
          });
          if (isImageFileName(file.name)) {
            files.push(file);
          }
        } else if (entry.isDirectory) {
          await readDirectory(entry as FileSystemDirectoryEntry);
        }
      }

      for (const entry of entries) {
        await traverse(entry);
      }
    }
  }

  if (files.length === 0) {
    for (const file of Array.from(dataTransfer.files)) {
      if (isImageFileName(file.name)) {
        files.push(file);
      }
    }
  }

  return files.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
}

export function DropZone({
  rollId,
  kind = "original_scan",
  onComplete,
  compact = false,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) {
      setError("No supported image files found (JPEG, PNG, TIFF, DNG, etc.)");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setPendingCount(files.length);

    try {
      const formData = new FormData();
      formData.set("kind", kind);
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch(`/api/rolls/${rollId}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      setPendingCount(0);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = await collectImageFiles(e.dataTransfer);
    await uploadFiles(files);
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      isImageFileName(f.name),
    );
    e.target.value = "";
    await uploadFiles(files);
  }

  const kindLabel = kind === "lightroom_edit" ? "Lightroom edits" : "lab scans";

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
          compact ? "p-6" : "p-10"
        } ${
          dragging
            ? "border-zinc-900 bg-zinc-100"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.dng,.tif,.tiff"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-800">
            {uploading
              ? `Importing ${pendingCount} file${pendingCount !== 1 ? "s" : ""}…`
              : "Drop photos or a folder here"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            or click to browse · {kindLabel} · copied into your library
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imported {result.imported} file{result.imported !== 1 ? "s" : ""}
          {result.skipped > 0 && `, skipped ${result.skipped} duplicate(s)`}
          {result.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-red-700">
              {result.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
