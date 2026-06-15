import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

for (const rel of ["../../../.env", "../../.env", "../.env", ".env"]) {
  const p = resolve(process.cwd(), rel);
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // This DB is shared with Better Auth (user/session/account/verification/passkey).
  // Restrict drizzle-kit to ONLY the planner's tables so it never touches auth tables.
  tablesFilter: ["categories", "rooms", "zones", "surfaces", "items"],
});
