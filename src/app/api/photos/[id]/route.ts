import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { photos, photoVariants } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  const photoRows = await db
    .select()
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);
  const photo = photoRows[0];
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
  const variants = await db
    .select()
    .from(photoVariants)
    .where(eq(photoVariants.photoId, id));
  return NextResponse.json({ ...photo, variants });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const db = await getDb();

  const updates: Record<string, unknown> = {};
  if (body.caption !== undefined) updates.caption = body.caption;
  if (body.isFavorite !== undefined) updates.isFavorite = body.isFavorite;
  if (body.rating !== undefined) updates.rating = body.rating;
  if (body.frameNumber !== undefined) updates.frameNumber = body.frameNumber;

  if (Object.keys(updates).length > 0) {
    await db.update(photos).set(updates).where(eq(photos.id, id));
  }

  if (body.primaryVariantId) {
    await db
      .update(photoVariants)
      .set({ isPrimary: false })
      .where(eq(photoVariants.photoId, id));
    await db
      .update(photoVariants)
      .set({ isPrimary: true })
      .where(eq(photoVariants.id, body.primaryVariantId));
  }

  return NextResponse.json({ ok: true });
}
