# Smart Akademy Backend (Server)

NestJS backend service for Smart Akademy.

## Tech stack

- NestJS 11
- TypeScript 5
- Prisma 7
- PostgreSQL (via Prisma datasource)
- Jest 30
- ESLint 9 + Prettier 3
- Package manager: `pnpm`

## Prerequisites

- Node.js 22+
- `pnpm` installed globally
- Running PostgreSQL database

## Environment variables

Create a `.env` file in project root.

Required:

- `DATABASE_URL` - PostgreSQL connection string used by Prisma

Optional:

- `PORT` - API port (defaults to `3000`)

## Install and generate Prisma client

```bash
pnpm install
pnpm exec prisma generate
```

Important: this project uses Prisma client from `@prisma/client` (not from `src/generated`).

## Database workflow

```bash
# Create and apply a new migration in local development
pnpm exec prisma migrate dev --name <migration_name>

# Apply existing migrations (deployment/CI)
pnpm exec prisma migrate deploy

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
