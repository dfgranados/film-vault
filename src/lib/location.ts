import { getDb } from "@/db";
import { locations } from "@/db/schema";

export async function getLocationPath(
  locationId: string | null,
): Promise<string[]> {
  if (!locationId) return [];
  const db = await getDb();
  const allLocations = await db.select().from(locations);
  const byId = new Map(allLocations.map((l) => [l.id, l]));

  const names: string[] = [];
  let currentId: string | null = locationId;

  while (currentId) {
    const loc = byId.get(currentId);
    if (!loc) break;
    names.unshift(loc.name);
    currentId = loc.parentId;
  }

  return names;
}

export async function getLocationDisplay(
  locationId: string | null,
): Promise<string> {
  const path = await getLocationPath(locationId);
  return path.join(" → ") || "—";
}
