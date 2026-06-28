"use client";

import type { Photo } from "@/types";

export function PhotoGrid({
  photos,
  onSelect,
}: {
  photos: Photo[];
  onSelect?: (photo: Photo) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-zinc-500">
        No photos yet. Import scans to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect?.(photo)}
          className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/thumbnails/${photo.id}/sm`}
            alt={`Frame ${photo.frameNumber}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs font-medium text-white">
              #{photo.frameNumber}
              {photo.isFavorite && " ★"}
            </p>
            {photo.roll && (
              <p className="truncate text-[10px] text-white/80">
                {photo.roll.title}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
