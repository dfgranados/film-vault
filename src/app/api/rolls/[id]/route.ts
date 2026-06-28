import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  cameras,
  filmStocks,
  locations,
  photos,
  photoVariants,
  rolls,
} from "@/db/schema";
import { getLocationDisplay } from "@/lib/location";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
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
    .leftJoin(locations, eq(rolls.locationId, locations.id))
    .where(eq(rolls.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Roll not found" }, { status: 404 });
  }

  const rollPhotos = (
    await db.select().from(photos).where(eq(photos.rollId, id))
  ).sort((a, b) => a.frameNumber - b.frameNumber);

  const photosWithVariants = await Promise.all(
    rollPhotos.map(async (photo) => {
      const variants = await db
        .select()
        .from(photoVariants)
        .where(eq(photoVariants.photoId, photo.id));
      return { ...photo, variants };
    }),
  );

  return NextResponse.json({
    ...row.roll,
    camera: row.camera,
    filmStock: row.filmStock,
    location: row.location,
    locationDisplay: await getLocationDisplay(row.roll.locationId),
    photos: photosWithVariants,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const db = await getDb();

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (body.title !== undefined) updates.title = body.title;
  if (body.status !== undefined) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.shotDate !== undefined) updates.shotDate = body.shotDate;
  if (body.cameraId !== undefined) updates.cameraId = body.cameraId;
  if (body.filmStockId !== undefined) updates.filmStockId = body.filmStockId;
  if (body.locationId !== undefined) updates.locationId = body.locationId;
  if (body.shotIso !== undefined) {
    updates.shotIso =
      body.shotIso === null || body.shotIso === ""
        ? null
        : Number(body.shotIso);
  }

  await db.update(rolls).set(updates).where(eq(rolls.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  await db.delete(rolls).where(eq(rolls.id, id));
  return NextResponse.json({ ok: true });
}
