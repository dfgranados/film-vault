import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { getLibraryRoot, getLibraryPaths } from "@/lib/config";

export async function GET() {
  const db = await getDb();
  const rows = await db.select().from(settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const paths = getLibraryPaths(stored.libraryRoot ?? getLibraryRoot());

  return NextResponse.json({
    libraryRoot: stored.libraryRoot ?? getLibraryRoot(),
    importInbox: stored.importInbox ?? "",
    paths,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const db = await getDb();

  if (body.libraryRoot) {
    await db
      .insert(settings)
      .values({ key: "libraryRoot", value: body.libraryRoot })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: body.libraryRoot },
      });
  }

  if (body.importInbox !== undefined) {
    await db
      .insert(settings)
      .values({ key: "importInbox", value: body.importInbox })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: body.importInbox },
      });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const db = await getDb();
  await db.delete(settings).where(eq(settings.key, "libraryRoot"));
  return NextResponse.json({ ok: true });
}
