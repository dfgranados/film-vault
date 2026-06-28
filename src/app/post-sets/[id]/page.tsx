"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Photo, PostSet } from "@/types";

export default function PostSetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [postSet, setPostSet] = useState<PostSet | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoIdToAdd, setPhotoIdToAdd] = useState("");
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [setRes, photosRes] = await Promise.all([
      fetch(`/api/post-sets/${id}`),
      fetch("/api/photos"),
    ]);
    if (setRes.ok) setPostSet(await setRes.json());
    if (photosRes.ok) setPhotos(await photosRes.json());
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [setRes, photosRes] = await Promise.all([
        fetch(`/api/post-sets/${id}`),
        fetch("/api/photos"),
      ]);
      if (cancelled) return;
      if (setRes.ok) setPostSet(await setRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function addPhoto() {
    if (!photoIdToAdd) return;
    await fetch(`/api/post-sets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: photoIdToAdd }),
    });
    setPhotoIdToAdd("");
    setShowAddPhoto(false);
    load();
  }

  async function exportSet() {
    const res = await fetch(`/api/post-sets/${id}/export`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setExportResult(`Exported ${data.exported} files to ${data.exportDir}`);
    }
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/post-sets/${id}/items/${itemId}`, { method: "DELETE" });
    load();
  }

  async function markPosted(itemId: string, platform: string) {
    await fetch("/api/platform-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postSetItemId: itemId,
        platform,
        postedAt: new Date().toISOString(),
      }),
    });
    load();
  }

  async function unmarkPosted(postId: string) {
    await fetch(`/api/platform-posts?id=${postId}`, { method: "DELETE" });
    load();
  }

  if (!postSet) {
    return <div className="px-4 py-8 text-zinc-500">Loading...</div>;
  }

  const items = postSet.items ?? [];
  const platform = postSet.targetPlatform ?? "Instagram";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/post-sets"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to post sets
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold">{postSet.name}</h1>
        {postSet.targetPlatform && (
          <p className="text-zinc-500">Target: {postSet.targetPlatform}</p>
        )}
        {postSet.notes && (
          <p className="mt-2 text-sm text-zinc-600">{postSet.notes}</p>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setShowAddPhoto(!showAddPhoto)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          Add photo
        </button>
        <button
          type="button"
          onClick={exportSet}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
        >
          Export for posting
        </button>
      </div>

      {exportResult && (
        <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {exportResult}
        </p>
      )}

      {showAddPhoto && (
        <div className="mb-6 flex gap-2 rounded-lg border border-zinc-200 bg-white p-4">
          <select
            value={photoIdToAdd}
            onChange={(e) => setPhotoIdToAdd(e.target.value)}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select a photo...</option>
            {photos.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.frameNumber} — {p.roll?.title ?? p.rollId}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addPhoto}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-zinc-500">No photos in this set yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const posted = item.platformPosts?.find(
              (p) => p.platform === platform,
            );
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3"
              >
                <span className="w-8 text-center text-sm text-zinc-400">
                  {index + 1}
                </span>
                {item.photo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/thumbnails/${item.photo.id}/sm`}
                    alt=""
                    className="h-16 w-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Frame #{item.photo?.frameNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.photo?.roll?.title}
                  </p>
                  {item.cropNotes && (
                    <p className="text-xs text-zinc-400">{item.cropNotes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {posted ? (
                    <>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Posted {platform}
                      </span>
                      <button
                        type="button"
                        onClick={() => unmarkPosted(posted.id)}
                        className="text-xs text-zinc-500"
                      >
                        Undo
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markPosted(item.id, platform)}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs"
                    >
                      Mark posted to {platform}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-medium">Posting summary</h3>
        <p className="mt-1 text-sm text-zinc-600">
          {
            items.filter((i) =>
              i.platformPosts?.some((p) => p.platform === platform),
            ).length
          }{" "}
          of {items.length} photos posted to {platform}
        </p>
      </div>
    </div>
  );
}
