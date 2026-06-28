import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { ensureLibraryStructure, getDbPath } from "@/lib/config";

let client: Client | null = null;
let db: LibSQLDatabase<typeof schema> | null = null;
let initPromise: Promise<LibSQLDatabase<typeof schema>> | null = null;

const migrations = [
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lens TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS film_stocks (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    iso INTEGER,
    type TEXT DEFAULT 'color',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES locations(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS rolls (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    shot_date TEXT,
    notes TEXT,
    camera_id TEXT REFERENCES cameras(id),
    film_stock_id TEXT REFERENCES film_stocks(id),
    location_id TEXT REFERENCES locations(id),
    shot_iso INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    roll_id TEXT NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    caption TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    rating INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS photo_variants (
    id TEXT PRIMARY KEY,
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    file_path TEXT NOT NULL,
    checksum TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS post_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_platform TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS post_set_items (
    id TEXT PRIMARY KEY,
    post_set_id TEXT NOT NULL REFERENCES post_sets(id) ON DELETE CASCADE,
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    crop_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS platform_posts (
    id TEXT PRIMARY KEY,
    post_set_item_id TEXT NOT NULL REFERENCES post_set_items(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    posted_at TEXT,
    url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_photos_roll_id ON photos(roll_id)`,
  `CREATE INDEX IF NOT EXISTS idx_photo_variants_photo_id ON photo_variants(photo_id)`,
  `CREATE INDEX IF NOT EXISTS idx_photo_variants_checksum ON photo_variants(checksum)`,
  `CREATE INDEX IF NOT EXISTS idx_rolls_status ON rolls(status)`,
  `CREATE INDEX IF NOT EXISTS idx_post_set_items_post_set_id ON post_set_items(post_set_id)`,
];

export async function getDb() {
  if (db) return db;
  if (!initPromise) {
    initPromise = (async () => {
      ensureLibraryStructure();
      const dbPath = getDbPath();
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });

      client = createClient({ url: `file:${dbPath}` });
      for (const sql of migrations) {
        await client.execute(sql);
      }

      try {
        await client.execute(`ALTER TABLE rolls ADD COLUMN shot_iso INTEGER`);
      } catch {
        // column already exists
      }

      db = drizzle(client, { schema });
      return db;
    })();
  }
  return initPromise;
}

export type Db = Awaited<ReturnType<typeof getDb>>;
