# AGENTS.md — Antropoindicadores v2

Monorepo with three independent deployable targets. There is no shared runtime code between them — treat each as its own package.

## Layout & ownership
- `backend/` — NestJS 11 API (TypeORM + PostgreSQL). Deploys to Fly.io (`fly.toml`, port 3000).
- `web/` — React 19 + Vite admin panel. Deploys to Vercel (`vercel.json`, outputs `web/dist`).
- `mobile/` — React Native (Expo 56) field-researcher app, offline-first via WatermelonDB. Deploys via EAS (`eas.json`).
- `.agents/` and `.memory/` — agent framework config. **Do not edit `.agents/` directly** (repo rule in `.context.md`).

## Commands
Run from repo root (these fan out to all three packages):
- `npm run lint:all` — lint backend + web + mobile
- `npm run test:cov:all` — coverage run across all three

Per package (cd into the dir first):
- backend: `npm run start:dev` (watch) · `npm test` (jest, specs `src/**/*.spec.ts`) · `npm run test:e2e` (jest `test/jest-e2e.json`)
- web: `npm run dev` · `npm test` (vitest) · `npm run test:e2e` (Playwright — needs `npx playwright install` browsers first)
- mobile: `npx expo start` · `npm test` (jest-expo)

CI (`.github/workflows/tests.yml`) uses Node 24: installs deps in root + all three dirs, then runs `lint:all` → `test:cov:all`.

## Database (local)
- `docker-compose.yml` runs PostgreSQL 15 + pgAdmin. Variables come from `.env` (`DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `PG_EMAIL`, `PG_PASS`).
- Bring it up with `docker compose up -d` before starting the backend locally.

## Conventions that differ from defaults
- Backend validates every request through DTOs + `class-validator` via global `ValidationPipe` (whitelist) — never trust raw bodies.
- Auth is JWT (Passport) + bcrypt; `throttler` rate-limits login; `helmet` + restricted CORS are global.
- Surveys are dynamic: question definitions are stored as **JSONB** in Postgres, not as fixed table columns.
- Mobile keeps a local WatermelonDB; `mobile/scripts/patch-watermelondb.js` runs on `postinstall`, so always run `npm install` in `mobile/` (don't copy `node_modules`). `expo doctor` excludes `@nozbe/watermelondb` from the RN directory check by design.

## Git / secrets
- Never commit `.env*`, `node_modules/`, `dist/`, `build/`, `coverage/`, `pg_data/`, `.agents/`, `.memory/` (see `.gitignore` / `.context.md`).
- Conventional commit prefixes (`feat:`, `fix:`, …); one logical change per commit.

## Agent framework (must comply)
This repo ships a multi-agent framework in `.agents/` (personas, skills, rules). On boot, comply with `.agents/ENTRYPOINT.md`:
1. Read and boot `.agents/personas/maestro.md` immediately.
2. Follow the Maestro playbook — it orchestrates personas (Contextualizer, Architect, Coder, Reviewer) and forbids hands-on work by the orchestrator itself.

The team engineering style book is `.agents/AGENTS.md` (loaded as agent instructions). Follow it for naming, structure, and review expectations rather than guessing conventions. Treat `.agents/` as read-only config: do not hand-edit it (repo rule in `.context.md`).
