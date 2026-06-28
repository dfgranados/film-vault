import Link from "next/link";
import { eq } from "drizzle-orm";
import { RollCard } from "@/components/RollCard";
import { getDb } from "@/db";
import { cameras, filmStocks, locations, photos, rolls } from "@/db/schema";
import { getLocationDisplay } from "@/lib/location";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const db = await getDb();

  const allRollsRaw = await db
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
    allRollsRaw.map(async (row) => {
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

  allRolls.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const awaitingScans = allRolls.filter(
    (r) => r.status === "planned" || r.status === "exposed",
  );
  const recentRolls = allRolls.slice(0, 6);
  const totalPhotos = (await db.select().from(photos)).length;

  return {
    awaitingScans,
    recentRolls,
    totalPhotos,
    totalRolls: allRolls.length,
  };
}

export default async function DashboardPage() {
  const { awaitingScans, recentRolls, totalPhotos, totalRolls } =
    await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-zinc-500">
            {totalRolls} rolls · {totalPhotos} photos
          </p>
        </div>
        <Link
          href="/rolls/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New Roll
        </Link>
      </div>

      {awaitingScans.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-medium">Awaiting scans</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {awaitingScans.map((roll) => (
              <RollCard key={roll.id} roll={roll} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent rolls</h2>
          <Link
            href="/rolls"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            View all
          </Link>
        </div>
        {recentRolls.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center">
            <p className="text-zinc-500">No rolls yet.</p>
            <Link
              href="/rolls/new"
              className="mt-2 inline-block text-sm font-medium text-zinc-900"
            >
              Create your first roll →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentRolls.map((roll) => (
              <RollCard key={roll.id} roll={roll} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
