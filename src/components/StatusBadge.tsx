import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-700"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
