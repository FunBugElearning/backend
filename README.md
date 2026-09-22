# LearnLens Backend (Server)

NestJS + GraphQL backend service for **LearnLens**, a classroom-management
platform (classes, attendance, assignments, grading, auto-graded quizzes,
sections/lessons, and notifications). Pairs with the
[LearnLens frontend](https://github.com/FunBugElearning/frontend) - see that
repo's README for the Next.js client, and "Running the full stack" below for
how the two fit together.

- **Production API:** https://backend-seven-sigma-69.vercel.app/graphql
- **Production app:** https://frontend-o5wv.vercel.app

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

Copy `.env.example` to `.env` and fill in real values. Never commit the real
`.env` file.

Required:

- `DATABASE_URL` - MongoDB connection string used by Prisma. Must point at
  a replica set (`$transaction` requires one) - e.g.
  `mongodb://localhost:27018/smart_academy?replicaSet=rs0` locally, or a
  `mongodb+srv://...` Atlas URI in production (MongoDB Atlas).
- `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` - JWT signing secrets.
  Generate real random values for any non-local environment, e.g.
  `openssl rand -hex 32`. The server fails to start if these are unset.
- `CORS_ORIGIN` - comma-separated list of allowed frontend origins. The
  frontend's GraphQL client sends credentials, so this must be an explicit
  origin (never `*`) with credentials enabled.

Optional:

- `PORT` - API port (defaults to `8080`)
- `ACCESS_TOKEN_EXPIRATION` / `REFRESH_TOKEN_EXPIRATION` - token lifetimes,
  jsonwebtoken-style strings (e.g. `15m`, `21d`). Default to `15m` / `30d`.
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token, used by the `uploadImage`
  mutation to store uploaded images. Set automatically when a Vercel Blob
  store is connected to the project; without it, image upload fails (every
  other feature works fine).

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

Each domain lives in its own `src/<feature>/` module (`users`, `classes`,
`sections`, `lessons`, `assignments`, `quizzes`, `attendance`, `grades`,
`gradebook`, `grade-categories`, `submissions`, `notifications`, `uploads`,
`dashboard`, `auth`), each with a resolver, service, DTOs, and entities,
following the `users` layout above.

## GraphQL API overview

Single endpoint at `/graphql` (Apollo Server, schema auto-generated to
`src/schema.gql` from the `@Field`/`@ObjectType`/`@InputType` decorators -
don't hand-edit that file). Auth is a Bearer JWT on the `Authorization`
header, verified per-resolver (see "Authorization pattern" below), not
global Nest Guards.

Core domain, roughly in dependency order:

- **Auth**: `registerAuth`/`loginAuth`/`refreshToken` mutations. Public
  registration always creates a `student` account regardless of any `role`
  the client sends.
- **Users**: admin-only CRUD (`createTeacher`/`createStudent`/`updateUser`/
  `removeUser`), plus the paginated/searchable/filterable `paginatedUsers`
  query used by the admin Students/Teachers screens.
- **Classes**: CRUD, teacher/student membership management, paginated +
  searchable + teacher-filterable `classes` query.
- **Sections / Lessons**: real content-organization entities under a class
  (`Section` has many `Lesson`s) - independent of Assignments, not a reuse
  of `Assignment.topic`.
- **Assignments**: `type: standard | quiz`. Standard assignments are
  free-text/file submissions graded manually (`gradeSubmission`). Quiz
  assignments have a linked `Quiz` (see below) and are graded automatically
  on submission.
- **Quizzes** (auto-grading): `createQuiz`/`updateQuiz` (admin/teacher,
  includes the answer key) define multiple-choice questions on a
  `type: quiz` assignment. Students fetch `quizToTake` - a **separate**
  GraphQL type with no `isCorrect` field anywhere on it, so the answer key
  cannot leak regardless of what a client requests - then call
  `submitQuizAttempt`, which scores the answers server-side, creates a
  normal `Submission` (so it appears in the usual gradebook/notification
  flow), and auto-creates a `Grade`. One attempt per student per quiz.
- **Attendance**: sessions + per-student records, teacher-of-class only.
- **Uploads**: `uploadImage` mutation (any authenticated user) - takes a
  base64 image, stores it in Vercel Blob, returns a persisted URL to attach
  via an assignment's/submission's existing `attachFiles` field.
- **Notifications**: created server-side on enrollment/assignment-published/
  submission-received/submission-graded/attendance-updated events; read via
  a per-user query, `markAsRead`/`markAllAsRead` mutations.

### Authorization pattern

Not Nest Guards - resolver methods call helper functions from
`src/middleware/role-authorization.middleware.ts`
(`verifyAdminRole`/`verifyAdminTeacherRole`/`verifyAuthenticatedUser`), then
apply per-resource ownership checks inline (e.g. "is this teacher assigned
to this class"). When adding a new resolver that touches a class's data,
follow the existing pattern in `classes.resolver.ts`
(`assertCanViewClassMembers`) or `assignments.resolver.ts`
(`assertCanViewAssignmentClass`) rather than inventing a new one.

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

## Production deployment

Deployed on Vercel, building via `vercel-build` (`prisma generate && nest
build`). Vercel does **not** run `prisma db push` automatically - after a
schema change lands on `main`, run `pnpm run db:push` once against the
production `DATABASE_URL` to sync indexes/constraints. MongoDB has no
traditional migrations, so this is safe to run repeatedly (see "Database
workflow" above); new fields are additive/nullable, so the app keeps working
against old documents even before `db:push` runs, just without the new
field's index until then.

Required production environment variables (Vercel project settings):
`DATABASE_URL` (Atlas), `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`,
`CORS_ORIGIN` (the deployed frontend's origin), `BLOB_READ_WRITE_TOKEN`
(from a connected Vercel Blob store, for image upload).

## Running the full stack

This backend and the [LearnLens frontend](https://github.com/FunBugElearning/frontend)
are separate repositories/deployments:

1. Start this backend first (`pnpm run start:dev`, see "Run the server"
   above) - it needs its own `.env` and a running MongoDB replica set.
2. Clone the frontend repo, set its `NEXT_PUBLIC_GRAPHQL_URL` to point at
   this backend (`http://localhost:8080/graphql` locally), and run it per
   that repo's own README.
3. Seed data (`pnpm exec prisma db seed`) creates demo accounts you can log
   into from the frontend - see that repo's README for the actual
   credentials, since they're account details rather than backend config.

In production the two are already wired together: the deployed frontend's
`NEXT_PUBLIC_GRAPHQL_URL` points at this backend's `/graphql`, and this
backend's `CORS_ORIGIN` allows the deployed frontend's origin.

## Notes for contributors

- Follow `AGENTS.md` for code style and command conventions.
- Prefer small, focused changes.
- Update tests together with behavior changes.
