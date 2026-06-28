"use client";

import { useState } from "react";
import type { Photo } from "@/types";

export function PhotoLightbox({
  photo,
  onClose,
  onUpdate,
}: {
  photo: Photo;
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [rating, setRating] = useState(photo.rating ?? 0);
  const [favorite, setFavorite] = useState(photo.isFavorite);

  async function save() {
    await fetch(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: caption || null,
        rating: rating || null,
        isFavorite: favorite,
      }),
    });
    onUpdate?.();
  }

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    await fetch(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    });
    onUpdate?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/thumbnails/${photo.id}/lg`}
          alt={`Frame ${photo.frameNumber}`}
          className="max-h-[60vh] w-full object-contain bg-zinc-100"
        />
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Frame #{photo.frameNumber}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900"
            >
              Close
            </button>
          </div>
          {photo.roll && (
            <p className="text-sm text-zinc-500">{photo.roll.title}</p>
          )}
          <button type="button" onClick={toggleFavorite} className="text-sm">
            {favorite ? "★ Favorited" : "☆ Add to favorites"}
          </button>
          <div>
            <label className="mb-1 block text-xs font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-lg ${n <= rating ? "text-amber-400" : "text-zinc-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
