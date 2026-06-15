import { config } from "dotenv";
import { resolve } from "node:path";

// pnpm runs each package with cwd = package dir; the shared .env is at the repo root.
config({ path: resolve(process.cwd(), "../../.env") });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  authSecret: required("AUTH_SECRET"),
  authUrl: process.env.AUTH_URL ?? "http://localhost:4000",
  rpId: process.env.AUTH_RP_ID ?? "localhost",
  rpName: process.env.AUTH_RP_NAME ?? "Philemon",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  port: Number(process.env.AUTH_PORT ?? 4000),
};
