import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { ah } from "../http.js";

export const itemsRouter = Router();

const base = {
  name: z.string().min(1),
  categoryId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive().optional(),
  kind: z.enum(["flat", "area"]).optional(),
  estimatedCents: z.number().int().nonnegative().optional(),
  actualCents: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(["needed", "ordered", "bought"]).optional(),
  areaM2: z.number().nonnegative().nullable().optional(),
  ratePerM2Cents: z.number().int().nonnegative().nullable().optional(),
  surfaceId: z.string().uuid().nullable().optional(),
  imageKeys: z.array(z.string()).optional(),
  productUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
};

itemsRouter.post(
  "/",
  ah(async (req, res) => {
    const body = z.object({ zoneId: z.string().uuid(), ...base }).parse(req.body);
    const [row] = await db.insert(schema.items).values(body).returning();
    res.status(201).json(row);
  }),
);

itemsRouter.patch(
  "/:id",
  ah(async (req, res) => {
    const body = z.object({ zoneId: z.string().uuid().optional(), ...base }).partial().parse(req.body);
    const [row] = await db
      .update(schema.items)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.items.id, req.params.id!))
      .returning();
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(row);
  }),
);

itemsRouter.delete(
  "/:id",
  ah(async (req, res) => {
    await db.delete(schema.items).where(eq(schema.items.id, req.params.id!));
    res.status(204).end();
  }),
);
