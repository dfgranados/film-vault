import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rollStatuses = [
  "planned",
  "exposed",
  "scanned",
  "complete",
] as const;
export type RollStatus = (typeof rollStatuses)[number];

export const variantKinds = [
  "original_scan",
  "lightroom_edit",
  "social_export",
] as const;
export type VariantKind = (typeof variantKinds)[number];

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const cameras = sqliteTable("cameras", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lens: text("lens"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const filmStocks = sqliteTable("film_stocks", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  iso: integer("iso"),
  type: text("type").default("color"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id").references(
    (): ReturnType<typeof text> => locations.id,
  ),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rolls = sqliteTable("rolls", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").notNull().default("planned"),
  shotDate: text("shot_date"),
  notes: text("notes"),
  cameraId: text("camera_id").references(() => cameras.id),
  filmStockId: text("film_stock_id").references(() => filmStocks.id),
  locationId: text("location_id").references(() => locations.id),
  shotIso: integer("shot_iso"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  rollId: text("roll_id")
    .notNull()
    .references(() => rolls.id, { onDelete: "cascade" }),
  frameNumber: integer("frame_number").notNull(),
  caption: text("caption"),
  isFavorite: integer("is_favorite", { mode: "boolean" })
    .notNull()
    .default(false),
  rating: integer("rating"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const photoVariants = sqliteTable("photo_variants", {
  id: text("id").primaryKey(),
  photoId: text("photo_id")
    .notNull()
    .references(() => photos.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  filePath: text("file_path").notNull(),
  checksum: text("checksum").notNull(),
  width: integer("width"),
  height: integer("height"),
  isPrimary: integer("is_primary", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const postSets = sqliteTable("post_sets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  targetPlatform: text("target_platform"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const postSetItems = sqliteTable("post_set_items", {
  id: text("id").primaryKey(),
  postSetId: text("post_set_id")
    .notNull()
    .references(() => postSets.id, { onDelete: "cascade" }),
  photoId: text("photo_id")
    .notNull()
    .references(() => photos.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  cropNotes: text("crop_notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const platformPosts = sqliteTable("platform_posts", {
  id: text("id").primaryKey(),
  postSetItemId: text("post_set_item_id")
    .notNull()
    .references(() => postSetItems.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  postedAt: text("posted_at"),
  url: text("url"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const camerasRelations = relations(cameras, ({ many }) => ({
  rolls: many(rolls),
}));

export const filmStocksRelations = relations(filmStocks, ({ many }) => ({
  rolls: many(rolls),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "locationHierarchy",
  }),
  children: many(locations, { relationName: "locationHierarchy" }),
  rolls: many(rolls),
}));

export const rollsRelations = relations(rolls, ({ one, many }) => ({
  camera: one(cameras, {
    fields: [rolls.cameraId],
    references: [cameras.id],
  }),
  filmStock: one(filmStocks, {
    fields: [rolls.filmStockId],
    references: [filmStocks.id],
  }),
  location: one(locations, {
    fields: [rolls.locationId],
    references: [locations.id],
  }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  roll: one(rolls, {
    fields: [photos.rollId],
    references: [rolls.id],
  }),
  variants: many(photoVariants),
  postSetItems: many(postSetItems),
}));

export const photoVariantsRelations = relations(photoVariants, ({ one }) => ({
  photo: one(photos, {
    fields: [photoVariants.photoId],
    references: [photos.id],
  }),
}));

export const postSetsRelations = relations(postSets, ({ many }) => ({
  items: many(postSetItems),
}));

export const postSetItemsRelations = relations(
  postSetItems,
  ({ one, many }) => ({
    postSet: one(postSets, {
      fields: [postSetItems.postSetId],
      references: [postSets.id],
    }),
    photo: one(photos, {
      fields: [postSetItems.photoId],
      references: [photos.id],
    }),
    platformPosts: many(platformPosts),
  }),
);

export const platformPostsRelations = relations(platformPosts, ({ one }) => ({
  postSetItem: one(postSetItems, {
    fields: [platformPosts.postSetItemId],
    references: [postSetItems.id],
  }),
}));
