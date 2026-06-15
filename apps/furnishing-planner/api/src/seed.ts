/**
 * Seed the furnishing planner from the source Google Doc.
 * Idempotent: wipes planner tables (NOT auth tables) and reloads.
 *
 *   Rooms (physical) → Zones (budget buckets w/ targets) → Items (estimates).
 *   The m² millwork list is seeded as draft AREA items (m² filled, rate blank).
 *   Total of zone budget targets = 42,000 €.
 */
import { db, schema } from "./db/index.js";

const eur = (n: number) => n * 100; // € → cents

// ---- categories (seeded defaults; userCreated=false) ----
const CATEGORIES = [
  "Furniture",
  "Appliance",
  "Lighting",
  "Soft furnishings",
  "Millwork",
  "Sanitary",
  "Finishes",
  "Decor",
  "Other",
];

// ---- physical rooms ----
const ROOMS: { key: string; name: string; sortOrder: number }[] = [
  { key: "open", name: "Open-plan (Kitchen · Dining · Living)", sortOrder: 0 },
  { key: "bed", name: "Bedroom", sortOrder: 1 },
  { key: "office", name: "Office", sortOrder: 2 },
  { key: "hall", name: "Hallway", sortOrder: 3 },
  { key: "bath1", name: "Ensuite bathroom", sortOrder: 4 },
  { key: "bath2", name: "Second bathroom", sortOrder: 5 },
];

// ---- zones (budget buckets) → sum of targets = 42,000 € ----
const ZONES: { name: string; roomKey: string; target: number; sortOrder: number }[] = [
  { name: "Kitchen", roomKey: "open", target: 10000, sortOrder: 0 },
  { name: "Dining", roomKey: "open", target: 3400, sortOrder: 1 },
  { name: "Living", roomKey: "open", target: 6500, sortOrder: 2 },
  { name: "Bedroom", roomKey: "bed", target: 7100, sortOrder: 3 },
  { name: "Office", roomKey: "office", target: 4500, sortOrder: 4 },
  { name: "Hallway", roomKey: "hall", target: 2500, sortOrder: 5 },
  { name: "Ensuite bath", roomKey: "bath1", target: 3000, sortOrder: 6 },
  { name: "Second bath", roomKey: "bath2", target: 5000, sortOrder: 7 },
];

// ---- flat-price line items (from the doc's budget breakdown) ----
const ITEMS: { zone: string; name: string; cat: string; eur: number }[] = [
  // Kitchen (10 000)
  { zone: "Kitchen", name: "Cabinets w/ mechanism (no appliances)", cat: "Millwork", eur: 6000 },
  { zone: "Kitchen", name: "Sink", cat: "Sanitary", eur: 300 },
  { zone: "Kitchen", name: "Faucet", cat: "Sanitary", eur: 500 },
  { zone: "Kitchen", name: "Fridge", cat: "Appliance", eur: 1000 },
  { zone: "Kitchen", name: "Oven", cat: "Appliance", eur: 500 },
  { zone: "Kitchen", name: "Hob", cat: "Appliance", eur: 500 },
  { zone: "Kitchen", name: "Extractor hood", cat: "Appliance", eur: 400 },
  { zone: "Kitchen", name: "Dishwasher", cat: "Appliance", eur: 500 },
  // Dining (3 400)
  { zone: "Dining", name: "Table", cat: "Furniture", eur: 1000 },
  { zone: "Dining", name: "Chairs", cat: "Furniture", eur: 1000 },
  { zone: "Dining", name: "Chandelier", cat: "Lighting", eur: 400 },
  { zone: "Dining", name: "Bookshelves", cat: "Millwork", eur: 1000 },
  // Living (6 500 target; estimates sum to 7 000 — kept as in the doc)
  { zone: "Living", name: "TV", cat: "Appliance", eur: 1000 },
  { zone: "Living", name: "Sectional sofa", cat: "Furniture", eur: 3000 },
  { zone: "Living", name: "Wall panel", cat: "Finishes", eur: 500 },
  { zone: "Living", name: "Dresser", cat: "Furniture", eur: 1000 },
  { zone: "Living", name: "Coffee table", cat: "Furniture", eur: 500 },
  { zone: "Living", name: "Rug", cat: "Soft furnishings", eur: 1000 },
  // Bedroom (7 100)
  { zone: "Bedroom", name: "Wall panel", cat: "Finishes", eur: 500 },
  { zone: "Bedroom", name: "Mattress", cat: "Furniture", eur: 600 },
  { zone: "Bedroom", name: "Bed", cat: "Furniture", eur: 1000 },
  { zone: "Bedroom", name: "Rug", cat: "Soft furnishings", eur: 1000 },
  { zone: "Bedroom", name: "Nightstands", cat: "Furniture", eur: 1000 },
  { zone: "Bedroom", name: "Wardrobe", cat: "Millwork", eur: 2000 },
  { zone: "Bedroom", name: "TV", cat: "Appliance", eur: 1000 },
  // Office (4 500)
  { zone: "Office", name: "3-seat sofa", cat: "Furniture", eur: 1000 },
  { zone: "Office", name: "Desk", cat: "Furniture", eur: 500 },
  { zone: "Office", name: "Wardrobe", cat: "Millwork", eur: 2000 },
  { zone: "Office", name: "Rug", cat: "Soft furnishings", eur: 1000 },
  // Hallway (2 500)
  { zone: "Hallway", name: "Wall panel", cat: "Finishes", eur: 1000 },
  { zone: "Hallway", name: "Closet", cat: "Millwork", eur: 1500 },
  // Ensuite bath (3 000 — no breakdown in doc)
  { zone: "Ensuite bath", name: "Fit-out (to itemize)", cat: "Sanitary", eur: 3000 },
  // Second bath (5 000)
  { zone: "Second bath", name: "Machines (washer/dryer)", cat: "Appliance", eur: 2000 },
  { zone: "Second bath", name: "Additional", cat: "Sanitary", eur: 3000 },
];

