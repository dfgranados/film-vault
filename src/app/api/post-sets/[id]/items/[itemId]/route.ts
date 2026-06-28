import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { postSetItems } from "@/db/schema";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { itemId } = await params;
  const body = await request.json();
  const db = await getDb();

  const updates: Record<string, unknown> = {};
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.cropNotes !== undefined) updates.cropNotes = body.cropNotes;

  await db.update(postSetItems).set(updates).where(eq(postSetItems.id, itemId));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { itemId } = await params;
  const db = await getDb();
  await db.delete(postSetItems).where(eq(postSetItems.id, itemId));
  return NextResponse.json({ ok: true });
}
