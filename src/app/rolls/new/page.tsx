"use client";

import { useRouter } from "next/navigation";
import { RollForm } from "@/components/RollForm";

export default function NewRollPage() {
  const router = useRouter();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await fetch("/api/rolls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const roll = await res.json();
    router.push(`/rolls/${roll.id}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">New Roll</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <RollForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
