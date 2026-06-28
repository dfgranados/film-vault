import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { photos, platformPosts, postSetItems, postSets } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();

  const setRows = await db
    .select()
    .from(postSets)
    .where(eq(postSets.id, id))
    .limit(1);
  const set = setRows[0];
  if (!set) {
    return NextResponse.json({ error: "Post set not found" }, { status: 404 });
  }

  const items = (
    await db
      .select({ item: postSetItems, photo: photos })
      .from(postSetItems)
      .innerJoin(photos, eq(postSetItems.photoId, photos.id))
      .where(eq(postSetItems.postSetId, id))
  ).sort((a, b) => a.item.sortOrder - b.item.sortOrder);

  const itemsWithPosts = await Promise.all(
    items.map(async ({ item, photo }) => ({
      ...item,
      photo,
      platformPosts: await db
        .select()
        .from(platformPosts)
        .where(eq(platformPosts.postSetItemId, item.id)),
    })),
  );

  return NextResponse.json({ ...set, items: itemsWithPosts });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const db = await getDb();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.targetPlatform !== undefined)
    updates.targetPlatform = body.targetPlatform;
  if (body.notes !== undefined) updates.notes = body.notes;

  await db.update(postSets).set(updates).where(eq(postSets.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await getDb();
  await db.delete(postSets).where(eq(postSets.id, id));
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const db = await getDb();

  const existing = await db
    .select()
    .from(postSetItems)
    .where(eq(postSetItems.postSetId, id));
  const maxOrder =
    existing.length > 0 ? Math.max(...existing.map((i) => i.sortOrder)) : -1;

  const item = {
    id: uuidv4(),
    postSetId: id,
    photoId: body.photoId,
    sortOrder: body.sortOrder ?? maxOrder + 1,
    cropNotes: body.cropNotes ?? null,
  };

  await db.insert(postSetItems).values(item);
  return NextResponse.json(item, { status: 201 });
}
