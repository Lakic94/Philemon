import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { ah } from "../http.js";

export const zonesRouter = Router();

zonesRouter.post(
  "/",
  ah(async (req, res) => {
    const body = z
      .object({
        roomId: z.string().uuid(),
        name: z.string().min(1),
        budgetTargetCents: z.number().int().nonnegative().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(req.body);
    const [row] = await db.insert(schema.zones).values(body).returning();
    res.status(201).json(row);
  }),
);

zonesRouter.patch(
  "/:id",
  ah(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).optional(),
        budgetTargetCents: z.number().int().nonnegative().optional(),
        sortOrder: z.number().int().optional(),
        roomId: z.string().uuid().optional(),
      })
      .parse(req.body);
    const [row] = await db
      .update(schema.zones)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.zones.id, req.params.id!))
      .returning();
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(row);
  }),
);

zonesRouter.delete(
  "/:id",
  ah(async (req, res) => {
    await db.delete(schema.zones).where(eq(schema.zones.id, req.params.id!));
    res.status(204).end();
  }),
);
