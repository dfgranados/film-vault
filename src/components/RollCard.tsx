import Link from "next/link";
import type { Roll } from "@/types";
import { formatRollFilmLine } from "@/lib/film";
import { StatusBadge } from "./StatusBadge";

export function RollCard({ roll }: { roll: Roll }) {
  return (
    <Link
      href={`/rolls/${roll.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-900">{roll.title}</h3>
        <StatusBadge status={roll.status} />
      </div>
      <p className="text-sm text-zinc-500">{roll.slug}</p>
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
        <p className="text-zinc-400">{roll.photoCount ?? 0} photos</p>
      </div>
    </Link>
  );
}
