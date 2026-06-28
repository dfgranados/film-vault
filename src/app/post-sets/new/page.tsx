"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLATFORMS } from "@/lib/constants";

export default function NewPostSetPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/post-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        targetPlatform: targetPlatform || null,
        notes,
      }),
    });
    const set = await res.json();
    router.push(`/post-sets/${set.id}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">New Post Set</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Japan trip carousel"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Target platform
          </label>
          <select
            value={targetPlatform}
            onChange={(e) => setTargetPlatform(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="4:5 crop, carousel of 10..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </div>
  );
}
