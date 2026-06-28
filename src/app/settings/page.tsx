"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [libraryRoot, setLibraryRoot] = useState("");
  const [importInbox, setImportInbox] = useState("");
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setLibraryRoot(data.libraryRoot);
        setImportInbox(data.importInbox ?? "");
        setPaths(data.paths ?? {});
      });
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ libraryRoot, importInbox }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Library root path
          </label>
          <input
            value={libraryRoot}
            onChange={(e) => setLibraryRoot(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Default: ~/FilmVault — photos, thumbnails, and database live here.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Import inbox folder (optional)
          </label>
          <input
            value={importInbox}
            onChange={(e) => setImportInbox(e.target.value)}
            placeholder="/Users/you/FilmVault-inbox"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">
            For future auto-watch import (Phase 3).
          </p>
        </div>

        {Object.keys(paths).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Library structure</h3>
            <ul className="space-y-1 font-mono text-xs text-zinc-600">
              {Object.entries(paths).map(([key, path]) => (
                <li key={key}>
                  <span className="text-zinc-400">{key}:</span> {path}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={save}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          {saved ? "Saved!" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
