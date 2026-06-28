import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { cameras } from "@/db/schema";

export async function GET() {
  const db = await getDb();
  const items = await db.select().from(cameras);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await getDb();
  const camera = {
    id: uuidv4(),
    name: body.name,
    lens: body.lens ?? null,
    notes: body.notes ?? null,
  };
  await db.insert(cameras).values(camera);
  return NextResponse.json(camera, { status: 201 });
}
