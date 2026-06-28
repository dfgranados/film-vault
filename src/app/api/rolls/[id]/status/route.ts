import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rolls } from "@/db/schema";
import { rollStatuses } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { status } = await request.json();
  const db = await getDb();

  if (!rollStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await db
    .update(rolls)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(rolls.id, id));

  return NextResponse.json({ ok: true });
}
