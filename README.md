# Philemon

A personal **everything-app platform** — a monorepo where I build whatever I need,
from simple tools to complex apps, with a shared design system and central auth.
Local-first, deployed later to a Hetzner VPS (Docker → k3s) as a cloud-infra learning project.

## Layout

```
services/auth/                 central auth (Better Auth: passkeys + magic-link), SSO
apps/furnishing-planner/web/   React + Vite
apps/furnishing-planner/api/   Express + Postgres (Drizzle) + MinIO
packages/ui                    shared design system (see STYLE.md)
packages/types                 shared TypeScript domain types
packages/auth-client           session helpers for apps
infra/                         docker-compose (Postgres + MinIO)
```

Docs: [`DESIGN.md`](./DESIGN.md) · [`STYLE.md`](./STYLE.md) · Linear team `PHI`.

## Develop

```bash
cp .env.example .env          # adjust if needed
pnpm install
pnpm infra:up                 # Postgres + MinIO via docker-compose
pnpm db:migrate               # (after PHI-8)
pnpm db:seed                  # (after PHI-9) load the furnishing data
pnpm dev                      # run auth + api + web
```

- Postgres → `localhost:5432`
- MinIO API → `localhost:9000`, console → `localhost:9001`

## Apps

### Furnishing Planner
Floor-plan-first furnishing budget tracker for apartment S6 — interactive plan, per-room/zone
budgets (planned vs spent), exact areas extracted from the building DWG. See `DESIGN.md`.
