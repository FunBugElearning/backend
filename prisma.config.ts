// MongoDB (unlike Postgres) reads its connection string straight from
// schema.prisma's `url = env("DATABASE_URL")`, and has no `prisma migrate`
// workflow - schema sync happens via `prisma db push` instead. So this file
// only needs to point at the schema and the seed script.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "ts-node --transpile-only prisma/seed.ts",
  },
});
