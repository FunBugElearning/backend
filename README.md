# Smart Akademy Backend (Server)

NestJS backend service for Smart Akademy.

## Tech stack

- NestJS 11
- TypeScript 5
- Prisma 6 (MongoDB - Prisma 7 doesn't support MongoDB yet)
- MongoDB (via Prisma datasource), MongoDB Atlas in production
- Jest 30
- ESLint 9 + Prettier 3
- Package manager: `pnpm`

## Prerequisites

- Node.js 22+
- `pnpm` installed globally
- A MongoDB replica set reachable at `DATABASE_URL` - either the local
  Docker container below, or MongoDB Atlas (always a replica set)

## Environment variables

Create a `.env` file in project root.

Required:

- `DATABASE_URL` - MongoDB connection string used by Prisma. Must point at
  a replica set (`$transaction` requires one) - e.g.
  `mongodb://localhost:27018/smart_academy?replicaSet=rs0` locally, or a
  `mongodb+srv://...` Atlas URI in production.

Optional:

- `PORT` - API port (defaults to `3000`)

## Local MongoDB (Docker)

```bash
docker compose up -d
```

Starts a single-node MongoDB replica set on port 27018 (`smart-academy-mongo`).
The container's healthcheck auto-initiates the replica set on first boot -
wait for `docker ps` to show it `healthy` before connecting.

## Install and generate Prisma client

```bash
pnpm install
pnpm exec prisma generate
```

Important: this project uses Prisma client from `@prisma/client` (not from `src/generated`).

## Database workflow

MongoDB has no `prisma migrate` workflow - schema/index sync is `db push`,
not migrations. (Historical `prisma/migrations/**` is left in the repo from
the old PostgreSQL setup; it's never executed against MongoDB.)

```bash
# Sync the schema's collections/indexes to the database
pnpm run db:push

# Seed reference + sample data (idempotent - safe to re-run)
pnpm exec prisma db seed

# Open Prisma Studio
pnpm exec prisma studio
```

## Run the server

```bash
# Development
pnpm run start:dev

# Normal start
pnpm run start

# Debug watch
pnpm run start:debug

# Production build + run
pnpm run build
pnpm run start:prod
```

## Lint and format

```bash
# Lint all files (auto-fix enabled)
pnpm run lint

# Format src + test
pnpm run format

# Lint one file
pnpm exec eslint "src/users/users.service.ts" --fix

# Check formatting one file
pnpm exec prettier --check "src/users/users.service.ts"
```

## Tests

```bash
# Run all unit tests
pnpm run test

# Watch unit tests
pnpm run test:watch

# Unit coverage
pnpm run test:cov

# Run all e2e tests
pnpm run test:e2e
```

### Run a single unit test file

```bash
# Preferred
pnpm run test -- src/app.controller.spec.ts

# Deterministic path mode
pnpm run test -- --runTestsByPath src/app.controller.spec.ts
```

### Run a single e2e test file

```bash
# Preferred
pnpm run test:e2e -- test/app.e2e-spec.ts

# Deterministic path mode
pnpm run test:e2e -- --runTestsByPath test/app.e2e-spec.ts
```

### Run a single test by name

```bash
# Unit
pnpm run test -- -t "should return \"Hello World!\""

# E2E
pnpm run test:e2e -- -t "GET"
```

## Prisma injection pattern (important)

Prisma is initialized once in `PrismaService` and injected where needed.

- `src/prisma/prisma.service.ts` extends `PrismaClient`
- `src/prisma/prisma.module.ts` provides/exports `PrismaService`
- Feature modules import `PrismaModule`
- Services inject `PrismaService` via constructor DI

Example:

```ts
constructor(private readonly prisma: PrismaService) {}
```

Do not create local Prisma instances in feature services (`new PrismaClient(...)`).

## Project structure

```text
src/
  app.module.ts
  main.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  users/
    users.module.ts
    users.service.ts
    users.resolver.ts
    dto/
    entities/
prisma/
  schema.prisma
test/
  jest-e2e.json
```

## Common troubleshooting

### `ReferenceError: exports is not defined in ES module scope`

Cause: stale/incorrect generated Prisma client output.

Fix:

```bash
pnpm exec prisma generate
pnpm run build
```

Also make sure imports use `@prisma/client`.

### GraphQL decorator import errors

If you see errors from `@nestjs/graphql`, install missing GraphQL packages before building.

## Notes for contributors

- Follow `AGENTS.md` for code style and command conventions.
- Prefer small, focused changes.
- Update tests together with behavior changes.
