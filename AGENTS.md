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

- Database is MongoDB (Prisma 6.x - MongoDB isn't supported on Prisma 7 yet).
  `PrismaService` calls plain `new PrismaClient()`, no driver adapter.
- `PrismaService` auto-loads `.env` and throws if `DATABASE_URL` missing
- After schema changes: `pnpm exec prisma generate` then `pnpm run db:push`
  (MongoDB has no `prisma migrate` workflow - schema sync is `db push`, not
  migrations. Historical `prisma/migrations/**` is old Postgres history, not
  executed against Mongo.)
- Import from `@prisma/client`, NOT `src/generated/prisma`
- Datasource URL is in `prisma/schema.prisma` (`url = env("DATABASE_URL")`),
  standard for Prisma's MongoDB connector
- Every model's `id` is an application-assigned `Int` (not ObjectId),
  generated via `IdSequenceService` (`src/prisma/id-sequence.service.ts`) -
  every `.create()`/`.upsert()` call must supply `id: await
  idSequence.next('ModelName')`. This keeps ids identical in shape to the
  old Postgres autoincrement ids, so the GraphQL contract and frontend
  didn't need to change.
- No `mode: 'insensitive'` on MongoDB - case-insensitive search goes
  through either a lowercased shadow field (`User.nameLower`/`emailLower`)
  or `$runCommandRaw` with a regex filter (see
  `../utils/mongo-search.utils.ts`)
- Local dev: `docker compose up -d` runs a single-node MongoDB replica set
  (required for `$transaction`, which MongoDB only supports on a replica
  set) on port 27018, auto-initiated via the container's healthcheck

## GraphQL conventions

- Preserve existing snake_case field names and typos like `refresh_toke_hash`
- Apollo Server context: `({ req }: { req: Request }) => ({ req })`

## Test quirks

- Jest configs lack `moduleNameMapper` for `src/*`
- Absolute imports fail in e2e tests despite working in build
- `test/app.e2e-spec.ts` mocks `PrismaService` - import resolution is the real blocker
