import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { filmStocks } from "@/db/schema";

export async function GET() {
  const db = await getDb();
  const items = await db.select().from(filmStocks);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await getDb();
  const film = {
    id: uuidv4(),
    brand: body.brand,
    name: body.name,
    iso: body.iso ?? null,
    type: body.type ?? "color",
    notes: body.notes ?? null,
  };
  await db.insert(filmStocks).values(film);
  return NextResponse.json(film, { status: 201 });
}
