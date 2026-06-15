import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const repoRoot = resolve(__dirname, "../../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  return {
    plugins: [react()],
    // Read VITE_* vars from the repo-root .env (shared across the monorepo).
    envDir: repoRoot,
    server: { port: Number(env.WEB_PORT ?? 5173) },
  };
});
