import type { FilmStock } from "@/types";

export function formatRollFilmLine(
  filmStock: FilmStock | null | undefined,
  shotIso: number | null | undefined,
): string | null {
  if (!filmStock) return null;

  const name = `${filmStock.brand} ${filmStock.name}`;
  const ratedIso = filmStock.iso;
  const effectiveShot = shotIso ?? ratedIso;

  if (effectiveShot != null && ratedIso != null && effectiveShot !== ratedIso) {
    return `${name} · shot at ISO ${effectiveShot}`;
  }

  if (effectiveShot != null) {
    return `${name} · ISO ${effectiveShot}`;
  }

  return name;
}
