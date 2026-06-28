import Link from "next/link";
import { eq } from "drizzle-orm";
import { RollCard } from "@/components/RollCard";
import { getDb } from "@/db";
import { cameras, filmStocks, locations, photos, rolls } from "@/db/schema";
import { getLocationDisplay } from "@/lib/location";

export const dynamic = "force-dynamic";

async function getRolls() {
  const db = await getDb();
  const rows = await db
    .select({
      roll: rolls,
      camera: cameras,
      filmStock: filmStocks,
      location: locations,
    })
    .from(rolls)
    .leftJoin(cameras, eq(rolls.cameraId, cameras.id))
    .leftJoin(filmStocks, eq(rolls.filmStockId, filmStocks.id))
    .leftJoin(locations, eq(rolls.locationId, locations.id));

  const allRolls = await Promise.all(
    rows.map(async (row) => {
      const photoList = await db
        .select()
        .from(photos)
        .where(eq(photos.rollId, row.roll.id));
      return {
        ...row.roll,
        camera: row.camera,
        filmStock: row.filmStock,
        location: row.location,
        locationDisplay: await getLocationDisplay(row.roll.locationId),
        photoCount: photoList.length,
      };
    }),
  );

  return allRolls.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default async function RollsPage() {
  const allRolls = await getRolls();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rolls</h1>
        <Link
          href="/rolls/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New Roll
        </Link>
      </div>

      {allRolls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-zinc-500">
          No rolls yet. Create one before your next shoot.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allRolls.map((roll) => (
            <RollCard key={roll.id} roll={roll} />
          ))}
        </div>
      )}
    </div>
  );
}
