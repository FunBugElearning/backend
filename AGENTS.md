# AGENTS.md

High-signal notes for coding agents in `backend/server`.

## Repo shape (what is easy to guess wrong)

- Single NestJS service (not a monorepo package set). Entrypoint: `src/main.ts`; wiring: `src/app.module.ts`.
- Primary API surface is GraphQL via Apollo at `/graphql`; schema file is `src/schema.gql` and is auto-generated from decorators.
- Main feature modules are `users`, `auth`, `auth_sessions`, `autha_audit_logs`.
- Keep existing `autha_*` / snake_case field names unless intentionally making a breaking API change.

## Commands that matter

- Use `pnpm` only; lockfile is `pnpm-lock.yaml`.
- Install: `pnpm install --frozen-lockfile`.
- Dev server: `pnpm run start:dev`.
- Build: `pnpm run build`.
- Lint (auto-fixes): `pnpm run lint`.
- Format: `pnpm run format`.
- Unit tests: `pnpm run test`.
- E2E tests: `pnpm run test:e2e`.

## Focused verification shortcuts

- Single unit file: `pnpm run test -- src/<feature>/<file>.spec.ts`.
- Deterministic unit path: `pnpm run test -- --runTestsByPath src/<feature>/<file>.spec.ts`.
- Single e2e file: `pnpm run test:e2e -- test/<file>.e2e-spec.ts`.
- Deterministic e2e path: `pnpm run test:e2e -- --runTestsByPath test/<file>.e2e-spec.ts`.
- By test name: `pnpm run test -- -t "<name>"` or `pnpm run test:e2e -- -t "<name>"`.

## Prisma and DB quirks

- `PrismaService` (`src/prisma/prisma.service.ts`) is the only Prisma client entrypoint; do not create `new PrismaClient()` in feature code.
- `PrismaService` throws if `DATABASE_URL` is missing; it tries `process.loadEnvFile()` first.
- Prisma datasource URL is provided in `prisma.config.ts` (not inside `prisma/schema.prisma`).
- Use imports from `@prisma/client`; do not switch app code to `src/generated/prisma`.
- Local DB helper: `docker-compose.yml` runs Postgres 16 on host port `5433` with trust auth.

## Generated artifacts and codegen

- `src/schema.gql` is generated; do not hand-edit.
- GraphQL schema regeneration happens when the Nest app boots (for example `pnpm run start:dev` or tests that bootstrap `AppModule`), not from plain `pnpm run build`.
- `src/generated/prisma/**` exists as generated code; treat as generated and avoid manual edits.

## Test/runtime behavior worth knowing

- Unit Jest `rootDir` is `src` (see `package.json`), so unit test paths are under `src/...`.
- E2E Jest config is `test/jest-e2e.json` with `rootDir` set to `test`.
- `test/jest-e2e.json` does not define `moduleNameMapper`; absolute imports like `src/...` can break e2e runs.
- Current `test/app.e2e-spec.ts` overrides `PrismaService`, so that test does not require a live DB.

## Instruction precedence

- Additional agent instruction files currently absent: `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`.
- If any of those appear later, treat them as higher priority than this file.
