import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { env } from "./env.js";

const app = express();

app.use(
  cors({
    origin: env.webOrigin,
    credentials: true,
  }),
);

// Better Auth must be mounted BEFORE any body parser (it reads the raw body).
app.all("/api/auth/*", toNodeHandler(auth));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "auth" });
});

app.listen(env.port, () => {
  console.log(`[auth] listening on http://localhost:${env.port}`);
  console.log(`[auth] passkey rpID=${env.rpId} origin=${env.webOrigin}`);
});
