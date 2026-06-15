import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { ah } from "../http.js";

export const surfacesRouter = Router();

surfacesRouter.post(
  "/",
  ah(async (req, res) => {
    const body = z
      .object({
        roomId: z.string().uuid(),
        name: z.string().min(1),
        areaM2: z.number().nonnegative().optional(),
      })
      .parse(req.body);
    const [row] = await db.insert(schema.surfaces).values(body).returning();
    res.status(201).json(row);
  }),
);

surfacesRouter.patch(
  "/:id",
  ah(async (req, res) => {
    const body = z
      .object({ name: z.string().min(1).optional(), areaM2: z.number().nonnegative().optional() })
      .parse(req.body);
    const [row] = await db
      .update(schema.surfaces)
      .set(body)
      .where(eq(schema.surfaces.id, req.params.id!))
      .returning();
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(row);
  }),
);

surfacesRouter.delete(
  "/:id",
  ah(async (req, res) => {
    await db.delete(schema.surfaces).where(eq(schema.surfaces.id, req.params.id!));
    res.status(204).end();
  }),
);
