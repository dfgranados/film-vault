import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { locations } from "@/db/schema";

export async function GET() {
  const db = await getDb();
  const items = await db.select().from(locations);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await getDb();
  const location = {
    id: uuidv4(),
    name: body.name,
    parentId: body.parentId ?? null,
  };
  await db.insert(locations).values(location);
  return NextResponse.json(location, { status: 201 });
}
