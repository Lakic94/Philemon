import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { computeRoomGeometry } from "../geometry.js";
import { ah } from "../http.js";

export const roomsRouter = Router();

const pointSchema = z.tuple([z.number(), z.number()]);
const polygonSchema = z.array(pointSchema);

/** Full nested tree: rooms → zones → items, plus surfaces and computed geometry. */
roomsRouter.get(
  "/",
  ah(async (_req, res) => {
    const [rms, zns, srf, its] = await Promise.all([
      db.select().from(schema.rooms).orderBy(asc(schema.rooms.sortOrder)),
      db.select().from(schema.zones).orderBy(asc(schema.zones.sortOrder)),
      db.select().from(schema.surfaces).orderBy(asc(schema.surfaces.name)),
      db.select().from(schema.items).orderBy(asc(schema.items.createdAt)),
    ]);
    const tree = rms.map((r) => ({
      ...r,
      geometry: computeRoomGeometry(r.polygon ?? null, r.columns ?? [], r.heightCm, r.floorAreaM2),
      surfaces: srf.filter((s) => s.roomId === r.id),
      zones: zns
        .filter((z) => z.roomId === r.id)
        .map((z) => ({ ...z, items: its.filter((i) => i.zoneId === z.id) })),
    }));
    res.json(tree);
  }),
);

roomsRouter.post(
  "/",
  ah(async (req, res) => {
    const body = z
      .object({ name: z.string().min(1), sortOrder: z.number().int().optional() })
      .parse(req.body);
    const [row] = await db.insert(schema.rooms).values(body).returning();
    res.status(201).json(row);
  }),
);

roomsRouter.patch(
  "/:id",
  ah(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).optional(),
        polygon: polygonSchema.nullable().optional(),
        columns: z.array(polygonSchema).optional(),
        heightCm: z.number().int().positive().nullable().optional(),
        floorAreaM2: z.number().nonnegative().nullable().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(req.body);
    const [row] = await db
      .update(schema.rooms)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.rooms.id, req.params.id!))
      .returning();
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json({ ...row, geometry: computeRoomGeometry(row.polygon ?? null, row.columns ?? [], row.heightCm, row.floorAreaM2) });
  }),
);

roomsRouter.delete(
  "/:id",
  ah(async (req, res) => {
    await db.delete(schema.rooms).where(eq(schema.rooms.id, req.params.id!));
    res.status(204).end();
  }),
);
