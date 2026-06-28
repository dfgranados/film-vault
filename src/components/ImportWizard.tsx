"use client";

import { useState } from "react";
import { DropZone } from "@/components/DropZone";

interface ImportPreviewFile {
  path: string;
  name: string;
  size: number;
}

interface ImportWizardProps {
  rollId: string;
  kind?: "original_scan" | "lightroom_edit";
  onComplete?: () => void;
}

export function ImportWizard({
  rollId,
  kind = "original_scan",
  onComplete,
}: ImportWizardProps) {
  const [sourcePath, setSourcePath] = useState("");
  const [files, setFiles] = useState<ImportPreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  async function preview() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/rolls/${rollId}/import?sourcePath=${encodeURIComponent(sourcePath)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rolls/${rollId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath,
          kind,
          selectedFiles: files.map((f) => f.path),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }

  const kindLabel = kind === "lightroom_edit" ? "Lightroom edits" : "Lab scans";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
      <h3 className="font-medium">Import {kindLabel}</h3>
      <p className="text-sm text-zinc-500">
        Drag photos below, or enter the full path to a folder on your Mac. Files
        are copied into your FilmVault library — originals are never deleted.
      </p>

      <DropZone rollId={rollId} kind={kind} onComplete={onComplete} compact />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400">
            or use folder path
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={sourcePath}
          onChange={(e) => setSourcePath(e.target.value)}
          placeholder="/Users/you/Downloads/roll-03-scans"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono"
        />
        <button
          type="button"
          onClick={preview}
          disabled={!sourcePath || loading}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Preview"}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-zinc-600">
            {files.length} image{files.length !== 1 ? "s" : ""} found
          </p>
          <ul className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 text-sm">
            {files.map((f) => (
              <li
                key={f.path}
                className="flex justify-between border-b border-zinc-100 px-3 py-1.5 last:border-0"
              >
                <span className="truncate font-mono text-xs">{f.name}</span>
                <span className="text-zinc-400">
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={runImport}
            disabled={importing}
            className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${files.length} files`}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imported {result.imported} file{result.imported !== 1 ? "s" : ""}
          {result.skipped > 0 && `, skipped ${result.skipped} duplicate(s)`}
          {result.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-red-700">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
