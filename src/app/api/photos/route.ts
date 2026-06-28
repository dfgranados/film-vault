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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rollId = searchParams.get("rollId");
  const cameraId = searchParams.get("cameraId");
  const filmStockId = searchParams.get("filmStockId");
  const locationId = searchParams.get("locationId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const favoritesOnly = searchParams.get("favorites") === "true";
  const minRating = searchParams.get("minRating");

  const db = await getDb();

  const results = await db
    .select({
      photo: photos,
      roll: rolls,
      camera: cameras,
      filmStock: filmStocks,
      location: locations,
    })
    .from(photos)
    .innerJoin(rolls, eq(photos.rollId, rolls.id))
    .leftJoin(cameras, eq(rolls.cameraId, cameras.id))
    .leftJoin(filmStocks, eq(rolls.filmStockId, filmStocks.id))
    .leftJoin(locations, eq(rolls.locationId, locations.id));

  let filtered = results;

  if (rollId) filtered = filtered.filter((r) => r.roll.id === rollId);
  if (cameraId) filtered = filtered.filter((r) => r.roll.cameraId === cameraId);
  if (filmStockId)
    filtered = filtered.filter((r) => r.roll.filmStockId === filmStockId);
  if (locationId)
    filtered = filtered.filter((r) => r.roll.locationId === locationId);
  if (dateFrom)
    filtered = filtered.filter(
      (r) => r.roll.shotDate && r.roll.shotDate >= dateFrom,
    );
  if (dateTo)
    filtered = filtered.filter(
      (r) => r.roll.shotDate && r.roll.shotDate <= dateTo,
    );
  if (favoritesOnly) filtered = filtered.filter((r) => r.photo.isFavorite);
  if (minRating)
    filtered = filtered.filter(
      (r) => r.photo.rating && r.photo.rating >= Number(minRating),
    );

  const withVariants = await Promise.all(
    filtered.map(async (row) => {
      const variants = await db
        .select()
        .from(photoVariants)
        .where(eq(photoVariants.photoId, row.photo.id));
      const primary = variants.find((v) => v.isPrimary) ?? variants[0] ?? null;
      return {
        ...row.photo,
        roll: {
          ...row.roll,
          locationDisplay: await getLocationDisplay(row.roll.locationId),
        },
        camera: row.camera,
        filmStock: row.filmStock,
        location: row.location,
        variants,
        primaryVariant: primary,
      };
    }),
  );

  return NextResponse.json(
    withVariants.sort((a, b) => {
      const dateCompare = (b.roll.shotDate ?? "").localeCompare(
        a.roll.shotDate ?? "",
      );
      if (dateCompare !== 0) return dateCompare;
      return a.frameNumber - b.frameNumber;
    }),
  );
}
