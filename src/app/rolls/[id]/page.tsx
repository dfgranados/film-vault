"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ImportWizard } from "@/components/ImportWizard";
import { DropZone } from "@/components/DropZone";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { StatusBadge } from "@/components/StatusBadge";
import type { Photo, Roll } from "@/types";
import { rollStatuses } from "@/lib/constants";
import { formatRollFilmLine } from "@/lib/film";

export default function RollDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [roll, setRoll] = useState<(Roll & { photos: Photo[] }) | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showEditImport, setShowEditImport] = useState(false);

  const loadRoll = useCallback(async () => {
    const res = await fetch(`/api/rolls/${id}`);
    if (res.ok) setRoll(await res.json());
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/rolls/${id}`);
      if (!cancelled && res.ok) setRoll(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/rolls/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadRoll();
  }

  if (!roll) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/rolls" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Back to rolls
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{roll.title}</h1>
            <StatusBadge status={roll.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-zinc-500">{roll.slug}</p>
          <div className="mt-3 space-y-1 text-sm text-zinc-600">
            {roll.shotDate && <p>Shot: {roll.shotDate}</p>}
            {roll.camera && (
              <p>
                {roll.camera.name}
                {roll.camera.lens ? ` · ${roll.camera.lens}` : ""}
              </p>
            )}
            {roll.filmStock && (
              <p>{formatRollFilmLine(roll.filmStock, roll.shotIso)}</p>
            )}
            {roll.locationDisplay && roll.locationDisplay !== "—" && (
              <p>{roll.locationDisplay}</p>
            )}
            {roll.notes && <p className="italic">{roll.notes}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={roll.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {rollStatuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setShowImport(!showImport);
              setShowEditImport(false);
            }}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Import scans
          </button>
          <button
            type="button"
            onClick={() => {
              setShowEditImport(!showEditImport);
              setShowImport(false);
            }}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
          >
            Import Lightroom edits
          </button>
        </div>
      </div>

      {showImport && (
        <div className="mb-8">
          <ImportWizard
            rollId={id}
            kind="original_scan"
            onComplete={loadRoll}
          />
        </div>
      )}

      {showEditImport && (
        <div className="mb-8">
          <ImportWizard
            rollId={id}
            kind="lightroom_edit"
            onComplete={loadRoll}
          />
        </div>
      )}

      <h2 className="mb-4 text-lg font-medium">
        Photos ({roll.photos?.length ?? 0})
      </h2>

      <div className="mb-6">
        <DropZone rollId={id} kind="original_scan" onComplete={loadRoll} />
      </div>

      <PhotoGrid photos={roll.photos ?? []} onSelect={setSelectedPhoto} />

      {selectedPhoto && (
        <PhotoLightbox
          photo={{ ...selectedPhoto, roll }}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={loadRoll}
        />
      )}
    </div>
  );
}
