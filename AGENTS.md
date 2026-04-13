# AGENTS.md

High-signal notes for coding agents in `backend/server`.

## Repo shape

- Single NestJS app (not a monorepo). Entrypoint: `src/main.ts`; module wiring: `src/app.module.ts`.
- API is GraphQL via Apollo at `/graphql`; decorator schema output is `src/schema.gql`.
- `AppModule` loads `UsersModule`, `AuthModule`, `AuthSessionsModule`, and `AuthAuditLogsModule`.
- Existing GraphQL/API names keep snake_case fields and legacy typos like `refresh_toke_hash`; preserve them unless doing an explicit breaking change.

## Commands

- Use `pnpm` only.
- Install deps: `pnpm install` (use `--frozen-lockfile` for reproducible CI-style installs).
- Dev server: `pnpm run start:dev`.
- Build: `pnpm run build`.
- Lint (auto-fix): `pnpm run lint`.
- Format: `pnpm run format`.
- Unit tests: `pnpm run test`.
- E2E tests: `pnpm run test:e2e`.
- Typecheck (no script exists): `pnpm exec tsc --noEmit`.

## Focused verification

- Single unit file: `pnpm run test -- src/<feature>/<file>.spec.ts`.
- Deterministic unit path: `pnpm run test -- --runTestsByPath src/<feature>/<file>.spec.ts`.
- Single e2e file: `pnpm run test:e2e -- test/<file>.e2e-spec.ts`.
- Deterministic e2e path: `pnpm run test:e2e -- --runTestsByPath test/<file>.e2e-spec.ts`.
- By test name: `pnpm run test -- -t "<name>"` or `pnpm run test:e2e -- -t "<name>"`.

## Prisma and env gotchas

- `PrismaService` (`src/prisma/prisma.service.ts`) is the only Prisma client entrypoint; do not create `new PrismaClient()` in feature code.
- `PrismaService` calls `process.loadEnvFile()` and throws if `DATABASE_URL` is still missing.
- Prisma datasource URL lives in `prisma.config.ts` (not in `prisma/schema.prisma`).
- After editing `prisma/schema.prisma`, run `pnpm exec prisma generate`; if model shape changed, run/apply a migration before runtime testing.
- Auth token helpers require `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` (expiration vars are optional).

## Test quirks that cause false failures

- Neither Jest config (`package.json` unit config nor `test/jest-e2e.json`) defines `moduleNameMapper` for `src/*`.
- Absolute imports like `from 'src/helper/logger'` fail in tests/e2e (`Cannot find module ...`) even if app build succeeds.
- `test/app.e2e-spec.ts` overrides `PrismaService`, so DB is not the first blocker; import resolution is.

## Generated / build artifacts

- Do not hand-edit `src/schema.gql`, `src/generated/prisma/**`, or `dist/**`.
- For Prisma usage in app code, import from `@prisma/client` (not `src/generated/prisma`).
