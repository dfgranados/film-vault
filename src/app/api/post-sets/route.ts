import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { photos, platformPosts, postSetItems, postSets } from "@/db/schema";

export async function GET() {
  const db = await getDb();
  const sets = await db.select().from(postSets);

  const withItems = await Promise.all(
    sets.map(async (set) => {
      const items = (
        await db
          .select({
            item: postSetItems,
            photo: photos,
          })
          .from(postSetItems)
          .innerJoin(photos, eq(postSetItems.photoId, photos.id))
          .where(eq(postSetItems.postSetId, set.id))
      ).sort((a, b) => a.item.sortOrder - b.item.sortOrder);

      const itemsWithPosts = await Promise.all(
        items.map(async ({ item, photo }) => {
          const posts = await db
            .select()
            .from(platformPosts)
            .where(eq(platformPosts.postSetItemId, item.id));
          return { ...item, photo, platformPosts: posts };
        }),
      );

      return { ...set, items: itemsWithPosts };
    }),
  );

  return NextResponse.json(withItems);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await getDb();
  const postSet = {
    id: uuidv4(),
    name: body.name,
    targetPlatform: body.targetPlatform ?? null,
    notes: body.notes ?? null,
  };
  await db.insert(postSets).values(postSet);
  return NextResponse.json(postSet, { status: 201 });
}
