# AGENTS.md

High-signal notes for coding agents in `backend/server`.

## Repo shape

- Single NestJS app (not a monorepo). Entrypoint is `src/main.ts`; module wiring is in `src/app.module.ts`.
- Primary API surface is GraphQL via Apollo at `/graphql`; schema is generated to `src/schema.gql` from decorators.
- AppModule loads `users`, `auth`, `auth_sessions`, and `auth_audit_logs` modules.
- Preserve existing `autha_*` and snake_case GraphQL field names unless you are intentionally making a breaking API change.

## Commands

- Use `pnpm` only (`pnpm-lock.yaml` is committed).
- Install: `pnpm install --frozen-lockfile`.
- Dev server: `pnpm run start:dev`.
- Build: `pnpm run build`.
- Lint (auto-fix): `pnpm run lint`.
- Format: `pnpm run format`.
- Unit tests: `pnpm run test`.
- E2E tests: `pnpm run test:e2e`.
- No dedicated typecheck script; use `pnpm exec tsc --noEmit` when needed.

## Focused verification

- Single unit file: `pnpm run test -- src/<feature>/<file>.spec.ts`.
- Deterministic unit path: `pnpm run test -- --runTestsByPath src/<feature>/<file>.spec.ts`.
- Single e2e file: `pnpm run test:e2e -- test/<file>.e2e-spec.ts`.
- Deterministic e2e path: `pnpm run test:e2e -- --runTestsByPath test/<file>.e2e-spec.ts`.
- By test name: `pnpm run test -- -t "<name>"` or `pnpm run test:e2e -- -t "<name>"`.

## Important gotchas

- `test/jest-e2e.json` has no `moduleNameMapper`; absolute imports like `from 'src/...'` fail in e2e tests.
- `test/app.e2e-spec.ts` overrides `PrismaService`, so that test should not need a live DB once imports resolve.
- `PrismaService` (`src/prisma/prisma.service.ts`) is the only Prisma client entrypoint; do not instantiate `PrismaClient` elsewhere.
- `PrismaService` calls `process.loadEnvFile()` and throws if `DATABASE_URL` is missing (Node 22 API).
- Prisma datasource URL is configured in `prisma.config.ts`; it is intentionally not in `prisma/schema.prisma`.
- Generated files: do not hand-edit `src/schema.gql` or `src/generated/prisma/**`.
- Auth JWT helpers require `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` (expiration vars are optional).
- After editing `prisma/schema.prisma`, run `pnpm exec prisma generate`; if models changed, create/apply a migration before testing runtime paths.
