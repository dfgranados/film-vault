"use client";

import type { Photo } from "@/types";

interface PhotoPickerGridProps {
  photos: Photo[];
  excludePhotoIds: Set<string>;
  onSelect: (photoId: string) => void | Promise<void>;
  addingPhotoId?: string | null;
}

export function PhotoPickerGrid({
  photos,
  excludePhotoIds,
  onSelect,
  addingPhotoId,
}: PhotoPickerGridProps) {
  const available = photos.filter((photo) => !excludePhotoIds.has(photo.id));

  if (available.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No more photos to add — all library photos are already in this set.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {available.map((photo) => {
        const isAdding = addingPhotoId === photo.id;
        return (
          <button
            key={photo.id}
            type="button"
            disabled={Boolean(addingPhotoId)}
            onClick={() => onSelect(photo.id)}
            className={`group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 text-left ring-offset-2 transition-all hover:ring-2 hover:ring-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:cursor-wait disabled:opacity-60 ${
              isAdding ? "ring-2 ring-zinc-900" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/thumbnails/${photo.id}/sm`}
              alt={`Frame ${photo.frameNumber}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
              <p className="text-[10px] font-medium text-white">
                #{photo.frameNumber}
                {photo.isFavorite && " ★"}
              </p>
              {photo.roll && (
                <p className="truncate text-[9px] text-white/80">
                  {photo.roll.title}
                </p>
              )}
            </div>
            {isAdding && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-xs font-medium text-white">Adding…</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
