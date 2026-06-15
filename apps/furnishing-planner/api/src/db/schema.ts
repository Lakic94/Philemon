import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Polygon } from "@philemon/types";

const ts = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  userCreated: boolean("user_created").notNull().default(true),
  createdAt: ts(),
});

export const rooms = pgTable("rooms", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  polygon: jsonb().$type<Polygon>(),
  columns: jsonb().$type<Polygon[]>().notNull().default(sql`'[]'::jsonb`),
  heightCm: integer("height_cm"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: ts(),
  updatedAt: ts(),
});

export const zones = pgTable("zones", {
  id: uuid().primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  name: text().notNull(),
  budgetTargetCents: integer("budget_target_cents").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: ts(),
  updatedAt: ts(),
});

export const surfaces = pgTable("surfaces", {
  id: uuid().primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  name: text().notNull(),
  areaM2: real("area_m2").notNull().default(0),
  createdAt: ts(),
});

export const items = pgTable("items", {
  id: uuid().primaryKey().defaultRandom(),
  zoneId: uuid("zone_id")
    .notNull()
    .references(() => zones.id, { onDelete: "cascade" }),
  name: text().notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  quantity: integer().notNull().default(1),
  kind: text().notNull().default("flat"), // 'flat' | 'area'
  estimatedCents: integer("estimated_cents").notNull().default(0),
  actualCents: integer("actual_cents"),
  status: text().notNull().default("needed"), // 'needed' | 'ordered' | 'bought'
  areaM2: real("area_m2"),
  ratePerM2Cents: integer("rate_per_m2_cents"),
  surfaceId: uuid("surface_id").references(() => surfaces.id, { onDelete: "set null" }),
  imageKey: text("image_key"),
  productUrl: text("product_url"),
  notes: text(),
  createdAt: ts(),
  updatedAt: ts(),
});
