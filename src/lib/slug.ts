export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function formatDateForSlug(date: string): string {
  return date.slice(0, 10);
}

export async function generateRollSlug(
  shotDate: string,
  filmName: string | undefined,
  locationName: string | undefined,
  existingSlugs: string[],
): Promise<string> {
  const datePart = formatDateForSlug(shotDate);
  const filmPart = slugify(filmName ?? "unknown-film");
  const locationPart = slugify(locationName ?? "unknown-location");
  const base = `${datePart}-${filmPart}-${locationPart}`;

  let slug = base;
  let counter = 1;
  while (existingSlugs.includes(slug)) {
    counter += 1;
    slug = `${base}-${String(counter).padStart(2, "0")}`;
  }
  return slug;
}
