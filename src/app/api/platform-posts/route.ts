import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { platformPosts } from "@/db/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const db = await getDb();

  const post = {
    id: uuidv4(),
    postSetItemId: body.postSetItemId,
    platform: body.platform,
    postedAt: body.postedAt ?? new Date().toISOString(),
    url: body.url ?? null,
    notes: body.notes ?? null,
  };

  await db.insert(platformPosts).values(post);
  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const db = await getDb();
  await db.delete(platformPosts).where(eq(platformPosts.id, id));
  return NextResponse.json({ ok: true });
}
