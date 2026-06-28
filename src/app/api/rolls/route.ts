import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { cameras, filmStocks, locations, photos, rolls } from "@/db/schema";
import { generateRollSlug } from "@/lib/slug";
import { getLocationDisplay } from "@/lib/location";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

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

  const filtered = status
    ? allRollsRaw.filter((r) => r.roll.status === status)
    : allRollsRaw;

  const withCounts = await Promise.all(
    filtered.map(async (row) => {
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

  return NextResponse.json(
    withCounts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await getDb();

  const slugRows = await db.select({ slug: rolls.slug }).from(rolls);
  const existingSlugs = slugRows.map((r) => r.slug);

  const filmRows = body.filmStockId
    ? await db
        .select()
        .from(filmStocks)
        .where(eq(filmStocks.id, body.filmStockId))
        .limit(1)
    : [];
  const film = filmRows[0];

  const locationRows = body.locationId
    ? await db
        .select()
        .from(locations)
        .where(eq(locations.id, body.locationId))
        .limit(1)
    : [];
  const location = locationRows[0];

  const shotDate = body.shotDate ?? new Date().toISOString().slice(0, 10);
  const filmName = film ? `${film.brand}-${film.name}` : undefined;
  const slug = await generateRollSlug(
    shotDate,
    filmName,
    location?.name,
    existingSlugs,
  );

  const roll = {
    id: uuidv4(),
    slug,
    title: body.title,
    status: body.status ?? "planned",
    shotDate,
    notes: body.notes ?? null,
    cameraId: body.cameraId ?? null,
    filmStockId: body.filmStockId ?? null,
    locationId: body.locationId ?? null,
    shotIso:
      body.shotIso !== undefined && body.shotIso !== null && body.shotIso !== ""
        ? Number(body.shotIso)
        : (film?.iso ?? null),
  };

  await db.insert(rolls).values(roll);
  return NextResponse.json(roll, { status: 201 });
}
