import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { ah } from "../http.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  ah(async (_req, res) => {
    const rows = await db.select().from(schema.categories).orderBy(asc(schema.categories.name));
    res.json(rows);
  }),
);

categoriesRouter.post(
  "/",
  ah(async (req, res) => {
    const body = z.object({ name: z.string().min(1) }).parse(req.body);
    const [row] = await db
      .insert(schema.categories)
      .values({ name: body.name, userCreated: true })
      .returning();
    res.status(201).json(row);
  }),
);

categoriesRouter.delete(
  "/:id",
  ah(async (req, res) => {
    await db.delete(schema.categories).where(eq(schema.categories.id, req.params.id!));
    res.status(204).end();
  }),
);
