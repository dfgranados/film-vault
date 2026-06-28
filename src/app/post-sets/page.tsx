"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PostSet } from "@/types";

export default function PostSetsPage() {
  const [sets, setSets] = useState<PostSet[]>([]);

  useEffect(() => {
    fetch("/api/post-sets")
      .then((r) => r.json())
      .then(setSets);
  }, []);

  const readyCount = sets.filter((s) => {
    const items = s.items ?? [];
    if (items.length === 0) return false;
    return items.some(
      (item) =>
        !item.platformPosts?.some((p) => p.platform === s.targetPlatform),
    );
  }).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Post Sets</h1>
          <p className="text-zinc-500">
            {sets.length} sets · {readyCount} with unpublished photos
          </p>
        </div>
        <Link
          href="/post-sets/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          New Post Set
        </Link>
      </div>

      {sets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-zinc-500">
          No post sets yet. Create one to plan your next carousel.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => {
            const items = set.items ?? [];
            const posted = items.filter((item) =>
              item.platformPosts?.some(
                (p) => p.platform === set.targetPlatform,
              ),
            ).length;
            return (
              <Link
                key={set.id}
                href={`/post-sets/${set.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 hover:shadow-md"
              >
                <h3 className="font-medium">{set.name}</h3>
                {set.targetPlatform && (
                  <p className="text-sm text-zinc-500">{set.targetPlatform}</p>
                )}
                <p className="mt-2 text-sm text-zinc-600">
                  {items.length} photos · {posted}/{items.length} posted
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
