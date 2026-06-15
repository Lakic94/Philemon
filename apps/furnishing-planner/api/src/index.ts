import cors from "cors";
import express from "express";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "./env.js";
import { requireAuth } from "./middleware/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { itemsRouter } from "./routes/items.js";
import { roomsRouter } from "./routes/rooms.js";
import { surfacesRouter } from "./routes/surfaces.js";
import { uploadsRouter } from "./routes/uploads.js";
import { zonesRouter } from "./routes/zones.js";

const app = express();

app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "furnishing-api" });
});

// All /api routes require a valid session (SSO via the auth service).
const api = express.Router();
api.use(requireAuth);
api.use("/categories", categoriesRouter);
api.use("/rooms", roomsRouter);
api.use("/zones", zonesRouter);
api.use("/surfaces", surfacesRouter);
api.use("/items", itemsRouter);
api.use("/uploads", uploadsRouter);
app.use("/api", api);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "validation", issues: err.issues });
    return;
  }
  console.error("[api] error:", err);
  res.status(500).json({ error: "internal" });
};
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[api] listening on http://localhost:${env.port}`);
});
