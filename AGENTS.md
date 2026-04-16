# AGENTS.md

High-signal notes for coding agents in `backend/server`.

## Architecture

- Single NestJS app (not a monorepo). Entrypoint: `src/main.ts`; module wiring: `src/app.module.ts`.
- GraphQL API via Apollo at `/graphql`; schema output: `src/schema.gql`.
- `PrismaService` is the only Prisma client entrypoint - never create `new PrismaClient()` in feature code.

## Commands

- Use `pnpm` only (not npm/yarn).
- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm run start:dev`
- Build: `pnpm run build`
- Lint: `pnpm run lint` (auto-fix enabled)
- Format: `pnpm run format`
- Typecheck: `pnpm exec tsc --noEmit`

## Testing

- Unit: `pnpm run test` or `pnpm run test -- src/feature/file.spec.ts`
- E2E: `pnpm run test:e2e` or `pnpm run test:e2e -- test/file.e2e-spec.ts`
- By name: `pnpm run test -- -t "test name"` or `pnpm run test:e2e -- -t "test name"`

## Prisma gotchas

- `PrismaService` auto-loads `.env` and throws if `DATABASE_URL` missing
- After schema changes: `pnpm exec prisma generate` + migrate if models changed
- Import from `@prisma/client`, NOT `src/generated/prisma`
- Datasource URL in environment (not schema file)

## GraphQL conventions

- Preserve existing snake_case field names and typos like `refresh_toke_hash`
- Apollo Server context: `({ req }: { req: Request }) => ({ req })`

## Test quirks

- Jest configs lack `moduleNameMapper` for `src/*`
- Absolute imports fail in e2e tests despite working in build
- `test/app.e2e-spec.ts` mocks `PrismaService` - import resolution is the real blocker
