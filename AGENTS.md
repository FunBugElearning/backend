# AGENTS.md

Guide for coding agents working in `backend/server`.
Use repository conventions first; avoid generic NestJS assumptions.

## 1) Project Snapshot

- Stack: NestJS 11, TypeScript 5, Jest 30, ESLint 9, Prettier 3, Prisma 7.
- Package manager: `pnpm` (`pnpm-lock.yaml` present).
- App source root: `src/` (`nest-cli.json` `sourceRoot`).
- Unit tests: `src/**/*.spec.ts` (Jest `rootDir` is `src`).
- E2E tests: `test/**/*.e2e-spec.ts` via `test/jest-e2e.json`.
- Runtime/test environment: Node (`testEnvironment: node`).
- TS module mode: `nodenext` (from `tsconfig.json`).
- Prisma schema: `prisma/schema.prisma`.
- Generated Prisma artifacts are committed under `src/generated/prisma`.

## 2) Rule Precedence (Cursor/Copilot)

Checked in this repository:

- `.cursorrules`: not found
- `.cursor/rules/`: not found
- `.github/copilot-instructions.md`: not found

If any of the files above appear later, treat them as higher-priority instructions than this file.

## 3) Setup and Common Commands

- Install dependencies: `pnpm install`
- Clean lockfile install: `pnpm install --frozen-lockfile`
- List scripts: `pnpm run`
- Build: `pnpm run build`
- Start app: `pnpm run start`
- Start dev watch: `pnpm run start:dev`
- Start debug watch: `pnpm run start:debug`
- Start compiled output: `pnpm run start:prod`

## 4) Lint and Format

- Lint all (auto-fix enabled by script): `pnpm run lint`
- Format `src` and `test`: `pnpm run format`
- Lint one file: `pnpm exec eslint "src/users/users.service.ts" --fix`
- Check one file format: `pnpm exec prettier --check "src/users/users.service.ts"`
- Format one file: `pnpm exec prettier --write "src/users/users.service.ts"`

Notes:

- ESLint config is type-aware (`typescript-eslint` `recommendedTypeChecked`).
- `@typescript-eslint/no-floating-promises` is `warn`; do not ignore it.
- Prettier violations are surfaced through ESLint (`prettier/prettier`).
- Prettier settings: `singleQuote: true`, `trailingComma: all`, `endOfLine: auto`.

## 5) Test Commands (Use Exactly)

Run full suites:

- Unit: `pnpm run test`
- Unit watch: `pnpm run test:watch`
- Unit coverage: `pnpm run test:cov`
- Unit debug: `pnpm run test:debug`
- E2E: `pnpm run test:e2e`

Run one unit test file:

- Preferred: `pnpm run test -- src/users/users.service.spec.ts`
- Name match mode: `pnpm run test -- users.service.spec.ts`
- Deterministic path mode: `pnpm run test -- --runTestsByPath src/users/users.service.spec.ts`

Run one e2e test file:

- Preferred: `pnpm run test:e2e -- test/app.e2e-spec.ts`
- Name match mode: `pnpm run test:e2e -- app.e2e-spec.ts`
- Deterministic path mode: `pnpm run test:e2e -- --runTestsByPath test/app.e2e-spec.ts`

Run tests by case name:

- Unit by name: `pnpm run test -- -t "should be defined"`
- E2E by name: `pnpm run test:e2e -- -t "GET"`

## 6) Prisma Commands

- Generate Prisma client: `pnpm exec prisma generate`
- Create and apply dev migration: `pnpm exec prisma migrate dev --name <migration_name>`
- Apply existing migrations (deploy): `pnpm exec prisma migrate deploy`
- Open Prisma Studio: `pnpm exec prisma studio`

Prisma notes for agents:

- Do not hand-edit generated files under `src/generated/prisma`.
- Keep `schema.prisma`, DTOs, entities, and service usage aligned in one change.
- `PrismaService` depends on `DATABASE_URL`; avoid code paths that mask missing env errors.

## 7) TypeScript Expectations

- Keep strict null discipline (`strictNullChecks: true`).
- `noImplicitAny` is disabled, but still avoid introducing implicit `any`.
- Prefer explicit return types on exported/public functions and class methods.
- Narrow unknown inputs with guards instead of broad assertions.
- Keep decorators and metadata assumptions intact for Nest/GraphQL.
- Preserve module semantics (`module` and `moduleResolution` are `nodenext`).

## 8) Code Style Guidelines

Formatting:

- Let Prettier and ESLint own formatting; do not manually micro-format.
- Keep files free of dead code and unused symbols.
- Use ASCII by default unless file content already requires Unicode.

Imports:

- Keep all imports at top of file.
- Group in order: external packages, internal absolute aliases (if introduced), relative imports.
- Prefer named imports over namespace imports unless there is a clear need.
- Keep import paths stable; avoid unnecessary path churn.

Naming and file layout:

- Classes/interfaces/enums: `PascalCase`.
- Functions/methods/variables: `camelCase`.
- Constants and env keys: `UPPER_SNAKE_CASE`.
- Keep Nest naming conventions: `*.module.ts`, `*.service.ts`, `*.resolver.ts`, `*.controller.ts`, `*.spec.ts`.
- Keep DTOs in `dto/` and entities in `entities/` within feature modules.

Architecture:

- Resolver/controller layers should stay thin (transport and mapping only).
- Services should own business rules and data orchestration.
- Modules should declare only required `imports`, `providers`, `controllers`, and `exports`.
- Prefer dependency injection over constructing collaborators manually.

Error handling and logging:

- Throw explicit Nest exceptions for expected client-facing errors.
- Do not swallow errors; either rethrow or map with useful context.
- Never log secrets, access tokens, passwords, or connection strings.
- Await promises intentionally; avoid floating promises in application code.

Async and data behavior:

- Prefer `async/await` for readability.
- Use `Promise.all`/`Promise.allSettled` for deliberate parallel work.
- Keep DB write operations explicit and predictable; avoid hidden side effects.

## 9) Testing Guidelines

- Follow Arrange-Act-Assert structure.
- Keep unit tests isolated and mock external boundaries.
- Use e2e tests to verify actual HTTP bootstrap behavior.
- Keep tests deterministic (no accidental time/network dependency).
- Update or add tests in the same change when behavior changes.

## 10) Agent Workflow Checklist

- Read relevant configs before changing conventions: `eslint.config.mjs`, `.prettierrc`, `tsconfig.json`, `test/jest-e2e.json`.
- Make the smallest safe change that solves the requested task.
- Prefer targeted validation first (single-file lint/test or `-t` pattern).
- Run broader validation for cross-cutting changes.
- Do not commit secrets or `.env` contents.
- Keep documentation and scripts synchronized with behavior changes.
