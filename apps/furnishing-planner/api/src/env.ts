import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Find the repo-root .env regardless of how deep this package sits.
for (const rel of ["../../../.env", "../../.env", "../.env", ".env"]) {
  const p = resolve(process.cwd(), rel);
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  authUrl: process.env.AUTH_URL ?? "http://localhost:4000",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  port: Number(process.env.API_PORT ?? 4001),
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    region: process.env.S3_REGION ?? "us-east-1",
    accessKey: required("S3_ACCESS_KEY"),
    secretKey: required("S3_SECRET_KEY"),
    bucket: process.env.S3_BUCKET ?? "furnishing",
  },
};