// ---- m² millwork/surface list → draft AREA items (rate blank) ----
const AREA_ITEMS: { zone: string; name: string; cat: string; m2: number }[] = [
  { zone: "Hallway", name: "Hallway area", cat: "Finishes", m2: 17 },
  { zone: "Kitchen", name: "Kitchen fronts", cat: "Millwork", m2: 12.3 },
  { zone: "Bedroom", name: "Wall above bed", cat: "Finishes", m2: 4.35 },
  { zone: "Bedroom", name: "Wardrobe (bedroom)", cat: "Millwork", m2: 4.62 },
  { zone: "Office", name: "Wardrobe (office)", cat: "Millwork", m2: 5.4 },
  { zone: "Office", name: "Wall (office)", cat: "Finishes", m2: 6.48 },
  { zone: "Hallway", name: "Wardrobe (hallway)", cat: "Millwork", m2: 3.24 },
  { zone: "Living", name: "TV wall", cat: "Finishes", m2: 4.46 },
  { zone: "Bedroom", name: "Headboard", cat: "Millwork", m2: 3.48 },
  { zone: "Living", name: "Dresser panel", cat: "Millwork", m2: 2 },
  { zone: "Dining", name: "Bookshelf panel", cat: "Millwork", m2: 10.2 },
  { zone: "Bedroom", name: "Nightstand panel", cat: "Millwork", m2: 1.9 },
  { zone: "Ensuite bath", name: "Bathroom cabinet", cat: "Millwork", m2: 2.9 },
  { zone: "Second bath", name: "Vanity ×2", cat: "Sanitary", m2: 2.7 },
  { zone: "Office", name: "Cabinet", cat: "Millwork", m2: 5 },
];

async function seed() {
  // wipe planner tables only (FK-safe order)
  await db.delete(schema.items);
  await db.delete(schema.surfaces);
  await db.delete(schema.zones);
  await db.delete(schema.rooms);
  await db.delete(schema.categories);

  const cats = await db
    .insert(schema.categories)
    .values(CATEGORIES.map((name) => ({ name, userCreated: false })))
    .returning();
  const catId = new Map(cats.map((c) => [c.name, c.id]));

  const rooms = await db
    .insert(schema.rooms)
    .values(ROOMS.map((r) => ({ name: r.name, sortOrder: r.sortOrder })))
    .returning();
  const roomId = new Map(ROOMS.map((r, i) => [r.key, rooms[i]!.id]));

  const zones = await db
    .insert(schema.zones)
    .values(
      ZONES.map((z) => ({
        roomId: roomId.get(z.roomKey)!,
        name: z.name,
        budgetTargetCents: eur(z.target),
        sortOrder: z.sortOrder,
      })),
    )
    .returning();
  const zoneId = new Map(zones.map((z) => [z.name, z.id]));

  const flatRows = ITEMS.map((it) => ({
    zoneId: zoneId.get(it.zone)!,
    name: it.name,
    categoryId: catId.get(it.cat) ?? null,
    kind: "flat" as const,
    estimatedCents: eur(it.eur),
    status: "needed" as const,
  }));
  const areaRows = AREA_ITEMS.map((it) => ({
    zoneId: zoneId.get(it.zone)!,
    name: it.name,
    categoryId: catId.get(it.cat) ?? null,
    kind: "area" as const,
    estimatedCents: 0,
    areaM2: it.m2,
    ratePerM2Cents: null,
    status: "needed" as const,
  }));
  await db.insert(schema.items).values([...flatRows, ...areaRows]);

  const totalTarget = ZONES.reduce((s, z) => s + z.target, 0);
  const totalEstimate = ITEMS.reduce((s, i) => s + i.eur, 0);
  console.log("[seed] done:");
  console.log(`  categories: ${cats.length}`);
  console.log(`  rooms:      ${rooms.length}`);
  console.log(`  zones:      ${zones.length}  (budget targets total €${totalTarget.toLocaleString()})`);
  console.log(`  items:      ${flatRows.length} flat + ${areaRows.length} area-draft`);
  console.log(`  estimates total: €${totalEstimate.toLocaleString()}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("[seed] failed:", e);
  process.exit(1);
});
